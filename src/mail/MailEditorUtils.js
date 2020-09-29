// @flow

import m from "mithril"
import type {Attachment, RecipientField} from "./SendMailModel"
import {SendMailModel} from "./SendMailModel"
import {findAllAndRemove, remove} from "../api/common/utils/ArrayUtils"
import {debounce, downcast, neverNull} from "../api/common/utils/Utils"
import {Mode} from "../api/Env"
import {fileApp} from "../native/FileApp"
import {fileController} from "../file/FileController"
import {PermissionError} from "../api/common/error/PermissionError"
import {Dialog} from "../gui/base/Dialog"
import {FileNotFoundError} from "../api/common/error/FileNotFoundError"
import type {RecipientInfo} from "../api/common/RecipientInfo"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {Type} from "../gui/base/TextFieldN"
import {PasswordIndicator} from "../gui/base/PasswordIndicator"
import {getPasswordStrengthForUser} from "../misc/PasswordUtils"
import type {Language} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonColors, ButtonType} from "../gui/base/ButtonN"
import type {File as TutanotaFile} from "../api/entities/tutanota/File"
import {FileOpenError} from "../api/common/error/FileOpenError"
import {attachDropdown} from "../gui/base/DropdownN"
import {Icons} from "../gui/base/icons/Icons"
import {formatStorageSize} from "../misc/Formatter"
import type {MailEditorAttrs} from "./MailEditorN"
import {logins} from "../api/main/LoginController"
import {load} from "../api/main/Entity"
import {CustomerPropertiesTypeRef} from "../api/entities/sys/CustomerProperties"
import {client} from "../misc/ClientDetector"
import {getTimeZone} from "../calendar/CalendarUtils"
import type {ConversationTypeEnum} from "../api/common/TutanotaConstants"
import {ConversationType, FeatureType} from "../api/common/TutanotaConstants"
import {ContactEditor} from "../contacts/ContactEditor"
import {lazyContactListId} from "../contacts/ContactUtils"
import {createNewContact, getDisplayText} from "./MailUtils"
import {Bubble} from "../gui/base/BubbleTextField"

export function chooseAndAttachFile(model: SendMailModel, boundingRect: ClientRect, fileTypes?: Array<string>): Promise<?$ReadOnlyArray<FileReference | DataFile>> {
	return showFileChooserForAttachments(boundingRect, fileTypes)
		.then(files => {
			model.attachFiles((files: any))
			return files
		})
}

export function showFileChooserForAttachments(boundingRect: ClientRect, fileTypes?: Array<string>): Promise<?$ReadOnlyArray<FileReference | DataFile>> {
	const fileSelector = env.mode === Mode.App
		? fileApp.openFileChooser(boundingRect)
		: fileController.showFileChooser(true, fileTypes)

	return fileSelector
		.catch(PermissionError, () => {
			Dialog.error("fileAccessDeniedMobile_msg")
		})
		.catch(FileNotFoundError, () => {
			Dialog.error("couldNotAttachFile_msg")
		})
}

export function createPasswordField(model: SendMailModel, recipient: RecipientInfo): TextFieldAttrs {

	const password = model.getPassword(recipient)

	const passwordIndicator = new PasswordIndicator(() => getPasswordStrengthForUser(password, recipient, model.getMailboxDetails())
		/ 0.8)

	return {
		label: () => lang.get("passwordFor_label", {"{1}": recipient.mailAddress}),
		helpLabel: () => m(passwordIndicator),
		value: () => password,
		type: Type.ExternalPassword,
		oninput: (val) => model.setPassword(recipient, val)
	}
}

export type InlineImageReference = {
	cid: string;
	objectUrl: string;
}

export function createInlineImage(file: FileReference | DataFile): InlineImageReference {
	// Let'S assume it's DataFile for now... Editor bar is available for apps but image button is not
	const dataFile: DataFile = downcast(file)
	const cid = Math.random().toString(30).substring(2)
	file.cid = cid
	const blob = new Blob([dataFile.data], {type: file.mimeType})
	const objectUrl = URL.createObjectURL(blob)
	return {
		cid: cid,
		objectUrl: objectUrl
	}
}

export function createAttachmentButtonAttrs(model: SendMailModel, attrs: MailEditorAttrs): Array<ButtonAttrs> {
	return model.getAttachments()
	            // Only show file buttons which do not correspond to inline images in HTML
	            .filter((item) => attrs.mentionedInlineImages.includes(item.cid) === false)
	            .map(file => {
		            const lazyButtonAttrs = [
			            {
				            label: "download_action",
				            type: ButtonType.Secondary,
				            click: () => _downloadAttachment(file),
			            },
			            {
				            label: "remove_action",
				            type: ButtonType.Secondary,
				            click: () => {
					            model.removeAttachment(file)
					            // If an attachment has a cid it means it could be in the editor's inline images too
					            if (file.cid) {
						            const imageElement = attrs.inlineImageElements
						                                      .find((e) => e.getAttribute("cid") === file.cid)
						            if (imageElement) {
							            imageElement.remove()
							            remove(attrs.inlineImageElements, imageElement)
						            }
					            }
					            m.redraw()
				            }
			            }
		            ]

		            return attachDropdown({
			            label: () => file.name,
			            icon: () => Icons.Attachment,
			            type: ButtonType.Bubble,
			            staticRightText: "(" + formatStorageSize(Number(file.size)) + ")",
			            colors: ButtonColors.Elevated,
		            }, () => lazyButtonAttrs)
	            })
}

export function getTemplateLanguages(sortedLanguages: Array<Language>): Promise<Array<Language>> {
	return logins.getUserController().loadCustomer()
	             .then((customer) => load(CustomerPropertiesTypeRef, neverNull(customer.properties)))
	             .then((customerProperties) => {
		             return sortedLanguages.filter(sL =>
			             customerProperties.notificationMailTemplates.find((nmt) => nmt.language === sL.code))
	             })
	             .catch(() => [])
}

export function getSupportMailSignature(): string {
	return "<br><br>--"
		+ `<br>Client: ${client.getIdentifier()}`
		+ `<br>Tutanota version: ${env.versionNumber}`
		+ `<br>Time zone: ${getTimeZone()}`
		+ `<br>User agent:<br> ${navigator.userAgent}`
}

export function createRecipientInfoBubble(model: SendMailModel, recipient: RecipientInfo, field: RecipientField): Bubble<RecipientInfo> {
	console.log("CREATING BUBBLE", recipient, field)
	const buttonAttrs = attachDropdown({
			label: () => getDisplayText(recipient.name, recipient.mailAddress, false),
			type: ButtonType.TextBubble,
			isSelected: () => false,
			color: ButtonColors.Elevated
		},
		() => recipient.resolveContactPromise
			? recipient.resolveContactPromise.then(
				contact => createRecipientInfoBubbleContextButtons(model, recipient, field))
			: Promise.resolve(createRecipientInfoBubbleContextButtons(model, recipient, field)),
		undefined, 250)


	return new Bubble(recipient, buttonAttrs, recipient.mailAddress)
}

export function createRecipientInfoBubbleContextButtons(model: SendMailModel, recipient: RecipientInfo, field: RecipientField): Array<ButtonAttrs | string> {
	const canEditBubbleRecipient = model.user().isInternalUser() && !model.logins().isEnabled(FeatureType.DisableContacts)
	const previousMail = model.getPreviousMail()
	const canRemoveBubble = !previousMail || !previousMail.restrictions || previousMail.restrictions.participantGroupInfos.length === 0
	return [
		recipient.mailAddress,
		canEditBubbleRecipient
			? recipient.contact && recipient.contact._id
			// TODO making and editing contacts doesn't update the model and/or the view properly
			? {
				label: () => lang.get("editContact_label"),
				type: ButtonType.Secondary,
				click: () => new ContactEditor(recipient.contact).show()
			}
			: {
				label: () => lang.get("createContact_action"),
				type: ButtonType.Secondary,
				click: () => {
					// contact list
					lazyContactListId(model.logins())
						.getAsync()
						.then(contactListId => {
							const newContact = createNewContact(model.logins().getUserController().user, recipient.mailAddress, recipient.name)
							new ContactEditor(newContact, contactListId, (newContactId => model.contactReceiver(recipient, field, newContactId))).show()
						})
				}
			}
			: "",
		canRemoveBubble
			? {
				label: "remove_action",
				type: ButtonType.Secondary,
				click: () => {
					model.removeRecipient(recipient, field, true)
				}
			}
			: ""
	]
}

export function conversationTypeString(conversationType: ConversationTypeEnum): string {
	let key
	switch (conversationType) {
		case ConversationType.NEW:
			key = "newMail_action"
			break
		case ConversationType.REPLY:
			key = "reply_action"
			break
		case ConversationType.FORWARD:
			key = "forward_action"
			break
		default:
			key = "emptyString_msg"
	}

	return lang.get(key)
}


function _downloadAttachment(attachment: Attachment) {
	{
		let promise = Promise.resolve()
		if (attachment._type === 'FileReference') {
			promise = fileApp.open(downcast(attachment))
		} else if (attachment._type === "DataFile") {
			promise = fileController.open(downcast(attachment))
		} else {
			promise = fileController.downloadAndOpen(((attachment: any): TutanotaFile), true)
		}
		promise
			.catch(FileOpenError, () => Dialog.error("canNotOpenFileOnDevice_msg"))
			.catch(e => {
				const msg = e || "unknown error"
				console.error("could not open file:", msg)
				return Dialog.error("errorDuringFileOpen_msg")
			})
	}
}

function _cleanupInlineAttachmentsDontUseThisOne(domElement: HTMLElement, inlineImageElements: Array<HTMLElement>, attachments: Array<Attachment>) {
	// Previously we replied on subtree option of MutationObserver to receive info when nested child is removed.
	// It works but it doesn't work if the parent of the nested child is removed, we would have to go over each mutation
	// and check each descendant and if it's an image with CID or not.
	// It's easier and faster to just go over each inline image that we know about. It's more bookkeeping but it's easier
	// code which touches less dome.
	//
	// Alternative would be observe the parent of each inline image but that's more complexity and we need to take care of
	// new (just inserted) inline images and also assign listener there.
	// Doing this check instead of relying on mutations also helps with the case when node is removed but inserted again
	// briefly, e.g. if some text is inserted before/after the element, Squire would put it into another diff and this
	// means removal + insertion.
	const elementsToRemove = []
	inlineImageElements.forEach((inlineImage) => {
		if (domElement && !domElement.contains(inlineImage)) {
			const cid = inlineImage.getAttribute("cid")
			const attachmentIndex = attachments.findIndex((a) => a.cid === cid)
			if (attachmentIndex !== -1) {
				attachments.splice(attachmentIndex, 1)
				elementsToRemove.push(inlineImage)
				m.redraw()
			}
		}
	})
	findAllAndRemove(inlineImageElements, (imageElement) => elementsToRemove.includes(imageElement))
}

export const cleanupInlineAttachments = debounce(50, (e: HTMLElement, i: Array<HTMLElement>, a: Array<Attachment>) => _cleanupInlineAttachmentsDontUseThisOne(e, i, a))
