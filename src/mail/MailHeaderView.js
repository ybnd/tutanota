//@flow
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {RecipientButton} from "../gui/base/RecipientButton"
import {getDisplayText, getSenderHeading, getSenderOrRecipientHeadingTooltip, isTutanotaTeamMail} from "./MailUtils"
import {createAsyncDropdown} from "../gui/base/DropdownN"
import {InboxRuleType, TabIndex} from "../api/common/TutanotaConstants"
import {lang} from "../misc/LanguageViewModel"
import {memoized, neverNull} from "../api/common/utils/Utils"
import {Dialog} from "../gui/base/Dialog"
import {formatDateWithWeekday, formatStorageSize, formatTime} from "../misc/Formatter"
import {theme} from "../gui/theme"
import {styles} from "../gui/styles"
import {Icon, progressIcon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"
import {isAnnouncement} from "./MailViewer"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/ExpanderN"
import {Button, createDropDownButton} from "../gui/base/Button"
import {isAndroidApp, isDesktop, isIOSApp} from "../api/Env"
import {fileController} from "../file/FileController"
import {FileOpenError} from "../api/common/error/FileOpenError"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {DomRectReadOnlyPolyfilled} from "../gui/base/Dropdown"
import {size} from "../gui/size"
import {client} from "../misc/ClientDetector"
import {Banner, BannerType} from "../gui/base/Banner"
import Badge from "../gui/base/Badge"
import type {File as TutanotaFile} from "../api/entities/tutanota/File"
import type {Mail} from "../api/entities/tutanota/Mail"

export type HeaderAttachments = {state: "loading"} | {state: "loaded", value: $ReadOnlyArray<TutanotaFile>}

export type Attrs = {
	mail: Mail,
	folderText: ?string,
	actionButtons: (Mail) => Children,
	onclick: () => mixed,
	attachments: ?HeaderAttachments,
	banner: "phishing" | "authfail" | "authmissing" | null,
	markNotPhishing: () => mixed,
}

const bubbleMenuWidth = 300

export class MailHeaderView implements MComponent<Attrs> {
	_detailsExpander: (Mail) => ExpanderButton = memoized(createDetailsExpander)
	_filesExpanded = stream(false)
	_warningDismissed = false

	view({attrs}: Vnode<Attrs>) {
		const {mail, folderText, actionButtons} = attrs
		const dateTime = formatDateWithWeekday(mail.receivedDate) + " • " + formatTime(mail.receivedDate)
		const detailsExpander = this._detailsExpander(mail)

		return m(".header.plr-l.margin-are-inset-lr.cursor-pointer", {onclick: attrs.onclick}, [
			m(".flex-space-between.button-min-height", [ // the natural height may vary in browsers (Firefox), so set it to button height here to make it similar to the MultiMailViewer
				m(".flex.flex-column-reverse", [
					(detailsExpander.panel.expanded)
						? m("small.flex.text-break", lang.get("from_label"))
						: m(".small.flex.text-break.selectable.badge-line-height.flex-wrap.pt-s",
						{title: getSenderOrRecipientHeadingTooltip(mail)}, [
							tutaoBadge(mail),
							getSenderHeading(mail, false)
						]),
					(folderText) ? m("small.b.flex.pt", {style: {color: theme.navigation_button}}, folderText) : null,
				]),
				isAnnouncement(mail) || styles.isUsingBottomNavigation()
					? null
					: m(detailsExpander)
			]),
			m(detailsExpander.panel),
			m(".subject-actions.flex-space-between.flex-wrap.mt-xs", [
				m(".left.flex-grow-shrink-150", [
					m(".subject.text-break.selectable", {
						"aria-label": lang.get("subject_label") + ", " + mail.subject,
					}, mail.subject),
					m(".flex.items-center.content-accent-fg.svg-content-accent-fg"
						+ (mail.confidential ? ".ml-negative-xs" : ""), {
						// Orca refuses to read ut unless it's not focusable
						tabindex: TabIndex.Default,
						"aria-label": lang.get(mail.confidential ? "confidential_action" : "nonConfidential_action")
							+ ", " + dateTime
					}, [
						mail.confidential ? m(Icon, {icon: Icons.Lock}) : null,
						m("small.date.mt-xs", dateTime),
						m(".flex-grow"),
						m(".flex.flex-column-reverse",
							isAnnouncement(mail) || !styles.isUsingBottomNavigation() ? null : m(detailsExpander)),
					]),
				]),
				styles.isUsingBottomNavigation() ? null : actionButtons(mail),
			]),
			styles.isUsingBottomNavigation() ? actionButtons(mail) : null,
			attrs.banner === "phishing"
				? m(Banner, {
					type: BannerType.Warning,
					title: lang.get("phishingMessage_label"),
					message: lang.get("phishingMessageBody_msg"),
					icon: Icons.Warning,
					helpLink: "https://tutanota.com/faq#phishing",
					buttonText: lang.get("markAsNotPhishing_action"),
					buttonClick: () => attrs.markNotPhishing(),
				})
				: !this._warningDismissed && attrs.banner === "authfail"
				? m(Banner, {
					type: BannerType.Warning,
					title: lang.get("mailAuthFailed_label"),
					message: lang.get("mailAuthFailed_msg"),
					icon: Icons.Warning,
					helpLink: "https://tutanota.com/faq#mail-auth",
					buttonText: lang.get("close_alt"),
					buttonClick: () => this._warningDismissed = true
				})
				: !this._warningDismissed && attrs.banner === "authmissing"
					? m(Banner, {
						type: BannerType.Info,
						title: lang.get("mailAuthMissing_label"),
						message: mail.differentEnvelopeSender ? lang.get("technicalSender_msg", {"{sender}": mail.differentEnvelopeSender}) : "",
						icon: Icons.Warning,
						helpLink: "https://tutanota.com/faq#mail-auth",
						buttonText: lang.get("close_alt"),
						buttonClick: () => this._warningDismissed = true,
					})
					: null,
			attrs.attachments ? this._renderAttachments(attrs.attachments) : null,
			m("hr.hr.mb.mt-s"),
		])
	}

	_renderAttachments(attachments: HeaderAttachments): Children {
		if (attachments.state === "loading") {
			return m(".flex", [
				m(".flex-v-center.pl-button", progressIcon()),
				m(".small.flex-v-center.plr.button-height", lang.get("loading_msg"))
			])
		} else {
			const attachmentButtons = this._createAttachmentsButtons(attachments.value)
			const spoilerLimit = attachmentsSpoilerLimit()
			return m(".flex.ml-negative-bubble.flex-wrap",
				[
					attachmentButtons.length > spoilerLimit
						? [
							attachmentButtons.slice(0, spoilerLimit).map(m),
							m(ExpanderButtonN, {
								label: "showAll_action",
								expanded: this._filesExpanded,
								style: {
									margin: "0 6px",
									paddingTop: "0"
								}
							}),
							m(ExpanderPanelN, {
								expanded: this._filesExpanded
							}, attachmentButtons.slice(spoilerLimit).map(m))
						]
						: attachmentButtons.map(m),
					this._renderDownloadAllButton(attachments.value)
				]
			)
		}
	}

	_createAttachmentsButtons(files: $ReadOnlyArray<TutanotaFile>): Button[] {
		let buttons
		// On Android we give an option to open a file from a private folder or to put it into "Downloads" directory
		if (isAndroidApp() || isDesktop()) {
			buttons = files.map(file => {
				const dropdownButton: Button = createDropDownButton(() => file.name,
					() => Icons.Attachment,
					() => [
						new Button("open_action",
							() => fileController.downloadAndOpen(file, true)
							                    .catch(FileOpenError, () => Dialog.error("canNotOpenFileOnDevice_msg")),
							null).setType(ButtonType.Dropdown),
						new Button("download_action",
							() => fileController.downloadAndOpen(file, false)
							                    .catch(FileOpenError, () => Dialog.error("canNotOpenFileOnDevice_msg")),
							null).setType(ButtonType.Dropdown)
					], 200, () => {
						// Bubble buttons use border so dropdown is misaligned by default
						const rect = dropdownButton._domButton.getBoundingClientRect()
						return new DomRectReadOnlyPolyfilled(rect.left + size.bubble_border_width, rect.top,
							rect.width, rect.height)
					})
					.setType(ButtonType.Bubble)
					.setStaticRightText("(" + formatStorageSize(Number(file.size)) + ")")
					.disableBubbling()
				return dropdownButton
			})
		} else {
			buttons = files.map(file => new Button(() => file.name,
				() => fileController.downloadAndOpen(file, true).catch(FileOpenError, () => Dialog.error("canNotOpenFileOnDevice_msg")),
				() => Icons.Attachment)
				.setType(ButtonType.Bubble)
				.setStaticRightText("(" + formatStorageSize(Number(file.size)) + ")")
				.disableBubbling()
			)
		}
		return buttons
	}

	_renderDownloadAllButton(files: $ReadOnlyArray<TutanotaFile>): Children {
		return !isIOSApp() && files.length > 2 ?
			m(".limit-width", m(ButtonN, {
				label: "saveAll_action",
				type: ButtonType.Secondary,
				noBubble: true,
				click: () => downloadAll(files)
			}))
			: null
	}
}

function createDetailsExpander(mail: Mail): ExpanderButton {
	const padding = styles.isUsingBottomNavigation() ? "0" : "16px"
	return new ExpanderButton("showMore_action", new ExpanderPanel({
		view: () =>
			m("", [
				m(RecipientButton, {
					label: getDisplayText(mail.sender.name, mail.sender.address, false),
					click: createAsyncDropdown(() =>
						this._createBubbleContextButtons(mail.sender, InboxRuleType.FROM_EQUALS), bubbleMenuWidth),
				}),
				mail.differentEnvelopeSender
					? [
						m(".small", lang.get("sender_label")),
						m(RecipientButton, {
							label: getDisplayText("", neverNull(mail.differentEnvelopeSender), false),
							click: () => Dialog.error("envelopeSenderInfo_msg", neverNull(mail.differentEnvelopeSender)),
						})
					]
					: null,
				mail.toRecipients.length
					? [
						m(".small", lang.get("to_label")),
						m(".flex-start.flex-wrap", mail.toRecipients.map(recipient => m(RecipientButton, {
								label: getDisplayText(recipient.name, recipient.address, false),
								click: createAsyncDropdown(() =>
									this._createBubbleContextButtons(recipient, InboxRuleType.RECIPIENT_TO_EQUALS), bubbleMenuWidth),
								// To wrap text inside flex container, we need to allow element to shrink and pick own width
								style: {flex: "0 1 auto"},
							}))
						),
					]
					: null,
				mail.ccRecipients.length
					? [
						m(".small", lang.get("cc_label")),
						m(".flex-start.flex-wrap", mail.ccRecipients.map(recipient => m(RecipientButton, {
							label: getDisplayText(recipient.name, recipient.address, false),
							click: createAsyncDropdown(() =>
								this._createBubbleContextButtons(recipient, InboxRuleType.RECIPIENT_CC_EQUALS), bubbleMenuWidth),
							style: {flex: "0 1 auto"},
						}))),
					]
					: null,
				mail.bccRecipients.length
					? [
						m(".small", lang.get("bcc_label")),
						m(".flex-start.flex-wrap", mail.bccRecipients.map(recipient => m(RecipientButton, {
							label: getDisplayText(recipient.name, recipient.address, false),
							click: createAsyncDropdown(() =>
								this._createBubbleContextButtons(recipient, InboxRuleType.RECIPIENT_BCC_EQUALS), bubbleMenuWidth),
							style: {flex: "0 1 auto"},
						}))),
					]
					: null,
				mail.replyTos.length
					? [
						m(".small", lang.get("replyTo_label")),
						m(".flex-start.flex-wrap", mail.replyTos.map(recipient => m(RecipientButton, {
							label: getDisplayText(recipient.name, recipient.address, false),
							click: createAsyncDropdown(() =>
								this._createBubbleContextButtons(recipient, null), bubbleMenuWidth),
							style: {flex: "0 1 auto"},
						}))),
					]
					: null,
			])
	}), false, {paddingTop: padding})
}

function attachmentsSpoilerLimit(): number {
	return styles.isDesktopLayout() ? 4 : 2
}

function downloadAll(files: $ReadOnlyArray<TutanotaFile>) {
	if (client.needsDownloadBatches() && files.length > 10) {
		fileController.downloadBatched(files, 10, 1000)
	} else if (!client.canDownloadMultipleFiles()) {
		fileController.downloadBatched(files, 1, 10)
	} else {
		fileController.downloadAll(files)
	}
}

function tutaoBadge(mail): Children {
	return isTutanotaTeamMail(mail) ? m(Badge, {classes: ".mr-s"}, "Tutanota Team") : null
}