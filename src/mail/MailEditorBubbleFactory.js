import m from "mithril"
import stream from "mithril/stream/stream.js"

import {Bubble} from "../gui/base/BubbleTextField"
import type {RecipientInfo} from "../api/common/RecipientInfo"
import type {RecipientInfoBubbleFactory} from "../misc/RecipientInfoBubbleHandler"
import type {RecipientField} from "./SendMailModel"
import {SendMailModel} from "./SendMailModel"
import type {Contact} from "../api/entities/tutanota/Contact"
import {createNewContact, getDisplayText, resolveRecipientInfo, resolveRecipientInfoContact} from "./MailUtils"
import {attachDropdown} from "../gui/base/DropdownN"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonColors, ButtonType} from "../gui/base/ButtonN"
import {neverNull} from "../api/common/utils/Utils"
import {ConnectionError, TooManyRequestsError} from "../api/common/error/RestError"
import {Dialog} from "../gui/base/Dialog"
import {FeatureType} from "../api/common/TutanotaConstants"
import {ContactEditor} from "../contacts/ContactEditor"
import {lazyContactListId} from "../contacts/ContactUtils"

type RecipientInfoBubble = Bubble<RecipientInfo>

// TODO finish this and pass in some logic from the MailEditorN
// can't get much else done until this is completed
export class MailEditorBubbleFactory implements RecipientInfoBubbleFactory {

	constructor(model: SendMailModel, field: RecipientField) {
		this.model = model
		this.field = field
	}

	/**
	 * @param name If null the name is taken from the contact if a contact is found for the email address
	 * @param address
	 * @param contact
	 */
	createBubble(name: ?string, address: string, contact: ?Contact): ?RecipientInfoBubble {

		let recipientInfo = this.model.addRecipient(this.field, {address, name, contact})
		if (this.model.logins().isInternalUserLoggedIn()) {
			resolveRecipientInfoContact(recipientInfo, this.model.contacts(), this.model.logins().getUserController().user)
		}

		let bubble: Stream<?RecipientInfoBubble> = stream(null)
		const buttonAttrs = attachDropdown({
				label: () => getDisplayText(recipientInfo.name, address, false),
				type: ButtonType.TextBubble,
				isSelected: () => false,
				color: ButtonColors.Elevated
			},
			() => recipientInfo.resolveContactPromise
				? recipientInfo.resolveContactPromise.then(
					// TODO check if this is actually nevernull
					contact => this._createRecipientInfoBubbleContextButtons(recipientInfo.name, address, contact, neverNull(bubble())))
				: Promise.resolve(this._createRecipientInfoBubbleContextButtons(recipientInfo.name, address, contact, neverNull(bubble()))),
			undefined, 250)


		// TODO
		//  something similar to this occurs in model._createRecipientInfo inside the call to addRecipient at the top of this method.
		// It's not exactly the same but i think there should be a way to remove this call?
		resolveRecipientInfo(this.model.mails(), recipientInfo)
			.then(() => m.redraw())
			.catch(ConnectionError, e => {
				// we are offline but we want to show the error dialog only when we click on send.
			})
			.catch(TooManyRequestsError, e => {
				Dialog.error("tooManyAttempts_msg")
			})

		bubble(new Bubble(recipientInfo, neverNull(buttonAttrs), address))
		return neverNull(bubble())
	}

	deleteBubble = (bubble: RecipientInfoBubble) => {
		this.model.removeRecipient(bubble.entity, this.field)
	}

	_createRecipientInfoBubbleContextButtons(name: string, mailAddress: string, contact: ?Contact, bubble: RecipientInfoBubble): Array<ButtonAttrs | string> {
		const canEditBubbleRecipient = this.model.user().isInternalUser() && !this.model.logins().isEnabled(FeatureType.DisableContacts)
		const previousMail = this.model.getPreviousMail()
		const canRemoveBubble = !previousMail || !previousMail.restrictions || previousMail.restrictions.participantGroupInfos.length === 0
		return [
			mailAddress,
			canEditBubbleRecipient
				? contact && contact._id
				? this._makeEditContactButtonAttrs(contact)
				: this._makeCreateContactButtonAttrs(bubble)
				: "",
			canRemoveBubble
				? this._makeRemoveRecipientButtonAttrs(bubble)
				: ""
		]
	}

	// TODO making and editing contacts doesn't update the model and/or the view properly
	_makeEditContactButtonAttrs(contact: Contact): ButtonAttrs {
		return {
			label: "editContact_label",
			type: ButtonType.Secondary,
			click: () => new ContactEditor(contact).show()
		}
	}

	_makeCreateContactButtonAttrs(bubble: RecipientInfoBubble): ButtonAttrs {
		return {
			label: "createContact_action",
			type: ButtonType.Secondary,
			click: () => {
				// contact list
				lazyContactListId(this.model.logins())
					.getAsync()
					.then(contactListId => {
						const newContact = createNewContact(this.model.logins().getUserController().user, bubble.entity.mailAddress, bubble.entity.name)
						new ContactEditor(newContact, contactListId).show()
					})
			}
		}
	}

	_makeRemoveRecipientButtonAttrs(bubble: RecipientInfoBubble): ButtonAttrs {
		return {
			label: "remove_action",
			type: ButtonType.Secondary,
			click: () => {
				this.model.removeRecipient(bubble.entity, this.field)
			}
		}
	}
}
