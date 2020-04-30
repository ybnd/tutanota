// @flow
import m from "mithril"
import {load, loadAll} from "../api/main/Entity"
import {nativeApp} from "../native/NativeWrapper"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode, isDesktop} from "../api/Env"
import {Request} from "../api/common/WorkerProtocol.js"
import {ConversationEntryTypeRef} from "../api/entities/tutanota/ConversationEntry"
import {getFolderName, getMailboxName, isExcludedMailAddress} from "./MailUtils"
import {mailModel} from "./MailModel"
import {getElementId, listIdPart} from "../api/common/EntityFunctions"
import type {PosRect} from "../gui/base/Dropdown"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {SingleMailView} from "./SingleMailView"
import {Keys, MailState} from "../api/common/TutanotaConstants"
import type {DomMutation} from "../gui/animation/Animations"
import {animations, scroll} from "../gui/animation/Animations"
import {ease} from "../gui/animation/Easing"
import type {Shortcut} from "../misc/KeyManager"
import {keyManager} from "../misc/KeyManager"
import type {Mail} from "../api/entities/tutanota/Mail"

assertMainOrNode()

const SCROLL_FACTOR = 4 / 5

/**
 * The MailViewer displays a mail. The mail body is loaded asynchronously.
 */
export class MailViewer {
	view: Function;
	mail: Mail;
	oncreate: Function;
	onbeforeremove: Function;
	onremove: Function;
	_folderText: ?string;
	_domForScrolling: ?HTMLElement;
	_scrollAnimation: Promise<void>;
	_threadViewers: {before: Array<SingleMailView>, current: SingleMailView, after: Array<SingleMailView>}

	constructor(mail: Mail, showFolder: boolean) {
		if (isDesktop()) {
			nativeApp.invokeNative(new Request('sendSocketMessage', [{mailAddress: mail.sender.address}]))
		}
		this.mail = mail
		this._folderText = null
		this._scrollAnimation = Promise.resolve()

		if (showFolder) {
			this._setFolderText(mail)
		}


		this._threadViewers = {before: [], current: new SingleMailView(mail), after: []}
		this._threadViewers.current.setExpanded(true)

		loadThread(mail).then((threadMails) => prepareMailViewers(threadMails)).then(({before, after}) => {
			this._threadViewers.before = before
			this._threadViewers.after = after
			m.redraw()
		})

		const shortcuts = this._setupShortcuts()
		this.oncreate = (vnode) => {
			this._domForScrolling = vnode.dom
			keyManager.registerShortcuts(shortcuts)
		}
		// onremove is called when we or any of our parents are removed from dom
		this.onremove = () => {
			keyManager.unregisterShortcuts(shortcuts)
		}

		this.view = () => m("#mail-viewer.fill-absolute.scroll-no-overlay.overflow-x-hidden", [
				this._threadViewers.before.map((v, i, arr) => m(v, {
					key: getElementId(v.mail),
					// When there are items above and they are rendered we want to scroll to the current email
					oncreate: i === arr.length - 1
						? (vnode) => {
							if (this._domForScrolling) {
								this._domForScrolling.scrollTop = vnode.dom.offsetTop + vnode.dom.scrollHeight - 110
							}
						}
						: null
				})),
				m(this._threadViewers.current),
				this._threadViewers.after.map(v => m(v, {key: getElementId(v.mail)})),
			],
		)

		this._setupShortcuts()
	}

	getBounds(): ?PosRect {
		// TODO: check if correct
		this._threadViewers.current.getBounds()
	}

	_setupShortcuts(): Array<Shortcut> {
		let mainViewer = this._threadViewers.current

		return [
			{
				key: Keys.E,
				enabled: () => this.mail.state === MailState.DRAFT,
				exec: () => {
					mainViewer._editDraft()
				},
				help: "editMail_action"
			},
			{
				key: Keys.H,
				exec: () => mainViewer._showHeaders(),
				help: "showHeaders_action"
			},
			{
				key: Keys.R,
				exec: () => {
					mainViewer._reply(false)
				},
				help: "reply_action"
			},
			{
				key: Keys.R,
				shift: true,
				exec: () => {
					mainViewer._reply(true)
				},
				help: "replyAll_action"
			},
			{
				key: Keys.F,
				shift: true,
				exec: () => {
					mainViewer._forward()
				},
				help: "forward_action"
			},
		]
	}

	scrollUp(): void {
		this._scrollIfDomBody((dom) => {
			const current = dom.scrollTop
			const toScroll = dom.clientHeight * SCROLL_FACTOR
			return scroll(current, Math.max(0, current - toScroll))
		})
	}

	scrollDown(): void {
		this._scrollIfDomBody((dom) => {
			const current = dom.scrollTop
			const toScroll = dom.clientHeight * SCROLL_FACTOR
			return scroll(current, Math.min(dom.scrollHeight - dom.offsetHeight, dom.scrollTop + toScroll))
		})
	}

	scrollToTop(): void {
		this._scrollIfDomBody((dom) => {
			return scroll(dom.scrollTop, 0)
		})
	}

	scrollToBottom(): void {
		this._scrollIfDomBody((dom) => {
			const end = dom.scrollHeight - dom.offsetHeight
			return scroll(dom.scrollTop, end)
		})
	}

	_scrollIfDomBody(cb: (dom: HTMLElement) => DomMutation) {
		if (this._domForScrolling) {
			const dom = this._domForScrolling
			if (this._scrollAnimation.isFulfilled()) {
				this._scrollAnimation = animations.add(dom, cb(dom), {easing: ease.inOut})
			}
		}
	}

	actionButtons(mail: Mail, mobile: boolean): Children {
		return this._threadViewers.current.actionButtons(mail, mobile)
	}

	_setFolderText(mail: Mail) {
		let folder = mailModel.getMailFolder(mail._id[0])
		if (folder) {
			mailModel.getMailboxDetailsForMail(mail).then((mailboxDetails) => {
				this._folderText =
					`${lang.get("location_label")}: ${getMailboxName(mailboxDetails)} / ${getFolderName(folder)}`.toUpperCase()
				m.redraw()
			})
		}
	}
}

function loadThread(mail) {
	const threadMails = {before: [], after: []}
	return loadAll(ConversationEntryTypeRef, listIdPart(mail.conversationEntry))
		.then((entries) => Promise.map(entries, (entry) => entry.mail && load(MailTypeRef, entry.mail)))
		.then((mails) => {
			const mailId = getElementId(mail)
			for (let threadMail of mails) {
				if (threadMail == null) continue
				const threadMailId = getElementId(threadMail)
				if (threadMailId === mailId) {
					continue
				} else if (threadMailId < mailId) {
					threadMails.before.push(threadMail)
				} else {
					threadMails.after.push(threadMail)
				}
			}
			return threadMails
		})
}

function prepareMailViewers(threadMails) {
	return {
		before: threadMails.before.map(mail => new SingleMailView(mail)),
		after: threadMails.after.map(mail => new SingleMailView(mail))
	}
}

export function isAnnouncement(mail: Mail): boolean {
	return isExcludedMailAddress(mail.sender.address)
}