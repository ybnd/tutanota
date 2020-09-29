// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"

import {Editor} from "../gui/base/Editor"
import type {RecipientField, Recipients} from "./SendMailModel"
import {defaultSendMailModel, mailAddressToRecipient, SendMailModel} from "./SendMailModel"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import type {MailboxDetail} from "./MailModel"
import {checkApprovalStatus} from "../misc/LoginUtils"
import {
	getDefaultSender,
	getEnabledMailAddressesWithUser,
	parseMailtoUrl,
	replaceCidsWithInlineImages,
	resolveRecipientInfo,
	resolveRecipientInfoContact
} from "./MailUtils"
import {PermissionError} from "../api/common/error/PermissionError"
import {locator} from "../api/main/MainLocator"
import {logins} from "../api/main/LoginController"
import {formatPrice} from "../subscription/SubscriptionUtils"
import type {ConversationTypeEnum} from "../api/common/TutanotaConstants"
import {ALLOWED_IMAGE_FORMATS, ConversationType, Keys, MailMethod} from "../api/common/TutanotaConstants"
import {FileNotFoundError} from "../api/common/error/FileNotFoundError"
import {ConnectionError, PreconditionFailedError, TooManyRequestsError} from "../api/common/error/RestError"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {attachDropdown, createDropdown} from "../gui/base/DropdownN"
import {fileController} from "../file/FileController"
import {RichTextToolbar} from "../gui/base/RichTextToolbar"
import {isApp} from "../api/Env"
import {Icons} from "../gui/base/icons/Icons"
import type {RecipientInfo} from "../api/common/RecipientInfo"
import {RecipientInfoType} from "../api/common/RecipientInfo"
import {animations, height, opacity} from "../gui/animation/Animations"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import {Bubble, BubbleTextField} from "../gui/base/BubbleTextField"
import {RecipientInfoBubbleHandler} from "../misc/RecipientInfoBubbleHandler"
import {
	chooseAndAttachFile,
	cleanupInlineAttachments,
	conversationTypeString,
	createAttachmentButtonAttrs,
	createInlineImage,
	createPasswordField,
	createRecipientInfoBubble,
	getSupportMailSignature
} from "./MailEditorUtils"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/ExpanderN"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {newMouseEvent} from "../gui/HtmlUtils"
import {windowFacade} from "../misc/WindowFacade"
import {UserError} from "../api/common/error/UserError"
import {findAndRemove, replace} from "../api/common/utils/ArrayUtils"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import type {DropDownSelectorAttrs} from "../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import type {Mail} from "../api/entities/tutanota/Mail"
import type {MailAddress} from "../api/entities/tutanota/MailAddress"
import type {File as TutanotaFile} from "../api/entities/tutanota/File"
import type {EncryptedMailAddress} from "../api/entities/tutanota/EncryptedMailAddress"
import type {InlineImages} from "./MailViewer"
import {FileOpenError} from "../api/common/error/FileOpenError"
import {downcast, neverNull} from "../api/common/utils/Utils"
import {showUpgradeWizard} from "../subscription/UpgradeSubscriptionWizard"
import type {Contact} from "../api/entities/tutanota/Contact"

// TODO maybe make a MailEditorViewModel which can do some of the linking up that's put inside of the attrs
export type MailEditorAttrs = {
	model: SendMailModel,
	body: Stream<string>,
	objectUrls: Array<string>,
	mentionedInlineImages: Array<string>,
	inlineImageElements: Array<HTMLElement>,
	doBlockExternalContent: Stream<boolean>,
	doShowToolbar: Stream<boolean>,
	onload?: Function,
	onclose?: Function,
	areDetailsExpanded: Stream<boolean>,
	selectedNotificationLanguage: Stream<string>,
	inlineImages?: Promise<InlineImages>,
	_focusEditorOnLoad: () => void,
	// To call before send in the SendMailModel, returns true if ok to send, else false
	// TODO put this in a ViewModel 4 sure
	_onSend: () => void
}

export function createMailEditorAttrs(model: SendMailModel, doBlockExternalContent: boolean, doFocusEditorOnLoad: boolean, inlineImages?: Promise<InlineImages>): MailEditorAttrs {
	const attrs = {
		model,
		body: stream(""),
		objectUrls: [],
		mentionedInlineImages: [],
		inlineImageElements: [],
		doBlockExternalContent: stream(doBlockExternalContent),
		doShowToolbar: stream(false),
		areDetailsExpanded: stream(false),
		selectedNotificationLanguage: stream(""),
		inlineImages: inlineImages,
		_focusEditorOnLoad: () => {},
		_onSend: () => {}
	}
	return attrs
}


export class MailEditorN implements MComponent<MailEditorAttrs> {

	editor: Editor;
	toolbar: RichTextToolbar;
	recipientFields: Map<RecipientField, BubbleTextField<RecipientInfo>>;

	constructor(vnode: Vnode<MailEditorAttrs>) {
		const a: MailEditorAttrs = vnode.attrs
		const model = a.model

		this.editor = new Editor(200, (html, isPaste) => {
			const sanitized = htmlSanitizer.sanitizeFragment(html, !isPaste && a.doBlockExternalContent())
			a.mentionedInlineImages = sanitized.inlineImageCids
			return sanitized.html
		})

		a._focusEditorOnLoad = () => { this.editor.initialized.promise.then(() => this.editor.focus()) }

		const onEditorChanged = () => {
			cleanupInlineAttachments(this.editor.getDOM(), a.inlineImageElements, model.getAttachments())
			model.setMailChanged(true)
			m.redraw()
		}

		// call this async because the editor is not initialized before this mail editor dialog is shown
		this.editor.initialized.promise.then(() => {
			this.editor.setHTML(model.getBody())
			// Add mutation observer to remove attachments when corresponding DOM element is removed
			new MutationObserver(onEditorChanged).observe(this.editor.getDOM(), {
				attributes: false,
				childList: true,
				subtree: true
			})

			// since the editor is the source for the body text, the model won't know if the body has changed unless we tell it
			this.editor.addChangeListener(() => model.setBody(this.editor.getHTML()))
		})

		const attachImageHandler = isApp()
			? null
			: event => chooseAndAttachFile(model, (event.target: any).getBoundingClientRect(), ALLOWED_IMAGE_FORMATS)
				.then(files => {
					files && files.forEach(file => {
						const img = createInlineImage(file)
						a.objectUrls.push(img.objectUrl)
						a.inlineImageElements.push(this.editor.insertImage(img.objectUrl, {cid: img.cid, style: 'max-width: 100%'}))
					})
					m.redraw()
				})


		this.toolbar = new RichTextToolbar(this.editor, {imageButtonClickHandler: attachImageHandler})

		this.recipientFields = new Map()

		for (const fieldType of ["to", "cc", "bcc"]) {
			const handler = new RecipientInfoBubbleHandler({
				createBubble(name: ?string, address: string, contact: ?Contact): ?Bubble<RecipientInfo> {

					let recipientInfo = model.getOrCreateRecipient(fieldType, {address, name, contact})


					// TODO i guess this is done in getOrCreateRecipient, I don't think this is necessary here
					if (model.logins().isInternalUserLoggedIn()) {
						resolveRecipientInfoContact(recipientInfo, model.contacts(), model.logins().getUserController().user)
					} else {
						resolveRecipientInfo(model.mails(), recipientInfo)
							.then(() => m.redraw())
							.catch(ConnectionError, e => {
								// we are offline but we want to show the error dialog only when we click on send.
							})
							.catch(TooManyRequestsError, e => {
								Dialog.error("tooManyAttempts_msg")
							})
					}

					return createRecipientInfoBubble(model, recipientInfo, fieldType)
				}
			})
			const field = new BubbleTextField(fieldType + "_label", handler)
			this.recipientFields.set(fieldType, field)

			//TODO deduplicate
			// first we fill in the field with existing recipients, then we subscribe to create and delete, so as not to duplicate the existing recipients
			field.bubbles = model.getRecipientList(fieldType).map(recipient => createRecipientInfoBubble(model, recipient, fieldType))

			// TODO THe password for an external recipient won't show up for the first time if chosen from the suggestions
			// When clicking it also doesn't always show up but it seems sporadic
			// called upon inserting a new recipient into the list by the user
			// addRecipient will not notify so onRecipientAdded will not be called
			handler.onBubbleCreated.map(bubble => {
				if (!bubble) return
				const recipient = bubble.entity
				model.addRecipientInfo(fieldType, recipient, false, false)
				m.redraw()
			})

			// called on backspace or on clicking the remove recipient button
			// does not notify so model.onRecipientRemoved will not be called
			handler.onBubbleDeleted.map(bubble => {
				console.log("bubble delete", bubble)
				if (!bubble) return
				model.removeRecipient(bubble.entity, fieldType, false)
				m.redraw()
			})

			// called upon saving an edit/create contact dialog or if the user updates the contact from a separate client
			model.onRecipientContactUpdated.map(r => {
				if (!r) return
				const {oldRecipient, updatedRecipient, updatedField} = r
				if (fieldType === updatedField) {
					const newBubble = createRecipientInfoBubble(model, updatedRecipient, updatedField)
					const oldBubble = field.bubbles.find(bubble => bubble.entity === oldRecipient)
					replace(field.bubbles, oldBubble, newBubble)
				}
				m.redraw()
			})

			// called when model.removeRecipient is called
			// but not on backspace or clicking the remove recipient button because that doesn't notify
			// will
			model.onRecipientRemoved.map(r => {
				if (!r) return
				const {removedRecipient, removedField} = r
				if (removedField === fieldType) {
					findAndRemove(field.bubbles, bubble => bubble.entity === removedRecipient)
				}
				m.redraw()
			})

		}

		if (model.logins().isInternalUserLoggedIn()) {
			neverNull(this.recipientFields.get("to")).textField._injectionsRight = () => m(ExpanderButtonN, {
				label: "show_action",
				expanded: a.areDetailsExpanded,
			})
		} else {
			neverNull(this.recipientFields.get("to")).textField.setDisabled()
		}

		if (a.inlineImages) {
			a.inlineImages.then((loadedInlineImages) => {
				Object.keys(loadedInlineImages).forEach((key) => {
					const {file} = loadedInlineImages[key]
					if (!model.getAttachments().includes(file)) model.attachFiles([file])
				})
				m.redraw()

				this.editor.initialized.promise.then(() => {

					a.inlineImageElements = replaceCidsWithInlineImages(this.editor.getDOM(), loadedInlineImages, (file, event, dom) => {
						createDropdown(() => [
							{
								label: "download_action",
								click: () => {
									fileController.downloadAndOpen(file, true)
									              .catch(FileOpenError, () => Dialog.error("canNotOpenFileOnDevice_msg"))
								},
								type: ButtonType.Dropdown
							}
						])(downcast(event), dom)
					})
				})
			})
		}

		model.onMailChanged.map(didChange => {
			// TODO what else go here?????
			if (didChange) m.redraw()
		})

		a._onSend = () => {
			let invalidText = ""
			for (const field of this.recipientFields.values()) {
				field.createBubbles()
				if (field.textField.value().trim() !== "") {
					invalidText += "\n" + field.textField.value().trim()
				}
			}
			if (invalidText !== "") {
				throw new UserError(() => lang.get("invalidRecipients_msg") + "\n" + invalidText)
			}
		}
	}

	view(vnode: Vnode<MailEditorAttrs>) {
		const a = vnode.attrs
		const model = a.model

		a.body = () => this.editor.getHTML()

		const confidentialButtonAttrs = {
			label: "confidential_action",
			click: (event, attrs) => model.setConfidential(!model.isConfidential()),
			icon: () => model.isConfidential() ? Icons.Lock : Icons.Unlock,
			isSelected: () => model.isConfidential(),
			noRecipientInfoBubble: true,
		}
		const attachFilesButtonAttrs = {
			label: "attachFiles_action",
			click: (ev, dom) => chooseAndAttachFile(model, dom.getBoundingClientRect()).then(() => m.redraw()),
			icon: () => Icons.Attachment,
			noRecipientInfoBubble: true
		}

		const toolbarButton = () => (!logins.getUserController().props.sendPlaintextOnly)
			? m(ButtonN, {
				label: 'showRichTextToolbar_action',
				icon: () => Icons.FontSize,
				click: () => a.doShowToolbar(!a.doShowToolbar()),
				isSelected: a.doShowToolbar,
				noRecipientInfoBubble: true
			})
			: null

		const subjectFieldAttrs: TextFieldAttrs = {
			label: "subject_label",
			helpLabel: () => lang.get(model.getConfidentialStateTranslationKey()),
			value: stream(model.getSubject()),
			oninput: val => model.setSubject(val),
			injectionsRight: () => {
				return model.allRecipients().find(r => r.type === RecipientInfoType.EXTERNAL)
					? [m(ButtonN, confidentialButtonAttrs), m(ButtonN, attachFilesButtonAttrs), toolbarButton()]
					: [m(ButtonN, attachFilesButtonAttrs), toolbarButton()]
			}

		}

		function animate(domElement: HTMLElement, fadein: boolean) {
			let childHeight = domElement.offsetHeight
			return animations.add(domElement, fadein ? height(0, childHeight) : height(childHeight, 0))
			                 .then(() => {
				                 domElement.style.height = ''
			                 })
		}


		const senderField = new DropDownSelector(
			"sender_label",
			null,
			getEnabledMailAddressesWithUser(model.getMailboxDetails(), model.user().userGroupInfo)
				.sort().map(mailAddress => ({
				name: mailAddress,
				value: mailAddress
			})), stream(getDefaultSender(model.logins(), model.getMailboxDetails())),
			250)

		const passwordFieldsAttrs =
			() => model.allRecipients()
			           .filter(r => r.type === RecipientInfoType.EXTERNAL || r.type === RecipientInfoType.UNKNOWN
				           && !r.resolveContactPromise) // only show passwords for resolved contacts, otherwise we might not get the password
			           .map(r => m(TextFieldN, Object.assign({}, createPasswordField(model, r), {
				           oncreate: vnode => animate(vnode.dom, true),
				           onbeforeremove: vnode => animate(vnode.dom, false)
			           })))

		const attachmentButtonAttrs = createAttachmentButtonAttrs(model, a)

		const languageDropDownAttrs: DropDownSelectorAttrs<string> = {
			label: "notificationMailLanguage_label",
			items: model.getAvailableNotificationTemplateLanguages().map(language => {
				return {name: lang.get(language.textId), value: language.code}
			}),
			selectedValue: stream(model.getSelectedNotificationLanguageCode()),
			selectionChangedHandler: (v) => model.setSelectedNotificationLanguageCode(v),
			dropdownWidth: 250
		}

		const toRecipientsField = neverNull(this.recipientFields.get("to"))
		const ccRecipientsField = neverNull(this.recipientFields.get("cc"))
		const bccRecipientsField = neverNull(this.recipientFields.get("bcc"))


		return m("#mail-editor.full-height.text.touch-callout", {
			onremove: vnode => {
				model.dispose()
				a.objectUrls.forEach((url) => URL.revokeObjectURL(url))
			},
			onclick: (e) => {
				if (e.target === this.editor.getDOM()) {
					this.editor.focus()
				}
			},
			ondragover: (ev) => {
				// do not check the datatransfer here because it is not always filled, e.g. in Safari
				ev.stopPropagation()
				ev.preventDefault()
			},
			ondrop: (ev) => {
				if (ev.dataTransfer.files && ev.dataTransfer.files.length > 0) {
					fileController.readLocalFiles(ev.dataTransfer.files).then(dataFiles => {
						model.attachFiles((dataFiles: any))
						m.redraw()
					}).catch(e => {
						console.log(e)
						return Dialog.error("couldNotAttachFile_msg")
					})
					ev.stopPropagation()
					ev.preventDefault()
				}
			},
			onload: (ev) => {
			}
		}, [
			m(toRecipientsField),
			m(ExpanderPanelN, {expanded: a.areDetailsExpanded},
				m(".details", [
					m(ccRecipientsField),
					m(bccRecipientsField),
					m(".wrapping-row", [
						m(senderField),
						m("", model.isConfidential() && model.containsExternalRecipients()
							? m("", {
								oncreate: vnode => animations.add(vnode.dom, opacity(0, 1, false)),
								onbeforeremove: vnode => animations.add(vnode.dom, opacity(1, 0, false))
							}, m(DropDownSelectorN, languageDropDownAttrs))
							: null
						)

					]),
				])
			),
			model.isConfidential()
				? m(".external-recipients.overflow-hidden", {
					oncreate: vnode => animate(vnode.dom, true),
					onbeforeremove: vnode => animate(vnode.dom, false)
				}, passwordFieldsAttrs())
				: null,
			m(".row", m(TextFieldN, subjectFieldAttrs)),
			m(".flex-start.flex-wrap.ml-negative-RecipientInfoBubble", attachmentButtonAttrs.map((a) => m(ButtonN, a))),
			model.getAttachments().length > 0 ? m("hr.hr") : null,
			a.doShowToolbar()
				// Toolbar is not removed from DOM directly, only it's parent (array) is so we have to animate it manually.
				// m.fragment() gives us a vnode without actual DOM element so that we can run callback on removal
				? m.fragment({
					onbeforeremove: ({dom}) => this.toolbar._animate(dom.children[0], false)
				}, [m(this.toolbar), m("hr.hr")])
				: null,
			m(".pt-s.text.scroll-x.break-word-links", {onclick: () => this.editor.focus()}, m(this.editor)),
			m(".pb")
		])
	}
}


/**
 * open a MailEditor
 * @param mailboxDetails details to use when sending an email
 * @returns {*}
 * @private
 * @throws PermissionError
 */
export function newMailEditor(mailboxDetails: MailboxDetail): Promise<Dialog> {
	return checkApprovalStatus(false).then(sendAllowed => {
		if (sendAllowed) {
			return newMailEditorFromTemplate(mailboxDetails, {}, "", "<br/>")
		} else {
			return Promise.reject(new PermissionError("not allowed to send mail"))
		}
	})
}


type ResponseMailParameters = {
	previousMail: Mail,
	conversationType: ConversationTypeEnum,
	senderMailAddress: string,
	toRecipients: MailAddress[],
	ccRecipients: MailAddress[],
	bccRecipients: MailAddress[],
	attachments: TutanotaFile[],
	subject: string,
	bodyText: string,
	replyTos: EncryptedMailAddress[],
	addSignature: boolean,
	inlineImages?: Promise<InlineImages>,
	blockExternalContent: boolean
}

export function newResponseMailEditor(args: ResponseMailParameters, mailboxDetails: ?MailboxDetail): Promise<Dialog> {
	const {
		previousMail,
		conversationType,
		senderMailAddress,
		toRecipients,
		ccRecipients,
		bccRecipients,
		attachments,
		subject,
		bodyText,
		replyTos,
		addSignature,
		inlineImages,
		blockExternalContent
	} = args

	const init = (mailbox) => {

		const recipients = {
			to: toRecipients.map(mailAddressToRecipient),
			cc: ccRecipients.map(mailAddressToRecipient),
			bcc: bccRecipients.map(mailAddressToRecipient)
		}

		return defaultSendMailModel(mailbox).initAsResponse({
			previousMail,
			conversationType,
			senderMailAddress,
			recipients,
			attachments,
			subject,
			bodyText,
			replyTos,
			addSignature,
		}).then(model => {
			return _createMailEditorDialog(model, blockExternalContent, inlineImages)
		})
	}

	return mailboxDetails
		? init(mailboxDetails)
		: locator.mailModel.getUserMailboxDetails().then(mailbox => init(mailbox))
}

export function newMailEditorFromDraft(draft: Mail, attachments: Array<TutanotaFile>, bodyText: string, blockExternalContent: boolean, inlineImages?: Promise<InlineImages>, mailboxDetails?: MailboxDetail): Promise<Dialog> {
	const init = mailbox => defaultSendMailModel(mailbox).initFromDraft(draft, attachments, bodyText)
	                                                     .then(model => _createMailEditorDialog(model, blockExternalContent, inlineImages))

	return mailboxDetails
		? init(mailboxDetails)
		: locator.mailModel.getUserMailboxDetails().then(mailbox => init(mailbox))
}

export function newMailtoUrlMailEditor(mailtoUrl: string, confidential: boolean, mailboxDetails?: MailboxDetail): Promise<Dialog> {

	const init = mailbox => {
		const mailTo = parseMailtoUrl(mailtoUrl)
		const subject = mailTo.subject
		const body = mailTo.body
		const recipients = {
			to: mailTo.to.map(mailAddressToRecipient),
			cc: mailTo.cc.map(mailAddressToRecipient),
			bcc: mailTo.bcc.map(mailAddressToRecipient)
		}

		return newMailEditorFromTemplate(mailbox, recipients, subject, body, null, confidential)
	}

	return mailboxDetails
		? init(mailboxDetails)
		: locator.mailModel.getUserMailboxDetails().then(mailbox => init(mailbox))
}


export function newMailEditorFromTemplate(
	mailboxDetails: MailboxDetail,
	recipients: Recipients,
	subject: string,
	bodyText: string,
	nondefaultSignature: ?string,
	confidential: ?boolean,
	senderMailAddress?: string): Promise<Dialog> {

	return defaultSendMailModel(mailboxDetails)
		.initWithTemplate(recipients, subject, bodyText, confidential, senderMailAddress)
		.then(model => {
			return _createMailEditorDialog(model)
		})
}

/**
 * Creates a new Dialog with a MailEditorN inside.
 * @param model
 * @param blockExternalContent
 * @param inlineImages
 * @returns {Dialog}
 * @private
 */
function _createMailEditorDialog(model: SendMailModel, blockExternalContent: boolean = false, inlineImages?: Promise<InlineImages>): Dialog {
	let dialog: Dialog
	let mailEditorAttrs: MailEditorAttrs
	let domCloseButton: HTMLElement


	const save = () => {
		model.saveDraft(mailEditorAttrs.body(), true, MailMethod.NONE, showProgressDialog)
		     .then(() => dialog.close())
		     .catch(FileNotFoundError, () => Dialog.error("couldNotAttachFile_msg"))
		     .catch(PreconditionFailedError, () => Dialog.error("operationStillActive_msg"))
	}
	const send = () => {
		try {
			mailEditorAttrs._onSend()
			model.send(
				mailEditorAttrs.body(),
				MailMethod.NONE,
				(msg) => {
					console.log(msg);
					return Dialog.confirm(msg)
				},
				showProgressDialog)
			     .then(success => {if (success) dialog.close() })
			     .catch(UserError, (err) => Dialog.error(() => err.message))
		} catch (e) {
			Dialog.error(() => e.message)
		}

	}

	const closeButtonAttrs = attachDropdown({
			label: "close_alt",
			click: () => dialog.close(),
			type: ButtonType.Secondary,
			oncreate: vnode => domCloseButton = vnode.dom
		},
		() => [
			{
				label: "discardChanges_action",
				click: () => dialog.close(),
				type: ButtonType.Dropdown,
			},
			{
				label: "saveDraft_action",
				click: save,
				type: ButtonType.Dropdown,
			}
		], () => model.hasMailChanged(), 250
	)

	let windowCloseUnsubscribe = () => {}
	const headerBarAttrs: DialogHeaderBarAttrs = {
		left: [closeButtonAttrs],
		right: [
			{
				label: "send_action",
				click: send,
				type: ButtonType.Primary
			}
		],
		middle: () => conversationTypeString(model.getConversationType()),
		create: () => {
			windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {
				closeButtonAttrs.click(newMouseEvent(), domCloseButton)
			})
		},
		remove: () => {
			windowCloseUnsubscribe()
		}
	}

	mailEditorAttrs = createMailEditorAttrs(model, blockExternalContent, model.toRecipients().length !== 0, inlineImages);

	dialog = Dialog.largeDialogN(headerBarAttrs, MailEditorN, mailEditorAttrs)
	               .addShortcut({
		               key: Keys.ESC,
		               exec() { closeButtonAttrs.click(newMouseEvent(), domCloseButton) },
		               help: "close_alt"
	               })
	               .addShortcut({
		               key: Keys.B,
		               ctrl: true,
		               exec: () => {
			               // is done by squire
		               },
		               help: "formatTextBold_msg"
	               })
	               .addShortcut({
		               key: Keys.I,
		               ctrl: true,
		               exec: () => {
			               // is done by squire
		               },
		               help: "formatTextItalic_msg"
	               })
	               .addShortcut({
		               key: Keys.U,
		               ctrl: true,
		               exec: () => {
			               // is done by squire
		               },
		               help: "formatTextUnderline_msg"
	               })
	               .addShortcut({
		               key: Keys.S,
		               ctrl: true,
		               exec: save,
		               help: "save_action"
	               })
	               .addShortcut({
		               key: Keys.S,
		               ctrl: true,
		               shift: true,
		               exec: send,
		               help: "send_action"
	               }).setCloseHandler(() => closeButtonAttrs.click(newMouseEvent(), domCloseButton))

	if (model.getConversationType() === ConversationType.REPLY || model.toRecipients().length) {
		dialog.setFocusOnLoadFunction(() => mailEditorAttrs._focusEditorOnLoad())
	}

	return dialog
}


/**
 * Create and show a new mail editor with a support query, addressed to premium support,
 * or show an option to upgrade
 * @param subject
 * @param mailboxDetails
 * @returns {Promise<any>|Promise<R>|*}
 */
export function writeSupportMail(subject: string = "", mailboxDetails?: MailboxDetail) {

	if (logins.getUserController().isPremiumAccount()) {
		const show = mailbox => {
			const recipients = {
				to: [{name: null, address: "premium@tutao.de"}]
			}
			newMailEditorFromTemplate(mailbox, recipients, "", "<br/>", getSupportMailSignature()).then(dialog => dialog.show())
		}

		mailboxDetails
			? show(mailboxDetails)
			: locator.mailModel.getUserMailboxDetails().then(mailbox => show(mailbox))


	} else {
		const message = lang.get("premiumOffer_msg", {"{1}": formatPrice(1, true)})
		const title = lang.get("upgradeReminderTitle_msg")

		Dialog.reminder(title, message, lang.getInfoLink("premiumProBusiness_link")).then(confirm => {
			if (confirm) {
				showUpgradeWizard()
			}
		})
	}
}

/**
 * Create and show a new mail editor with an invite message
 * @param mailboxDetails
 * @returns {*}
 */
export function writeInviteMail(mailboxDetails?: MailboxDetail) {
	const show = mailbox => {
		const username = logins.getUserController().userGroupInfo.name;
		const body = lang.get("invitationMailBody_msg", {
			'{registrationLink}': "https://mail.tutanota.com/signup",
			'{username}': username,
			'{githubLink}': "https://github.com/tutao/tutanota"
		})
		newMailEditorFromTemplate(mailbox, {}, lang.get("invitationMailSubject_msg"), body, null, false).then(dialog => dialog.show())
	}

	mailboxDetails
		? show(mailboxDetails)
		: locator.mailModel.getUserMailboxDetails().then(mailbox => show(mailbox))
}