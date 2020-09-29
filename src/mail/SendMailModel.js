// @flow
import type {ConversationTypeEnum, MailMethodEnum} from "../api/common/TutanotaConstants"
import {ConversationType, MAX_ATTACHMENT_SIZE, OperationType, ReplyType} from "../api/common/TutanotaConstants"
import {load, setup, update} from "../api/main/Entity"
import type {RecipientInfo} from "../api/common/RecipientInfo"
import {isExternal} from "../api/common/RecipientInfo"
import {
	AccessBlockedError,
	LockedError,
	NotAuthorizedError,
	NotFoundError,
	PreconditionFailedError,
	TooManyRequestsError
} from "../api/common/error/RestError"
import {UserError} from "../api/common/error/UserError"
import {assertMainOrNode} from "../api/Env"
import {getPasswordStrength} from "../misc/PasswordUtils"
import {assertNotNull, downcast, neverNull} from "../api/common/utils/Utils"
import {
	createRecipientInfo,
	getDefaultSender,
	getEmailSignature,
	getEnabledMailAddressesWithUser,
	getMailboxName,
	getSenderNameForUser,
	parseMailtoUrl,
	resolveRecipientInfo,
	resolveRecipientInfoContact
} from "./MailUtils"
import type {File as TutanotaFile} from "../api/entities/tutanota/File"
import {FileTypeRef} from "../api/entities/tutanota/File"
import {ConversationEntryTypeRef} from "../api/entities/tutanota/ConversationEntry"
import type {Mail} from "../api/entities/tutanota/Mail"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import type {Contact} from "../api/entities/tutanota/Contact"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {isSameId, stringToCustomId} from "../api/common/EntityFunctions"
import {FileNotFoundError} from "../api/common/error/FileNotFoundError"
import type {LoginController} from "../api/main/LoginController"
import type {MailAddress} from "../api/entities/tutanota/MailAddress"
import type {MailboxDetail} from "./MailModel"
import {MailModel} from "./MailModel"
import {LazyContactListId} from "../contacts/ContactUtils"
import {RecipientNotResolvedError} from "../api/common/error/RecipientNotResolvedError"
import stream from "mithril/stream/stream.js"
import type {EntityEventsListener, EntityUpdateData} from "../api/main/EventController"
import {EventController, isUpdateForTypeRef} from "../api/main/EventController"
import {isMailAddress} from "../misc/FormatValidator"
import {createApprovalMail} from "../api/entities/monitor/ApprovalMail"
import type {EncryptedMailAddress} from "../api/entities/tutanota/EncryptedMailAddress"
import {findAndRemove, remove, replace} from "../api/common/utils/ArrayUtils"
import type {ContactModel} from "../contacts/ContactModel"
import type {Language, TranslationKey} from "../misc/LanguageViewModel"
import {_getSubstitutedLanguageCode, getAvailableLanguageCode, lang, languages} from "../misc/LanguageViewModel"
import {RecipientsNotFoundError} from "../api/common/error/RecipientsNotFoundError"
import {checkApprovalStatus} from "../misc/LoginUtils"
import type {IUserController} from "../api/main/UserController"
import {getTemplateLanguages} from "./MailEditorUtils"
import {easyMatch} from "../api/common/utils/StringUtils"
import {WorkerClient} from "../api/main/WorkerClient"

assertMainOrNode()

export type Recipient = {name: ?string, address: string, contact?: ?Contact}
export type RecipientList = $ReadOnlyArray<Recipient>
export type Recipients = {to?: RecipientList, cc?: RecipientList, bcc?: RecipientList}

// Because MailAddress does not have contact of the right type (event when renamed on Recipient) MailAddress <: Recipient does not hold
export function mailAddressToRecipient({address, name}: MailAddress): Recipient {
	return {name, address}
}

export type Attachment = TutanotaFile | DataFile | FileReference
export type RecipientField = "to" | "cc" | "bcc"

/**
 * Model which allows sending mails interactively - including resolving of recipients and handling of drafts.
 */
export class SendMailModel {
	_worker: WorkerClient;
	_logins: LoginController;
	_mailModel: MailModel;
	_contactModel: ContactModel;
	_eventController: EventController;
	_mailboxDetails: MailboxDetail;

	_conversationType: ConversationTypeEnum;
	_subject: string;// we're setting subject to the value of the subject TextField in the MailEditorN
	_body: string;
	_draft: ?Mail;
	_toRecipients: Array<RecipientInfo>;
	_ccRecipients: Array<RecipientInfo>;
	_bccRecipients: Array<RecipientInfo>;
	_senderAddress: string;
	_isConfidential: boolean;
	_attachments: Array<Attachment>; // contains either Files from Tutanota or DataFiles of locally loaded files. these map 1:1 to the _attachmentButtons
	_replyTos: Array<RecipientInfo>;
	_previousMessageId: ?Id; // only needs to be the correct value if this is a new email. if we are editing a draft, conversationType is not used
	_previousMail: ?Mail;

	_selectedNotificationLanguage: string;
	_availableNotificationTemplateLanguages: Array<Language>

	_entityEventReceived: EntityEventsListener;
	_mailChanged: boolean;

	onMailChanged: Stream<boolean>

	recipientsChanged: Stream<void>

	onRecipientAdded: Stream<?{addedRecipient: RecipientInfo, addedField: RecipientField}>
	onRecipientContactUpdated: Stream<?{oldRecipient: RecipientInfo, updatedRecipient: RecipientInfo, updatedField: RecipientField}>
	onRecipientRemoved: Stream<?{removedRecipient: RecipientInfo, removedField: RecipientField}>

	/**
	 * creates a new empty draft message. calling an init method will fill in all the blank data
	 * @param logins
	 * @param mailModel
	 * @param contactModel
	 * @param eventController
	 * @param mailboxDetails
	 */
	constructor(worker: WorkerClient, logins: LoginController, mailModel: MailModel, contactModel: ContactModel, eventController: EventController,
	            mailboxDetails: MailboxDetail) {
		this._worker = worker
		this._logins = logins
		this._mailModel = mailModel
		this._contactModel = contactModel
		this._eventController = eventController
		this._mailboxDetails = mailboxDetails

		const userProps = this._logins.getUserController().props

		this._conversationType = ConversationType.NEW
		this._subject = ""
		this._body = ""
		this._draft = null
		this._toRecipients = []
		this._ccRecipients = []
		this._bccRecipients = []
		this._senderAddress = getDefaultSender(this._logins, this._mailboxDetails)
		this._isConfidential = !userProps.defaultUnconfidential
		this._attachments = []
		this._replyTos = []
		this._previousMessageId = null
		this._previousMail = null


		this._selectedNotificationLanguage = getAvailableLanguageCode(userProps.notificationMailLanguage || lang.code)
		// sort list of all languages alphabetically
		// then we see if the user has custom notification templates,
		// in which case we replace the list with just the templates that the user has specified
		this._availableNotificationTemplateLanguages = languages.slice().sort((a, b) => lang.get(a.textId).localeCompare(lang.get(b.textId)))
		getTemplateLanguages(this._availableNotificationTemplateLanguages)
			.then((filteredLanguages) => {
				if (filteredLanguages.length > 0) {
					const languageCodes = filteredLanguages.map(l => l.code)
					this._selectedNotificationLanguage =
						_getSubstitutedLanguageCode(userProps.notificationMailLanguage || lang.code, languageCodes)
						|| languageCodes[0]
					this._availableNotificationTemplateLanguages = filteredLanguages
				}
			})

		this._entityEventReceived = (updates) => {
			return Promise.each(updates, update => {
				return this._handleEntityEvent(update)
			}).return()
		}
		this._eventController.addEntityListener(this._entityEventReceived)

		this._mailChanged = false

		this.onMailChanged = stream(false)

		this.recipientsChanged = stream(undefined)

		this.onRecipientAdded = stream(null)
		this.onRecipientContactUpdated = stream(null)
		this.onRecipientRemoved = stream(null)
	}

	logins(): LoginController {
		return this._logins
	}

	user(): IUserController {
		return this.logins().getUserController()
	}

	contacts(): ContactModel {
		return this._contactModel
	}

	mails(): MailModel {
		return this._mailModel
	}

	events(): EventController {
		return this._eventController
	}

	getPreviousMail(): ?Mail {
		return this._previousMail
	}

	getMailboxDetails(): MailboxDetail {
		return this._mailboxDetails
	}

	getConversationType(): ConversationTypeEnum {
		return this._conversationType
	}

	setPassword(recipient: RecipientInfo, password: string) {
		if (recipient.contact) {
			recipient.contact.presharedPassword = password
		}
		this.setMailChanged(true)
	}

	getPassword(recipientInfo: RecipientInfo): string {
		return recipientInfo.contact && recipientInfo.contact.presharedPassword || ""
	}

	getConfidentialStateTranslationKey(): TranslationKey {
		return this._isConfidential
			? 'confidentialStatus_msg'
			: 'nonConfidentialStatus_msg'
	}

	getSubject(): string {
		return this._subject
	}

	setSubject(subject: string) {
		this._mailChanged = subject.trim() !== this._subject
		this._subject = subject.trim()

	}

	getBody(): string {
		return this._body
	}

	setBody(body: string) {
		this._body = body
		this.setMailChanged(true)
	}

	selectSender(senderAddress: string) {
		this._senderAddress = senderAddress
	}

	getPasswordStrength(recipientInfo: RecipientInfo) {
		const contact = assertNotNull(recipientInfo.contact)
		let reserved = this.getEnabledMailAddresses().concat(
			getMailboxName(this._logins, this._mailboxDetails),
			recipientInfo.mailAddress,
			recipientInfo.name
		)
		return Math.min(100, getPasswordStrength(contact.presharedPassword || "", reserved) / 0.8)
	}

	getEnabledMailAddresses(): Array<string> {
		return getEnabledMailAddressesWithUser(this._mailboxDetails, this._logins.getUserController().userGroupInfo)
	}

	hasMailChanged(): boolean {
		return this._mailChanged
	}

	setMailChanged(hasChanged: boolean) {
		this._mailChanged = hasChanged
		this.onMailChanged(hasChanged) // if this method is called wherever state gets changed, onMailChanged should function properly
	}


	initAsResponse({
		               previousMail, conversationType, senderMailAddress, recipients, attachments, subject, bodyText, replyTos,
		               addSignature
	               }: {
		previousMail: Mail,
		conversationType: ConversationTypeEnum,
		senderMailAddress: string,
		recipients: Recipients,
		attachments: $ReadOnlyArray<TutanotaFile>,
		subject: string,
		bodyText: string,
		replyTos: EncryptedMailAddress[],
		addSignature: boolean,
	}): Promise<SendMailModel> {
		if (addSignature) {
			bodyText = "<br/><br/><br/>" + bodyText
			let signature = getEmailSignature()
			if (this._logins.getUserController().isInternalUser() && signature) {
				bodyText = signature + bodyText
			}
		}
		let previousMessageId: ?string = null
		return load(ConversationEntryTypeRef, previousMail.conversationEntry)
			.then(ce => {
				previousMessageId = ce.messageId
			})
			.catch(NotFoundError, e => {
				console.log("could not load conversation entry", e);
			})
			.then(() => {
				return this.init({
					conversationType,
					subject,
					bodyText,
					recipients,
					senderMailAddress,
					confidential: previousMail.confidential,
					attachments,
					replyTos,
					previousMail,
					previousMessageId
				})
			})
	}

	/**
	 *
	 * @param recipients
	 * @param subject
	 * @param bodyText
	 * @param nondefaultSignature: a value of "" will be used as the signature, null or undefined will revert to the default for the user
	 * @param confidential
	 * @param senderMailAddress
	 * @returns {Promise<SendMailModel>}
	 */
	initWithTemplate(
		recipients: Recipients,
		subject: string,
		bodyText: string,
		confidential: ?boolean,
		senderMailAddress?: string): Promise<SendMailModel> {
		return this.init({
			conversationType: ConversationType.NEW,
			subject,
			bodyText,
			recipients,
			confidential: confidential || undefined,
			senderMailAddress
		})
	}

	initWithMailtoUrl(mailtoUrl: string, confidential: boolean): Promise<SendMailModel> {

		const {to, cc, bcc, subject, body} = parseMailtoUrl(mailtoUrl)
		const recipients: Recipients = {
			to: to.map(mailAddressToRecipient),
			cc: cc.map(mailAddressToRecipient),
			bcc: bcc.map(mailAddressToRecipient),
		}

		let signature = getEmailSignature()
		const bodyText = this._logins.getUserController.isInternalUser() && signature ? body + signature : body

		return this.init({
			conversationType: ConversationType.NEW,
			subject,
			bodyText,
			confidential,
			recipients,
		})
	}

	initFromDraft(draft: Mail, attachments: TutanotaFile[], bodyText: string,): Promise<SendMailModel> {
		let conversationType: ConversationTypeEnum = ConversationType.NEW
		let previousMessageId: ?string = null
		let previousMail: ?Mail = null

		return load(ConversationEntryTypeRef, draft.conversationEntry).then(ce => {
			conversationType = downcast(ce.conversationType)
			if (ce.previous) {
				return load(ConversationEntryTypeRef, ce.previous).then(previousCe => {
					previousMessageId = previousCe.messageId
					if (previousCe.mail) {
						return load(MailTypeRef, previousCe.mail).then(mail => {
							previousMail = mail
						})
					}
				}).catch(NotFoundError, e => {
					// ignore
				})
			}
		}).then(() => {
			const {confidential, sender, toRecipients, ccRecipients, bccRecipients, subject, replyTos} = draft
			const recipients: Recipients = {
				to: toRecipients.map(mailAddressToRecipient),
				cc: ccRecipients.map(mailAddressToRecipient),
				bcc: bccRecipients.map(mailAddressToRecipient),
			}
			return this.init({
				conversationType: ConversationType.NEW,
				subject,
				bodyText,
				recipients,
				draft,
				sender: sender.address,
				confidential,
				attachments,
				replyTos,
				previousMail,
				previousMessageId
			})
		})
	}


	init({
		     conversationType,
		     subject,
		     bodyText,
		     draft,
		     recipients,
		     senderMailAddress,
		     confidential,
		     attachments,
		     replyTos,
		     previousMail,
		     previousMessageId,
	     }: {
		conversationType: ConversationTypeEnum,
		subject: string,
		bodyText: string,
		recipients: Recipients,
		draft?: ?Mail,
		senderMailAddress?: string,
		confidential?: boolean,
		attachments?: $ReadOnlyArray<TutanotaFile>,
		replyTos?: EncryptedMailAddress[],
		previousMail?: ?Mail,
		previousMessageId?: ?string,
	}): Promise<SendMailModel> {
		this._conversationType = conversationType
		this._subject = subject
		this._body = bodyText
		this._draft = draft || null
		const {to = [], cc = [], bcc = []} = recipients
		const makeRecipientInfo = (r: Recipient) => this._createAndResolveRecipientInfo(r.name, r.address, r.contact, false)
		this._toRecipients = to.filter(r => isMailAddress(r.address, false))
		                       .map(makeRecipientInfo)
		this._ccRecipients = cc.filter(r => isMailAddress(r.address, false))
		                       .map(makeRecipientInfo)
		this._bccRecipients = bcc.filter(r => isMailAddress(r.address, false))
		                         .map(makeRecipientInfo)

		console.log(this._toRecipients)
		this._senderAddress = senderMailAddress || getDefaultSender(this._logins, this._mailboxDetails)
		this._isConfidential = confidential != null && confidential || !this.user().props.defaultUnconfidential
		this._attachments = []
		if (attachments) this.attachFiles(attachments)
		this._replyTos = (replyTos || []).map(ema => {
			const ri = createRecipientInfo(ema.address, ema.name, null)
			if (this._logins.isInternalUserLoggedIn()) {
				resolveRecipientInfoContact(ri, this._contactModel, this._logins.getUserController().user)
					.then(() => this.setMailChanged(true))
			}
			return ri
		})
		this._previousMail = previousMail || null
		this._previousMessageId = previousMessageId || null

		this._mailChanged = false
		return Promise.resolve(this)
	}


	/**
	 * Either make a new recipient info or returns a recipient info that exists
	 * @param name
	 * @param address
	 * @param contact
	 * @param resolveLazily
	 * @returns {RecipientInfo}
	 * @private
	 */
	_createAndResolveRecipientInfo(name: ?string, address: string, contact: ?Contact, resolveLazily: boolean): RecipientInfo {
		const ri = createRecipientInfo(address, name, contact)
		if (!resolveLazily) {
			if (this._logins.isInternalUserLoggedIn()) {
				resolveRecipientInfoContact(ri, this._contactModel, this._logins.getUserController().user).then(_ => this.setMailChanged(true))
			}
			resolveRecipientInfo(this._mailModel, ri).then().then(_ => this.setMailChanged(true))
		}
		return ri
	}

	getRecipientList(type: RecipientField): Array<RecipientInfo> {
		switch (type) {
			case "to":
				return this._toRecipients
			case "cc":
				return this._ccRecipients
			case "bcc":
				return this._bccRecipients
			default:
				return this._toRecipients
		}
	}

	toRecipients(): $ReadOnlyArray<RecipientInfo> {
		return this._toRecipients
	}

	ccRecipients(): $ReadOnlyArray<RecipientInfo> {
		return this._ccRecipients
	}

	bccRecipients(): $ReadOnlyArray<RecipientInfo> {
		return this._bccRecipients
	}

	/**
	 * Adds a new recipient, if the mail address doesn't already exist as a recipient
	 * @param type
	 * @param recipient
	 * @param resolveLazily
	 * @param notify: whether or not to notify onRecipientAdded listeners
	 * @returns {RecipientInfo}
	 */
	addRecipient(type: RecipientField, recipient: Recipient, resolveLazily: boolean = false, notify: boolean = true): ?RecipientInfo {
		const recipientInfo = this.getOrCreateRecipient(type, recipient, resolveLazily)
		return this.addRecipientInfo(type, recipientInfo, resolveLazily, notify)
	}

	addRecipientInfo(type: RecipientField, recipientInfo: RecipientInfo, resolveLazily: boolean = false, notify: boolean = true): ?RecipientInfo {
		this.getRecipientList(type).push(recipientInfo)
		this.setMailChanged(true)
		if (notify) this.onRecipientAdded({addedRecipient: recipientInfo, addedField: type})
		return recipientInfo
	}

	getOrCreateRecipient(type: RecipientField, recipient: Recipient, resolveLazily: boolean = false): RecipientInfo {
		// if a recipient with the same mail address exists then just use that. they will still received multiple emails but the passwords
		// will sync up
		// TODO maybe we can isntead not reinsert an existing recipient by checking if it already exists - how should that behaviour work
		return this.getRecipientList(type).find(r => r.mailAddress === recipient.address)
			|| this._createAndResolveRecipientInfo(recipient.name, recipient.address, recipient.contact, resolveLazily)
	}

	removeRecipient(recipient: RecipientInfo, type: RecipientField, notify: boolean = true): boolean {
		const didRemove = findAndRemove(this.getRecipientList(type), r => recipient.mailAddress === r.mailAddress)
		this.setMailChanged(didRemove)
		if (didRemove && notify) this.onRecipientRemoved({removedRecipient: recipient, removedField: type})
		return didRemove
	}

	dispose() {
		this._eventController.removeEntityListener(this._entityEventReceived)
	}

	/**
	 * @param files
	 * @throws UserError in the case that any files were too big to attach. Small enough files will still have been attached
	 */
	getAttachments(): Array<Attachment> {
		return this._attachments
	}

	/** @throws UserError in case files are too big to add */
	attachFiles(files: $ReadOnlyArray<Attachment>): void {
		let totalSize = this._attachments.reduce((total, file) => total + Number(file.size), 0)
		const tooBigFiles: Array<string> = [];
		files.forEach(file => {
			if (totalSize + Number(file.size) > MAX_ATTACHMENT_SIZE) {
				tooBigFiles.push(file.name)
			} else {
				totalSize += Number(file.size)
				this._attachments.push(file)
			}
		})

		if (tooBigFiles.length > 0) {
			throw new UserError(() => lang.get("tooBigAttachment_msg") + tooBigFiles.join(", "))
		}
	}

	removeAttachment(file: Attachment): void {
		if (remove(this._attachments, file)) {
			this.setMailChanged(true)
		}
	}

	getSenderName() {
		return getSenderNameForUser(this._mailboxDetails, this._logins.getUserController())
	}

	_updateDraft(body: string, attachments: ?$ReadOnlyArray<Attachment>, draft: Mail) {
		return this._worker
		           .updateMailDraft(this.getSubject(), body, this._senderAddress, this.getSenderName(), this._toRecipients,
			           this._ccRecipients, this._bccRecipients, attachments, this.isConfidential(), draft)
		           .catch(LockedError, (e) => {
			           console.log("updateDraft: operation is still active", e)
			           throw new UserError("operationStillActive_msg")
		           })
		           .catch(NotFoundError, () => {
			           console.log("draft has been deleted, creating new one")
			           return this._createDraft(body, attachments, downcast(draft.method))
		           })
	}

	_createDraft(body: string, attachments: ?$ReadOnlyArray<Attachment>, mailMethod: MailMethodEnum): Promise<Mail> {
		return this._worker.createMailDraft(this.getSubject(), body,
			this._senderAddress, this.getSenderName(), this._toRecipients, this._ccRecipients, this._bccRecipients, this._conversationType,
			this._previousMessageId, attachments, this.isConfidential(), this._replyTos, mailMethod)
	}

	isConfidential(): boolean {
		return this._isConfidential || !this.containsExternalRecipients()
	}

	setConfidential(confidential: boolean): void {
		this._isConfidential = confidential
	}

	containsExternalRecipients(): boolean {
		return this.allRecipients().some(r => isExternal(r))
	}

	// TODO We still need to check on the state of invalid text in the bubble text field before sending (not here but in the mail editor)
	/**
	 * @reject {RecipientsNotFoundError}
	 * @reject {TooManyRequestsError}
	 * @reject {AccessBlockedError}
	 * @reject {FileNotFoundError}
	 * @reject {PreconditionFailedError}
	 * @reject {LockedError}
	 * @reject {UserError}
	 * @param body
	 * @param mailMethod
	 * @param getConfirmationFun: Function to get confirmation of missing information
	 * @param blockingWaitHandler: Function to call while waiting for email to send
	 * @return true if the send was completed, false if it was aborted (by getConfirmation returning false
	 */
	send(
		body: string,
		mailMethod: MailMethodEnum,
		getConfirmationFun?: ((TranslationKey | lazy<string>) => Promise<boolean>),
		blockingWaitHandler?: (TranslationKey | lazy<string>, Promise<any>) => Promise<any>): Promise<boolean> {
		const getConfirmation = getConfirmationFun || ((_) => Promise.resolve(true))
		return Promise
			.resolve()
			.then(() => {
				if (this._toRecipients.length === 0 && this._ccRecipients.length === 0 && this._bccRecipients.length === 0) {
					throw new UserError("noRecipients_msg")
				}
				return this.getSubject().length === 0
					? getConfirmation("noSubject_msg")
					: Promise.resolve(true)

			})
			.then((confirmed) => {
				return !confirmed
					? Promise.resolve(false)
					: this._waitForResolvedRecipients() // Resolve all added recipients before trying to send it
					      .then((recipients) => {
						      if (recipients.length === 1 && recipients[0].mailAddress.toLowerCase().trim() === "approval@tutao.de") {
							      return [recipients, true]
						      } else {
							      return this.saveDraft(body, /*saveAttachments*/true, mailMethod)
							                 .return([recipients, false])
						      }
					      })
					      .then(([resolvedRecipients, isApprovalMail]) => {
						      if (isApprovalMail) {
							      return this._sendApprovalMail(body)
						      } else {
							      let externalRecipients = resolvedRecipients.filter(r => isExternal(r))
							      if (this.isConfidential()
								      && externalRecipients.some(r => !this.getPassword(r))) {
								      throw new UserError("noPreSharedPassword_msg")
							      }

							      const maybeSendMail = this.isConfidential() &&
							      externalRecipients.reduce((min, recipient) => Math.min(min, this.getPasswordStrength(recipient)), 100)
							      < 80
								      ? getConfirmation("presharedPasswordNotStrongEnough_msg")
								      : Promise.resolve(true)

							      return maybeSendMail.then(confirmed => {
								      if (confirmed) {
									      const sendPromise = this._updateContacts(resolvedRecipients)
									                              .then(() => this._worker.sendMailDraft(
										                              neverNull(this._draft),
										                              resolvedRecipients,
										                              this._selectedNotificationLanguage,
									                              ))
									                              .then(() => this._updatePreviousMail())
									                              .then(() => this._updateExternalLanguage())
									                              .then(() => true)
									                              .catch(LockedError, () => { throw new UserError("operationStillActive_msg")})
									      return blockingWaitHandler
										      ? blockingWaitHandler(this.isConfidential() ? "sending_msg" : "sendingUnencrypted_msg", sendPromise)
										      : sendPromise
								      }
								      return Promise.resolve(false)
							      })
						      }
					      })
			})
			.catch(RecipientNotResolvedError, () => {throw new UserError("tooManyAttempts_msg")})
			.catch(RecipientsNotFoundError, (e) => {
				let invalidRecipients = e.message.join("\n")
				throw new UserError(() => lang.get("invalidRecipients_msg") + "\n" + invalidRecipients)
			})
			.catch(TooManyRequestsError, () => {throw new UserError("tooManyMails_msg")})
			.catch(AccessBlockedError, e => {
				// special case: the approval status is set to SpamSender, but the update has not been received yet, so use SpamSender as default
				return checkApprovalStatus(true, "4")
					.then(() => {
						console.log("could not send mail (blocked access)", e)
					})
			})
			.catch(FileNotFoundError, () => {throw new UserError("couldNotAttachFile_msg")})
			.catch(PreconditionFailedError, () => {throw new UserError("operationStillActive_msg")})
	}


	/**
	 * Saves the draft.
	 * @param saveAttachments True if also the attachments shall be saved, false otherwise.
	 * @returns {Promise} When finished.
	 * @throws FileNotFoundError when one of the attachments could not be opened
	 * @throws PreconditionFailedError when the draft is locked
	 */
	saveDraft(body: string, saveAttachments: boolean, mailMethod: MailMethodEnum, blockingWaitHandler?: (TranslationKey | lazy<string>, Promise<any>) => Promise<any>): Promise<void> {
		const attachments = (saveAttachments) ? this._attachments : null
		const {_draft} = this
		const savePromise = Promise.resolve(_draft == null
			? this._createDraft(body, attachments, mailMethod)
			: this._updateDraft(body, attachments, _draft)
		).then((draft) => {
			this._draft = draft
			return Promise.map(draft.attachments, fileId => load(FileTypeRef, fileId)).then(attachments => {
				this._attachments = [] // attachFiles will push to existing files but we want to overwrite them
				this.attachFiles(attachments)
				this._mailChanged = false
			})
		})

		return blockingWaitHandler ? blockingWaitHandler("save_msg", savePromise) : savePromise
	}

	_sendApprovalMail(body: string) {
		const listId = "---------c--";
		const m = createApprovalMail({
			_id: [listId, stringToCustomId(this._senderAddress)],
			_ownerGroup: this._logins.getUserController().user.userGroup.group,
			text: `Subject: ${this.getSubject()}<br>${body}`,
		})
		return setup(listId, m)
			.catch(NotAuthorizedError, e => console.log("not authorized for approval message"))
	}

	getAvailableNotificationTemplateLanguages(): Array<Language> {
		return this._availableNotificationTemplateLanguages
	}

	getSelectedNotificationLanguageCode(): string {
		return this._selectedNotificationLanguage
	}

	setSelectedNotificationLanguageCode(code: string) {
		this._selectedNotificationLanguage = code
		this.setMailChanged(true)
	}

	_updateExternalLanguage() {
		let props = this._logins.getUserController().props
		if (props.notificationMailLanguage !== this._selectedNotificationLanguage) {
			props.notificationMailLanguage = this._selectedNotificationLanguage
			update(props)
		}
	}

	_updatePreviousMail(): Promise<void> {
		if (this._previousMail) {
			if (this._previousMail.replyType === ReplyType.NONE && this._conversationType === ConversationType.REPLY) {
				this._previousMail.replyType = ReplyType.REPLY
			} else if (this._previousMail.replyType === ReplyType.NONE
				&& this._conversationType === ConversationType.FORWARD) {
				this._previousMail.replyType = ReplyType.FORWARD
			} else if (this._previousMail.replyType === ReplyType.FORWARD
				&& this._conversationType === ConversationType.REPLY) {
				this._previousMail.replyType = ReplyType.REPLY_FORWARD
			} else if (this._previousMail.replyType === ReplyType.REPLY
				&& this._conversationType === ConversationType.FORWARD) {
				this._previousMail.replyType = ReplyType.REPLY_FORWARD
			} else {
				return Promise.resolve()
			}
			return update(this._previousMail).catch(NotFoundError, e => {
				// ignore
			})
		} else {
			return Promise.resolve();
		}
	}

	_updateContacts(resolvedRecipients: RecipientInfo[]): Promise<any> {
		return Promise.all(resolvedRecipients.map(r => {
			const {contact} = r
			if (!contact) return Promise.resolve()

			const isExternalAndConfidential = isExternal(r) && this.isConfidential()

			if (!contact._id && (!this._logins.getUserController().props.noAutomaticContacts || isExternalAndConfidential)) {
				if (isExternalAndConfidential) {
					contact.presharedPassword = this.getPassword(r).trim()
				}
				return LazyContactListId.getAsync().then(listId => {
					return setup(listId, contact)
				})
			} else if (
				contact._id
				&& isExternalAndConfidential) {
				// TODO now this will send an update for every recipient even if the password hasn't changed
				// we should have a diff here of some OG state but first i need to pin down the best place to create that
				//	&& contact.presharedPassword !== this.getPassword(r).trim()) {
				//contact.presharedPassword = this.getPassword(r).trim()
				return update(contact)
			} else {
				return Promise.resolve()
			}
		}))
	}

	//
	// 	//
	// _getPassword(r: RecipientInfo): string {
	// 	return r.contact && r.contact.presharedPassword || this.getPassword(r.mailAddress) || ""
	// }

	allRecipients(): Array<RecipientInfo> {
		return this._toRecipients
		           .concat(this._ccRecipients)
		           .concat(this._bccRecipients)
	}

	/**
	 * Makes sure the recipient type and contact are resolved.
	 */
	_waitForResolvedRecipients(): Promise<RecipientInfo[]> {
		return Promise.all(this.allRecipients().map(recipientInfo => {
			return resolveRecipientInfo(this._mailModel, recipientInfo).then(recipientInfo => {
				if (recipientInfo.resolveContactPromise) {
					return recipientInfo.resolveContactPromise.return(recipientInfo)
				} else {
					return recipientInfo
				}
			})
		})).catch(TooManyRequestsError, () => {
			throw new RecipientNotResolvedError()
		})
	}

	// Called by the ContactEditorDialog created by the bubble handler in MailEditorN upon clicking save
	contactReceiver(oldRecipient: RecipientInfo, field: RecipientField, contactElementId: string) {
		const recipients = this.getRecipientList(field)
		const emailAddress = oldRecipient.mailAddress

		LazyContactListId.getAsync().then(contactListId => {
			const id: IdTuple = [contactListId, contactElementId]
			console.log("LOAD", id)
			load(ContactTypeRef, id).then(updatedContact => {
				console.log("LOADED", id, updatedContact)
				if (!updatedContact.mailAddresses.find(ma => easyMatch(ma.address, emailAddress))) {
					// the mail address was removed, so remove the recipient
					remove(recipients, oldRecipient)
					this.onRecipientRemoved({removedRecipient: oldRecipient, removedField: field})
				} else {
					const newRecipient = createRecipientInfo(emailAddress, null, updatedContact)
					replace(recipients, oldRecipient, newRecipient)
					this.onRecipientContactUpdated({oldRecipient, updatedRecipient: newRecipient, updatedField: field})
				}
			})
		})
	}

	// TODO Figure out if this will break the CalendarEventViewModel which may or may not expect the recipients not to change
	_handleEntityEvent(update: EntityUpdateData): Promise<void> {
		const {operation, instanceId, instanceListId} = update
		let contactId: IdTuple = [neverNull(instanceListId), instanceId]

		if (isUpdateForTypeRef(ContactTypeRef, update)) {
			if (operation === OperationType.UPDATE) {
				load(ContactTypeRef, contactId).then((contact) => {

					for (const fieldType of ["to", "cc", "bcc"]) {
						const matching = this.getRecipientList(fieldType).filter(recipient => recipient.contact
							&& isSameId(recipient.contact._id, contact._id))
						matching.forEach(recipient => {
							// if the mail address no longer exists on the contact then delete the recipient
							if (!contact.mailAddresses.find(ma => easyMatch(ma.address, recipient.mailAddress))) {
								this.removeRecipient(recipient, fieldType, true)
							} else {
								// else just modify the recipient
								recipient.name = `${contact.firstName} ${contact.lastName}`
								recipient.contact = contact
								this.onRecipientContactUpdated({
									oldRecipient: recipient,
									updatedRecipient: recipient,
									updatedField: fieldType
								})
							}
						})
					}
				})
			} else if (operation === OperationType.DELETE) {

				for (const fieldType of ["to", "cc", "bcc"]) {
					const recipients = this.getRecipientList(fieldType)
					const filterFun = recipient => recipient.contact && isSameId(recipient.contact._id, contactId) || false
					const toDelete = recipients.filter(filterFun)
					for (const r of toDelete) {
						this.removeRecipient(r, fieldType, true)
					}
				}
			}
			this.setMailChanged(true)
		}
		return Promise.resolve()
	}
}