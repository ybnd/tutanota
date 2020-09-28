// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"

import {Editor} from "../gui/base/Editor"
import type {Recipients} from "./SendMailModel"
import {defaultSendMailModel, mailAddressToRecipient, SendMailModel} from "./SendMailModel"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import type {MailboxDetail} from "./MailModel"
import {checkApprovalStatus} from "../misc/LoginUtils"
import {getDefaultSender, getEnabledMailAddressesWithUser, parseMailtoUrl, replaceCidsWithInlineImages} from "./MailUtils"
import {PermissionError} from "../api/common/error/PermissionError"
import {locator} from "../api/main/MainLocator"
import {logins} from "../api/main/LoginController"
import {formatPrice} from "../subscription/SubscriptionUtils"
import type {ConversationTypeEnum} from "../api/common/TutanotaConstants"
import {ALLOWED_IMAGE_FORMATS, Keys, MailMethod} from "../api/common/TutanotaConstants"
import {FileNotFoundError} from "../api/common/error/FileNotFoundError"
import {PreconditionFailedError} from "../api/common/error/RestError"
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
import {BubbleTextField} from "../gui/base/BubbleTextField"
import {RecipientInfoBubbleHandler} from "../misc/RecipientInfoBubbleHandler"
import {MailEditorBubbleFactory} from "./MailEditorBubbleFactory"
import {
	chooseAndAttachFile,
	cleanupInlineAttachments,
	createAttachmentButtonAttrs,
	createInlineImage,
	createPasswordField,
	getSupportMailSignature
} from "./MailEditorUtils"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/ExpanderN"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {newMouseEvent} from "../gui/HtmlUtils"
import {windowFacade} from "../misc/WindowFacade"
import {UserError} from "../api/common/error/UserError"
import {findAllAndRemove} from "../api/common/utils/ArrayUtils"
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
import {downcast} from "../api/common/utils/Utils"
import {showUpgradeWizard} from "../subscription/UpgradeSubscriptionWizard"


export type MailEditorAttrs = {
	body: Stream<string>,
	objectUrls: Array<string>,
	mentionedInlineImages: Array<string>,
	inlineImageElements: Array<HTMLElement>,
	doBlockExternalContent: Stream<boolean>,
	doShowToolbar: Stream<boolean>,
	doFocusEditorOnLoad: boolean,
	onload?: Function,
	onclose?: Function,
	areDetailsExpanded: Stream<boolean>,
	selectedNotificationLanguage: Stream<string>,
	inlineImages?: Promise<InlineImages> // TODO replace inline images on creation
}

export function createMailEditorAttrs(doBlockExternalContent: boolean, doFocusEditorOnLoad: boolean, inlineImages?: Promise<InlineImages>): MailEditorAttrs {
	const attrs = {
		body: stream(""),
		objectUrls: [],
		mentionedInlineImages: [],
		inlineImageElements: [],
		doBlockExternalContent: stream(doBlockExternalContent),
		doShowToolbar: stream(false),
		doFocusEditorOnLoad: doFocusEditorOnLoad,
		areDetailsExpanded: stream(false),
		selectedNotificationLanguage: stream(""),
		inlineImages: inlineImages,
	}
	return attrs
}


export function MailEditorN(model: SendMailModel): Class<MComponent<MailEditorAttrs>> {
	return class _MailEditorN implements MComponent<MailEditorAttrs> {

		editor: Editor;
		toolbar: RichTextToolbar;
		toRecipientsField: BubbleTextField<RecipientInfo>
		ccRecipientsField: BubbleTextField<RecipientInfo>
		bccRecipientsField: BubbleTextField<RecipientInfo>

		constructor(vnode: Vnode<MailEditorAttrs>) {
			const a = vnode.attrs

			this.editor = new Editor(200, (html, isPaste) => {
				const sanitized = htmlSanitizer.sanitizeFragment(html, !isPaste && a.doBlockExternalContent())
				a.mentionedInlineImages = sanitized.inlineImageCids
				return sanitized.html
			})

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
						m.redraw()
						files.forEach(file => {
							const img = createInlineImage(file)
							a.objectUrls.push(img.objectUrl)
							a.inlineImageElements.push(this.editor.insertImage(img.objectUrl, {cid: img.cid, style: 'max-width: 100%'}))
						})
					})


			this.toolbar = new RichTextToolbar(this.editor, {imageButtonClickHandler: attachImageHandler})

			const bubbleHandlers = [
				"to", "cc", "bcc"
			].map(field => new RecipientInfoBubbleHandler(new MailEditorBubbleFactory(model, field)))
			this.toRecipientsField = new BubbleTextField("to_label", bubbleHandlers[0])
			this.ccRecipientsField = new BubbleTextField("cc_label", bubbleHandlers[1])
			this.bccRecipientsField = new BubbleTextField("bcc_label", bubbleHandlers[2])

			// TODO
			model.onRecipientRemoved = (recipient, field) => {
				switch (field) {
					case "to":
						findAllAndRemove(this.toRecipientsField.bubbles, (bubble) => bubble.entity === recipient)
						break
					case "cc":
						findAllAndRemove(this.ccRecipientsField.bubbles, (bubble) => bubble.entity === recipient)
						break
					case "bcc":
						findAllAndRemove(this.bccRecipientsField.bubbles, (bubble) => bubble.entity === recipient)
						break
					default:
						break
				}
			}
			if (model.logins().isInternalUserLoggedIn()) {
				this.toRecipientsField.textField._injectionsRight = () => m(ExpanderButtonN, {
					label: "show_action",
					expanded: a.areDetailsExpanded,
				})
			} else {
				this.toRecipientsField.textField.setDisabled()
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

			model.onMailChanged = () => {
				// TODO what else go here?????
				m.redraw()
			}
		}

		view(vnode: Vnode<MailEditorAttrs>) {
			const a = vnode.attrs
			a.body = () => this.editor.getHTML()

			const confidentialButtonAttrs = {
				label: "confidential_action",
				click: (event, attrs) => model.setConfidential(!model.isConfidential()),
				icon: () => model.isConfidential() ? Icons.Lock : Icons.Unlock,
				isSelected: () => model.isConfidential(),
				noRecipientInfoBubble: true,
			}
			// TODO image is not attached, could be an issue in the sendmailmodel... but then again... it does????
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
				           .filter(r => r.type === RecipientInfoType.EXTERNAL
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
					a.doFocusEditorOnLoad && this.editor.focus()
				}
			}, [
				m(this.toRecipientsField),
				m(ExpanderPanelN, {expanded: a.areDetailsExpanded},
					m(".details", [
						m(this.ccRecipientsField),
						m(this.bccRecipientsField),
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


// TODO cleanup the null mailboxdetails check duplication
// TODO finish initialization functions once sendmailmodel initialization is ready
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
		})
		                                    .then(model => {
			                                    return _createMailEditorDialog(model, blockExternalContent, inlineImages)
		                                    })
	}

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
		// TODO It doesn't know if there is invalid text remaining in a recipient field - how to check this?????
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
		middle: () => lang.get(model.getConversationTypeTranslationKey()),
		create: () => {
			windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {
				closeButtonAttrs.click(newMouseEvent(), domCloseButton)
			})
		},
		remove: () => {
			windowCloseUnsubscribe()
		}
	}

	mailEditorAttrs = createMailEditorAttrs(blockExternalContent, model.toRecipients().length !== 0, inlineImages);

	dialog = Dialog.largeDialogN(headerBarAttrs, MailEditorN(model), mailEditorAttrs)
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