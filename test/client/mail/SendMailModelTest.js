// @flow

import o from "ospec/ospec.js"
import en from "../../../src/translations/en"
import type {IUserController} from "../../../src/api/main/UserController"
import type {LoginController} from "../../../src/api/main/LoginController"
import type {MailboxDetail, MailModel} from "../../../src/mail/MailModel"
import type {Contact} from "../../../src/api/entities/tutanota/Contact"
import {createContact} from "../../../src/api/entities/tutanota/Contact"
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
import type {User} from "../../../src/api/entities/sys/User"
import {createUser} from "../../../src/api/entities/sys/User"
import {isTutanotaMailAddress, RecipientInfoType} from "../../../src/api/common/RecipientInfo"
import type {Mail} from "../../../src/api/entities/tutanota/Mail"
import {createMail} from "../../../src/api/entities/tutanota/Mail"
import type {EventController} from "../../../src/api/main/EventController"
import {createMailAddress} from "../../../src/api/entities/tutanota/MailAddress"

type TestIdGenerator = {
	newId: () => Id,
	newListId: () => Id,
	newIdTuple: () => IdTuple
}
let testIdGenerator: TestIdGenerator

function mockWorker(): WorkerClient {
	return downcast({
		createMailDraft(draft: Mail, ...args): Promise<Mail> {
			console.log(args)
			return Promise.resolve(draft)
		},
		updateMailDraft(draft: Mail, ...args): Promise<Mail> {
			console.log(args)
			return Promise.resolve(draft)
		},
		sendMailDraft(...args): Promise<void> {
			console.log(args)
			return Promise.resolve()
		},
		entityRequest(...args): Promise<any> {
			console.log(args)
			return Promise.resolve()
		}
	})
}

function mockLoginController(userController: IUserController, internalLoggedIn: boolean = true): LoginController {
	return downcast({
		userController,
		isInternalUserLoggedIn: () => internalLoggedIn,
		getUserController() { return this.userController }
	})
}

function mockUserController(user: User, props: TutanotaProperties, customer: Customer): IUserController {
	return downcast({
		user,
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

function mockEntity(typeRef: TypeRef, id: Id | IdTuple, attrs: Object): any {
	return Object.assign({_type: typeRef, _id: id}, attrs)
}

const ADDRESS1 = "address1@test.com"
const ADDRESS2 = "address2@test.com"


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
	let worker: WorkerClient, logins: LoginController, eventController: EventController, mailModel: MailModel, contactModel: ContactModel,
		mailboxDetails: MailboxDetail, userController: IUserController, model: SendMailModel
	let customer: Customer

	o.beforeEach(() => {

		testIdGenerator = {
			currentIdValue: 0,
			currentListIdValue: 0,
			newId(): Id {
				return (this.currentIdValue++).toString()
			},
			newListId(): Id {
				return (this.currentListIdValue++).toString()
			},
			newIdTuple(): IdTuple {
				return [this.getListId(), this.getId()]
			}
		}

		worker = mockWorker()
		customer = downcast({})

		const tutanotaProperties = createTutanotaProperties(downcast({
			defaultSender: DEFAULT_SENDER_FOR_TESTING,
			defaultUnconfidential: true,
			notificationMailLanguage: "en",
			noAutomaticContacts: false,
			userGroupInfo: createGroupInfo({}),
			// emailSignatureType: EmailSignatureType.EMAIL_SIGNATURE_TYPE_DEFAULT,
			// customEmailSignature: "CUSTOM TEST SIGNATURE"
		}))

		const mockUser = createUser({})
		userController = mockUserController(mockUser, tutanotaProperties, customer)
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

		mockAttribute(model, model._createAndResolveRecipientInfo, (name, address, contact, resolveLazily) => {
			return {
				type: isTutanotaMailAddress(address) ? RecipientInfoType.INTERNAL : RecipientInfoType.EXTERNAL,
				mailAddress: address,
				name: name,
				contact: contact || createContact({
					firstName: name,
					mailAddresses: [address]
				}),
				resolveContactPromise: null
			}
		})

		mockAttribute(model._entityClient, model._entityClient.load, (typeRef, id, params) => {
			return Promise.resolve({_type: typeRef, _id: id})
		})
	})


	o.spec("initialization", () => {
		o("initWithTemplate empty", async () => {

			const initializedModel = await model.initWithTemplate({}, "", "", false, undefined)

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

			o(initializedModel.getConversationType()).equals(ConversationType.NEW)
			o(initializedModel.getSubject()).equals(SUBJECT_LINE_1)
			o(initializedModel.getBody()).equals(BODY_TEXT_1)
			o(initializedModel.getDraft()).equals(null)
			o(initializedModel.allRecipients().length).equals(1)
			// TODO check recipient values
			o(initializedModel.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
			o(initializedModel.isConfidential()).equals(true)("isConfidential returns true if there are no external recipients regardless of the value of confidential")
			o(initializedModel.getAttachments().length).equals(0)

			o(initializedModel.hasMailChanged()).equals(false)("initialization should not flag mail changed")
		})

		o("initFromMailToURL with invalid URL", () => {
			const url = ""

			o(() => model.initWithMailtoUrl(url, false)).throws(Error)
		})

		o("initFromMailToURL with valid empty URL", async () => {
			const url = "mailto:"

			await model.initWithMailtoUrl(url, false)

			o(model.toRecipients().length).equals(0)
			o(model.ccRecipients().length).equals(0)
			o(model.bccRecipients().length).equals(0)
			o(model.getSubject()).equals("")
			o(model.getBody()).equals("")
			o(model.getBody()).equals("")
		})

		o("initFromMailToURL with valid URL", async () => {
			const url = "mailto:bed-free@tutanota.de?subject=This%20is%20the%20subject&cc=map-free@tutanota.de&body=This%20is%20the%20body%0D%0AKind%20regards%20someone"

			await model.initWithMailtoUrl(url, false)

			o(model.toRecipients().length).equals(1)
			o(model.toRecipients()[0].mailAddress).equals("bed-free@tutanota.de")
			o(model.ccRecipients().length).equals(1)
			o(model.ccRecipients()[0].mailAddress).equals("map-free@tutanota.de")
			o(model.bccRecipients().length).equals(0)
			o(model.getSubject()).equals("This is the subject")
			o(model.getBody()).equals("This is the body<br>Kind regards someone")
		})

		o("initWithDraft with blank data", async () => {

			const draftMail = createMail({
				confidential: false,
				sender: createMailAddress(),
				toRecipients: [],
				ccRecipients: [],
				bccRecipients: [],
				subject: "",
				replyTos: []
			})

			// TODO node does NOT like this for some reason, it works fine in chrome
			const initializedModel = await model.initWithDraft(draftMail, [], BODY_TEXT_1)

			o(initializedModel.getConversationType()).equals(ConversationType.NEW)
			o(initializedModel.getSubject()).equals(draftMail.subject)
			o(initializedModel.getBody()).equals(BODY_TEXT_1)
			o(initializedModel.getDraft()).equals(draftMail)
			o(initializedModel.allRecipients().length).equals(0)
			// TODO check recipient values
			o(initializedModel.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
			o(initializedModel.isConfidential()).equals(true)("isConfidential returns true if there are no external recipients regardless of the value of confidential")
			o(initializedModel.getAttachments().length).equals(0)
			o(initializedModel.hasMailChanged()).equals(false)("initialization should not flag mail changed")
		})

		o("initWithDraft with some data", async () => {
			const draftMail = createMail({
				confidential: true,
				sender: createMailAddress(),
				toRecipients: [createMailAddress({address: ""}), createMailAddress({address: ADDRESS1})],
				ccRecipients: [createMailAddress({address: ADDRESS2})],
				bccRecipients: [],
				subject: SUBJECT_LINE_1,
				replyTos: []
			})

			// TODO node does NOT like this for some reason, it works fine in chrome
			const initializedModel = await model.initWithDraft(draftMail, [], BODY_TEXT_1)

			o(initializedModel.getConversationType()).equals(ConversationType.NEW)
			o(initializedModel.getSubject()).equals(draftMail.subject)
			o(initializedModel.getBody()).equals(BODY_TEXT_1)
			o(initializedModel.getDraft()).equals(draftMail)
			o(initializedModel.allRecipients().length).equals(2)("Only MailAddresses with a valid address will be accepted as recipients")
			o(initializedModel.toRecipients().length).equals(1)
			o(initializedModel.ccRecipients().length).equals(1)
			o(initializedModel.bccRecipients().length).equals(0)
			// TODO check recipient values
			o(initializedModel.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
			o(initializedModel.isConfidential()).equals(true)("isConfidential returns true if there are no external recipients regardless of the value of confidential")
			o(initializedModel.getAttachments().length).equals(0)
			o(initializedModel.hasMailChanged()).equals(false)("initialization should not flag mail changed")
		})
	})

	o("isConfidential", async () => {
		await model.initWithTemplate({}, "", "", false, "")

		o(model.isConfidential()).equals(true)

		model._toRecipients.push(downcast({type: RecipientInfoType.INTERNAL}))
		o(model.isConfidential()).equals(true)

		model._toRecipients.push(downcast({type: RecipientInfoType.EXTERNAL}))
		o(model.isConfidential()).equals(false)

		model.setConfidential(true)
		o(model.isConfidential()).equals(true)
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
