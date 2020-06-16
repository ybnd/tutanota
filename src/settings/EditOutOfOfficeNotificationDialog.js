//@flow
import m from "mithril"
import {load, setup} from "../api/main/Entity"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {DatePicker} from "../gui/base/DatePicker"
import {getStartOfTheWeekOffsetForUser} from "../calendar/CalendarUtils"
import {HtmlEditor} from "../gui/base/HtmlEditor"
import {createOutOfOfficeNotification, OutOfOfficeNotificationTypeRef} from "../api/entities/tutanota/OutOfOfficeNotification"
import {logins} from "../api/main/LoginController"
import {MailboxGroupRootTypeRef} from "../api/entities/tutanota/MailboxGroupRoot"
import type {GroupMembership} from "../api/entities/sys/GroupMembership"
import {TextFieldN} from "../gui/base/TextFieldN"
import stream from "mithril/stream/stream.js"

export function showEditOutOfOfficeNotificationDialog() {

	const mailMembership = getMailMembership()
	const subjectInput = stream("")
	const outOfOfficeEditor = new HtmlEditor(() => "Message", {enabled: true})
		.setMinHeight(100)
		.showBorders()
	const outOfOfficeStartTimePicker = new DatePicker(getStartOfTheWeekOffsetForUser(), "dateFrom_label")
	const outOfOfficeEndTimePicker = new DatePicker(getStartOfTheWeekOffsetForUser(), "dateTo_label")


	load(MailboxGroupRootTypeRef, mailMembership.group).then(
		(grouproot) => {
			if (grouproot.outOfOfficeNotification) {
				load(OutOfOfficeNotificationTypeRef, grouproot.outOfOfficeNotification).then(
					(outOfOfficeNotification) => {
						outOfOfficeEditor.setValue(outOfOfficeNotification.message)
						outOfOfficeStartTimePicker.setDate(outOfOfficeNotification.startTime)
						outOfOfficeEndTimePicker.setDate(outOfOfficeNotification.endTime)
						subjectInput(outOfOfficeNotification.subject)


						Dialog.showActionDialog({
							title: "Out of office notification",
							child: form,
							type: DialogType.EditLarge,
							okAction: saveOutOfOfficeNotification
						})
					}
				)
			} else {
				Dialog.showActionDialog({
					title: "Out of office notification",
					child: form,
					type: DialogType.EditLarge,
					okAction: saveOutOfOfficeNotification
				})
			}
		}
	)


	let form = {
		view: () => {
			return [
				m(TextFieldN, {
						label: () => "Subject",
						value: subjectInput
					}
				),
				m(outOfOfficeEditor),
				m(outOfOfficeStartTimePicker),
				m(outOfOfficeEndTimePicker)
			]
		}
	}
	let saveOutOfOfficeNotification = (dialog) => {
		const startTime = outOfOfficeStartTimePicker.date()
		const endTime = outOfOfficeEndTimePicker.date()
		if (!startTime || !endTime) {
			return
		}
		if (startTime.getTime() > endTime.getTime() || endTime.getTime() < Date.now()) {
			Dialog.error(() => "Time is invalid")
			return
		}
		const mailMembership = getMailMembership()
		const notification = createOutOfOfficeNotification({
			_ownerGroup: mailMembership.group,
			message: outOfOfficeEditor.getValue(),
			subject: subjectInput(),
			startTime,
			endTime,
		})
		setup(null, notification)
		dialog.close()
	}


}


function getMailMembership(): GroupMembership {
	return logins.getUserController().getMailGroupMemberships()[0]
}