//@flow
import m from "mithril"
import {Banner, BannerType} from "../gui/base/Banner"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {noOp} from "../api/common/utils/Utils"

export type Attrs = {}

export class CalendarMailBanner implements MComponent<Attrs> {
	view(vnode: Vnode<Attrs>) {
		return m(Banner, {
			icon: BootIcons.Calendar,
			title: "Test title",
			message: "Test message",
			helpLink: "TODO",
			buttonText: "Button",
			buttonClick: noOp,
			type: BannerType.Info,
		})
	}
}