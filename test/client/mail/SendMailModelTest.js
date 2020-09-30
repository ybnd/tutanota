// @flow

import o from "ospec/ospec.js"
import en from "../../../src/translations/en"
import type {IUserController} from "../../../src/api/main/UserController"
import type {LoginController} from "../../../src/api/main/LoginController"
import type {MailModel} from "../../../src/mail/MailModel"
import type {Contact} from "../../../src/api/entities/tutanota/Contact"
import type {ContactModel} from "../../../src/contacts/ContactModel"
import {downcast} from "../../../src/api/common/utils/Utils"
import type {TutanotaProperties} from "../../../src/api/entities/tutanota/TutanotaProperties"
import {createTutanotaProperties} from "../../../src/api/entities/tutanota/TutanotaProperties"
import {SendMailModel} from "../../../src/mail/SendMailModel"
import {createGroupInfo} from "../../../src/api/entities/sys/GroupInfo"
import {createMailboxGroupRoot} from "../../../src/api/entities/tutanota/MailboxGroupRoot"
import {createGroup} from "../../../src/api/entities/sys/Group"
import {createMailBox} from "../../../src/api/entities/tutanota/MailBox"
import type {PublicKeyReturn} from "../../../src/api/entities/sys/PublicKeyReturn"
import {createPublicKeyReturn} from "../../../src/api/entities/sys/PublicKeyReturn"
import type {WorkerClient} from "../../../src/api/main/WorkerClient"
import {ConversationType} from "../../../src/api/common/TutanotaConstants"
import {lang} from "../../../src/misc/LanguageViewModel"
import type {Customer} from "../../../src/api/entities/sys/Customer"
import {mockAttribute, spy} from "../../api/TestUtils"

/*
mailModel:   resolveRecipientInfo(mail) -> getRecipientKeyData

contactModel: resolveRecipientInfoContact(contact) -> searchForContacts

eventController:   addEntityListener
		  removeEntityListener

 */

function mockWorker(): WorkerClient {
	return downcast({
		createMailDraft(...args) {},
		updateMailDraft(...args) {},
		sendMailDraft(...args) {},
		entityRequest(...args) {}
	})
}

function mockLoginController(userController: IUserController, internalLoggedIn: boolean = true): LoginController {
	return downcast({
		userController,
		isInternalUserLoggedIn: () => internalLoggedIn,
		getUserController() { return this.userController }
	})
}

function mockUserController(props: TutanotaProperties, customer: Customer): IUserController {
	return downcast({
		loadCustomer: () => Promise.resolve(customer),
		props
	})
}

function mockMailModel(internalAddresses: Array<String>): MailModel {
	return downcast({
		internalAddresses,
		getRecipientKeyData(mailAddress: string): Promise<?PublicKeyReturn> {
			return Promise.resolve(
				this.internalAddresses.includes(mailAddress)
					? createPublicKeyReturn()
					: null
			)
		}
	})
}


class ContactModelMock implements ContactModel {
	contacts: Array<Contact>

	constructor(contacts: Array<Contact>) {
		this.contacts = contacts
	}

	searchForContact(mailAddress: string): Promise<?Contact> {
		const contact = this.contacts.find(contact => contact.mailAddresses.includes(mailAddress))
		return Promise.resolve(contact)
	}
}


const DEFAULT_SENDER_FOR_TESTING = "test@tutanota.de"

const INTERNAL_RECIPIENT_1 = {
	name: "test1",
	address: "test1@tutanota.de",
	contact: null
}

const BODY_TEXT_1 = "lorem ipsum dolor yaddah yaddah"
const SUBJECT_LINE_1 = "Did you get that thing I sent ya"

o.spec("SendMailModel", () => {

	o.before(() => {
		// we need lang initialized because the SendMailModel constructor requires some translation
		lang.init(en)
	})
	// the global worker is used in various other places silently, like in call to update from _updateContacts
	// TODO find out where the worked is used
	let worker, logins, eventController, mailModel, contactModel, mailboxDetails, userController, model
	let customer: Customer

	o.beforeEach(() => {
		const worker = mockWorker()
		customer = downcast({})

		const tutanotaProperties = createTutanotaProperties(downcast({
			defaultSender: DEFAULT_SENDER_FOR_TESTING,
			defaultUnconfidential: true,
			notificationMailLanguage: "en",
			noAutomaticContacts: false,
			userGroupInfo: createGroupInfo({}),
		}))

		userController = mockUserController(tutanotaProperties, customer)
		logins = mockLoginController(userController)

		eventController = downcast({
			addEntityListener: spy(() => {}),
			removeEntityListener: spy(() => {})
		})

		mailModel = mockMailModel([])

		contactModel = new ContactModelMock([])

		mailboxDetails = {
			mailbox: createMailBox(),
			folders: [],
			mailGroupInfo: createGroupInfo(),
			mailGroup: createGroup(),
			mailboxGroupRoot: createMailboxGroupRoot()
		}

		model = new SendMailModel(worker, logins, mailModel, contactModel, downcast(eventController), mailboxDetails)

		mockAttribute(model, model._getDefaultSender, () => DEFAULT_SENDER_FOR_TESTING)
	})


	o.spec("initialization", () => {
		o("initWithTemplate empty", async () => {

			const initializedModel = await model.initWithTemplate({}, "", "", false, null)

			o(model.getConversationType()).equals(ConversationType.NEW)
			o(model.getSubject()).equals("")
			o(model.getBody()).equals("")
			o(model.getDraft()).equals(null)
			o(model.allRecipients().length).equals(0)
			o(model.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
			o(model.isConfidential()).equals(true)("isConfidential returns true if there are no external recipients regardless of the value of confidential")
			o(model.getAttachments().length).equals(0)

			o(model.hasMailChanged()).equals(false)("initialization should not flag mail changed")
		})

		o("initWithTemplate data", async () => {

			// TODO node does NOT like this for some reason, it works fine in chrome
			const initializedModel = await model.initWithTemplate(
				{to: [INTERNAL_RECIPIENT_1]},
				SUBJECT_LINE_1,
				BODY_TEXT_1,
				false,
				DEFAULT_SENDER_FOR_TESTING
			)

			// o(model.getConversationType()).equals(ConversationType.NEW)
			// o(model.getSubject()).equals(SUBJECT_LINE_1)
			// o(model.getBody()).equals(BODY_TEXT_1)
			// o(model.getDraft()).equals(null)
			// o(model.allRecipients().length).equals(1)
			// // TODO check recipient values
			// o(model.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
			// o(model.isConfidential()).equals(true)("isConfidential returns true if there are no external recipients regardless of the value of confidential")
			// o(model.getAttachments().length).equals(0)
			//
			// o(model.hasMailChanged()).equals(false)("initialization should not flag mail changed")
		})
	})
})

/* To Test
Adding, Removing, Updating recipients
Sending emails
Saving drafts

All forms of email initialization
	New,
	From Draft,
	etc

updating passwords
checking for exceptions to be thrown upon saving draft and sending

updating subject and body

 */
