// @flow
import type {ConversationTypeEnum, MailMethodEnum} from "../api/common/TutanotaConstants"
import {ConversationType, MAX_ATTACHMENT_SIZE, OperationType, ReplyType} from "../api/common/TutanotaConstants"
import {load, setup, update} from "../api/main/Entity"
import {worker} from "../api/main/WorkerClient"
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
import {stringToCustomId} from "../api/common/EntityFunctions"
import {FileNotFoundError} from "../api/common/error/FileNotFoundError"
import type {LoginController} from "../api/main/LoginController"
import {logins} from "../api/main/LoginController"
import type {MailAddress} from "../api/entities/tutanota/MailAddress"
import type {MailboxDetail} from "./MailModel"
import {MailModel} from "./MailModel"
import {LazyContactListId} from "../contacts/ContactUtils"
import {RecipientNotResolvedError} from "../api/common/error/RecipientNotResolvedError"
import stream from "mithril/stream/stream.js"
import type {EntityEventsListener} from "../api/main/EventController"
import {EventController, isUpdateForTypeRef} from "../api/main/EventController"
import type {InlineImages} from "./MailViewer"
import {isMailAddress} from "../misc/FormatValidator"
import {createApprovalMail} from "../api/entities/monitor/ApprovalMail"
import type {EncryptedMailAddress} from "../api/entities/tutanota/EncryptedMailAddress"
import {partition, remove} from "../api/common/utils/ArrayUtils"
import type {ContactModel} from "../contacts/ContactModel"
import type {Language, TranslationKey} from "../misc/LanguageViewModel"
import {_getSubstitutedLanguageCode, getAvailableLanguageCode, lang, languages} from "../misc/LanguageViewModel"
import {RecipientsNotFoundError} from "../api/common/error/RecipientsNotFoundError"
import {checkApprovalStatus} from "../misc/LoginUtils"
import type {IUserController} from "../api/main/UserController"
import {locator} from "../api/main/MainLocator"
import {getTemplateLanguages} from "./MailEditorUtils"

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

export function defaultSendMailModel(mailboxDetails: MailboxDetail): SendMailModel {
	return new SendMailModel(logins, locator.mailModel, locator.contactModel, locator.eventController, mailboxDetails)
}

/**
 * Model which allows sending mails interactively - including resolving of recipients and handling of drafts.
 */
export class SendMailModel {
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
	_totalAttachmentSize: number;
	_attachments: Array<Attachment>; // contains either Files from Tutanota or DataFiles of locally loaded files. these map 1:1 to the _attachmentButtons
	_replyTos: Array<RecipientInfo>;
	_blockExternalContent: boolean;
	_previousMessageId: ?Id; // only needs to be the correct value if this is a new email. if we are editing a draft, conversationType is not used
	_previousMail: ?Mail;

	_selectedNotificationLanguage: string;
	_availableNotificationTemplateLanguages: Array<Language>

	_entityEventReceived: EntityEventsListener;
	_mailChanged: boolean;


	// TODO
	// These are so that the model can notify the bubble handlers in MailEditorN when recipients are deleted or updated
	// ideally the bubbles would be a direct representation of the state of the model but the current implementation has them
	// handling their own state => I started working on some BubbleHandlerN's but i think that that is something to work on after
	// I've gotten this working as there is a lot to do there
	onRecipientRemoved: (RecipientInfo, ?RecipientField) => void;
	onRecipientUpdated: (RecipientInfo, ?RecipientField) => void;
	onMailChanged: () => void

	recipientsChanged: Stream<void> // TODO calendar view subscribes to this so it knows to update, i want to have it subscribe to onMailChanged or something instead instead

	// TODO some methods on this class throw, should probably check if we're catching
	/**
	 * creates a new empty draft message. calling an init method will fill in all the blank data
	 * @param logins
	 * @param mailModel
	 * @param contactModel
	 * @param eventController
	 * @param mailboxDetails
	 */
	constructor(logins: LoginController, mailModel: MailModel, contactModel: ContactModel, eventController: EventController,
	            mailboxDetails: MailboxDetail) {
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
		this._totalAttachmentSize = 0
		this._attachments = []
		this._replyTos = []
		this._blockExternalContent = true
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
		this.onRecipientRemoved = () => {}
		this.onRecipientUpdated = () => {}
		this.onMailChanged = () => {}

		this.recipientsChanged = stream(undefined)
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

	getConversationTypeTranslationKey(): TranslationKey {
		switch (this._conversationType) {
			case ConversationType.NEW:
				return "newMail_action"
			case ConversationType.REPLY:
				return "reply_action"
			case ConversationType.FORWARD:
				return "forward_action"
			default:
				return "emptyString_msg"
		}
	}

	setPassword(recipient: RecipientInfo, password: string) {
		// TODO what happens if the contact is null here because the contact promise hasn't resolved?
		if (recipient.contact) {
			recipient.contact.presharedPassword = password
		}
		this.setMailChanged(true)
	}

	getPassword(recipientInfo: RecipientInfo): string {
		// TODO what happens if the contact is null here because the contact promise hasn't resolved?
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
		this.onMailChanged() // if this method is called wherever state gets changed, onMailChanged should function properly
	}

	doBlockExternalContent(): boolean {
		return this._blockExternalContent
	}

	initAsResponse({
		               previousMail, conversationType, senderMailAddress, recipients, attachments, subject, bodyText, replyTos,
		               addSignature, inlineImages, blockExternalContent
	               }: {
		previousMail: Mail,
		conversationType: ConversationTypeEnum,
		senderMailAddress: string,
		recipients: Recipients,
		attachments: TutanotaFile[],
		subject: string,
		bodyText: string,
		replyTos: EncryptedMailAddress[],
		addSignature: boolean,
		inlineImages?: ?Promise<InlineImages>,
		blockExternalContent: boolean
	}): Promise<SendMailModel> {
		this._blockExternalContent = blockExternalContent
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
				return this._setMailData(previousMail, previousMail.confidential, conversationType, previousMessageId, senderMailAddress,
					recipients, attachments, subject, bodyText, replyTos)
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
		const sender = senderMailAddress ? senderMailAddress : this._senderAddress
		return this._setMailData(null, confidential, ConversationType.NEW, null, sender, recipients, [], subject, bodyText, [])
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

		return this._setMailData(null, confidential, ConversationType.NEW, null, this._senderAddress, recipients, [], subject, bodyText, [])
	}

	initFromDraft({draftMail, attachments, bodyText, blockExternalContent}: {
		draftMail: Mail,
		attachments: TutanotaFile[],
		bodyText: string,
		blockExternalContent: boolean,
		inlineImages?: Promise<InlineImages>
	}): Promise<SendMailModel> {
		let conversationType: ConversationTypeEnum = ConversationType.NEW
		let previousMessageId: ?string = null
		let previousMail: ?Mail = null
		this._draft = draftMail
		this._blockExternalContent = blockExternalContent

		return load(ConversationEntryTypeRef, draftMail.conversationEntry).then(ce => {
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
			const {confidential, sender, toRecipients, ccRecipients, bccRecipients, subject, replyTos} = draftMail
			const recipients: Recipients = {
				to: toRecipients.map(mailAddressToRecipient),
				cc: ccRecipients.map(mailAddressToRecipient),
				bcc: bccRecipients.map(mailAddressToRecipient),
			}
			// We don't want to wait for the editor to be initialized, otherwise it will never be shown
			return this._setMailData(previousMail, confidential, conversationType, previousMessageId, sender.address, recipients, attachments,
				subject, bodyText, replyTos)
		})
	}

	init(
		conversationType: ConversationTypeEnum,
		subject: string,
		body: string,
		recipients: Recipients,
		replyTos: EncryptedMailAddress[],
		isConfidential: ?boolean,
		attachments: ?$ReadOnlyArray<TutanotaFile>,
		senderMailAddress: ?string,
		previousMail: ?Mail,
		previousMessageId: ?string,
	): Promise<SendMailModel> {
		this._conversationType = conversationType
		this._subject = subject
		this._body = body

		const {to = [], cc = [], bcc = []} = recipients
		const makeRecipientInfo = (r: Recipient) => this._createRecipientInfo(r.name, r.address, r.contact, false)
		this._toRecipients = to.filter(r => isMailAddress(r.address, false))
		                       .map(makeRecipientInfo)
		this._ccRecipients = cc.filter(r => isMailAddress(r.address, false))
		                       .map(makeRecipientInfo)
		this._bccRecipients = bcc.filter(r => isMailAddress(r.address, false))
		                         .map(makeRecipientInfo)

		this._replyTos = replyTos.map(ema => {
			const ri = createRecipientInfo(ema.address, ema.name, null)
			if (this._logins.isInternalUserLoggedIn()) {
				resolveRecipientInfoContact(ri, this._contactModel, this._logins.getUserController().user)
					.then(() => this.setMailChanged(true))
			}
			return ri
		})
		this._isConfidential = isConfidential != null && isConfidential || this._isConfidential
		this._attachments = []
		if (attachments) this.attachFiles(attachments)
		this._senderAddress = senderMailAddress || this._senderAddress
		this._previousMail = previousMail
		this._previousMessageId = previousMessageId

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
	_createRecipientInfo(name: ?string, address: string, contact: ?Contact, resolveLazily: boolean): RecipientInfo {
		const ri = createRecipientInfo(address, name, contact)
		if (!resolveLazily) {
			if (this._logins.isInternalUserLoggedIn()) {
				resolveRecipientInfoContact(ri, this._contactModel, this._logins.getUserController().user)
					.then(() => this.setMailChanged(true))
			}
			resolveRecipientInfo(this._mailModel, ri).then(() => this.setMailChanged(true))
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

	toRecipients(): Array<RecipientInfo> {
		return this._toRecipients
	}

	ccRecipients(): Array<RecipientInfo> {
		return this._ccRecipients
	}

	bccRecipients(): Array<RecipientInfo> {
		return this._bccRecipients
	}

	/**
	 * Adds a new recipient, if the mail address doesn't already exist as a recipient
	 * @param type
	 * @param recipient
	 * @param resolveLazily
	 * @returns {RecipientInfo}
	 */
	addRecipient(type: RecipientField, recipient: Recipient, resolveLazily: boolean = false): ?RecipientInfo {
		// if a recipient with the same mail address exists then just use that. they will still received multiple emails but the passwords
		// will sync up
		// TODO maybe we can isntead not reinsert an existing recipient by checking if it already exists - how should that behaviour work
		const recipientInfo =
			this.allRecipients().find(r => r.mailAddress === recipient.address)
			|| this._createRecipientInfo(recipient.name, recipient.address, recipient.contact, resolveLazily)

		this.getRecipientList(type).push(recipientInfo)
		this.setMailChanged(true)
		return recipientInfo
	}

	removeRecipient(recipient: RecipientInfo, type: ?RecipientField) {
		remove(type ? this._recipientList(type) : this.allRecipients(), recipient)
		this.onRecipientRemoved(recipient, type)
	}

	_recipientList(type: RecipientField): Array<RecipientInfo> {
		if (type === "to") {
			return this._toRecipients
		} else if (type === "cc") {
			return this._ccRecipients
		} else if (type === "bcc") {
			return this._bccRecipients
		}
		throw new Error()
	}


	dispose() {
		this._eventController.removeEntityListener(this._entityEventReceived)
	}

	getAttachments(): Array<Attachment> {
		return this._attachments
	}

	/**
	 * @param file
	 * @throws UserError if the file is too big to attach
	 */
	attachFile(file: Attachment): void {
		if (this._totalAttachmentSize + Number(file.size) > MAX_ATTACHMENT_SIZE) {
			throw new UserError(() => lang.get("tooBigAttachment_msg") + file.name)
		}
		this._attachments.push(file)
		this.setMailChanged(true)
	}

	/**
	 * @param files
	 * @throws UserError in the case that any files were too big to attach. Small enough files will still have been attached
	 */
	attachFiles(files: $ReadOnlyArray<Attachment>): void {
		const tooBigFiles: Array<string> = [];
		files.forEach(file => {
			try {
				this.attachFile(file)
			} catch (e) {
				tooBigFiles.push(file.name)
			}
		})

		if (tooBigFiles.length > 0) {
			throw new UserError(() => lang.get("tooBigAttachment_msg") + tooBigFiles.join(", "))
		}
	}

	removeAttachment(file: Attachment): void {
		if (remove(this._attachments, file)) {
			this._totalAttachmentSize -= Number(file.size)
			this.setMailChanged(true)
		}
	}

	clearAttachments(): void {
		this._attachments = []
		this._totalAttachmentSize = 0
	}

	getSenderName() {
		return getSenderNameForUser(this._mailboxDetails, this._logins.getUserController())
	}

	_updateDraft(body: string, attachments: ?$ReadOnlyArray<Attachment>, draft: Mail) {
		return worker
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
		return worker.createMailDraft(this.getSubject(), body,
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
									                              .then(() => worker.sendMailDraft(
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
				&& isExternalAndConfidential
				&& contact.presharedPassword !== this.getPassword(r).trim()) {
				contact.presharedPassword = this.getPassword(r).trim()
				return update(contact)
			} else {
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

	// TODO Figure out if this will break the CalendarEventViewModel which may or may not expect the recipients not to change
	_handleEntityEvent(update: EntityUpdateData): Promise<void> {
		const {operation, instanceId, instanceListId} = update
		let contactId: IdTuple = [neverNull(instanceListId), instanceId]

		if (isUpdateForTypeRef(ContactTypeRef, update) && this.allRecipients().find((r) => r.contact && r.contact._id === contactId)) {
			if (operation === OperationType.UPDATE) {
				load(ContactTypeRef, contactId).then((contact) => {

					// TODO remember what the point of partition is here
					let [linked, notLinked] = partition(this.allRecipients(), r => r.contact && r.contact._id === contact._id || false)
					linked.forEach(r => {
						// if the mail address no longer exists on the contact then delete the recipient so as to avoid mistakeys
						if (!contact.mailAddresses.includes(r.mailAddress)) {
							this.removeRecipient(r)
						} else {
							// else just modify the recipient
							// the bubbletextfields will be updated on call to setMailChanged (for now)
							r.name = `${contact.firstName} ${contact.lastName}`
							r.contact = contact
						}
					})
				})
			} else if (operation === OperationType.DELETE) {
				const filterFun = recipient => recipient.contact && recipient.contact._id === contactId || false
				this._toRecipients = this._toRecipients.filter(r => filterFun)
				this._ccRecipients = this._ccRecipients.filter(r => filterFun)
				this._bccRecipients = this._bccRecipients.filter(r => filterFun)
			}
			this.setMailChanged(true)
		}
		return Promise.resolve()
	}
}