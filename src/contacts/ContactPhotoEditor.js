// @flow
import m from "mithril"
import {fileController} from "../file/FileController"
import {Dialog} from "../gui/base/Dialog"
import {uint8ArrayToBase64} from "../api/common/utils/Encoding"
import {lang} from "../misc/LanguageViewModel"


export class ContactPhotoEditor {
	photoString: string;
	image: ?HTMLImageElement;
	view: Function;
	dialog: Dialog;
	isFileToBig: boolean;
	picWidth: string;
	picHeight: string;
	selectorTopPos: string;
	selectorLeftPos: string;
	selectorSize: string;


	constructor() {
		fileController.showFileChooser(false, ["jpg", "png"]).then((picture) => {
			if (picture[0].size > 50000 && (picture[0].mimeType == "jpg" || picture[0].mimeType == "png")) {
				this.isFileToBig = true
				return Dialog.error("picIsToBig_msg")
			} else {//transform the picture into a base 64 string
				this.photoString = "data:" + picture[0].mimeType + ";base64," + uint8ArrayToBase64(picture[0].data)
				this.isFileToBig = false
			}
		}).then(() => {
			if (!this.isFileToBig) {
				this.image = _imageCreation(this.photoString)
				this.picWidth = "100%"
				this.picHeight = "100%"
				this.selectorSize = "100"
				this.selectorTopPos = window.innerHeight / 2 - 50 + ""
				this.selectorLeftPos = window.innerWidth / 2 - 50 + ""
				let container
				let form = {
					view: () => {
						let topPos = "", leftPos = "";
						(this.image || {}).onload = () => {
							if (!this.image) return

							let relation = this.image.width / this.image.height
							if (this.image.width < 460) {
								this.picWidth = ((this.image.width / 460) * 100) + "%"
								this.picHeight = (this.image.height / ((this.image.width * (this.image.width / 460)) / relation)) * 100 + "%"
							} else {
								this.picWidth = "100%"
								this.picHeight = ((460 / relation) / this.image.height * 100) + "%"
							}
							m.redraw()
						}
						//img css für breite höhe .full-height.full-width 100%
						let moving = false
						let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0
						return [
							m("#selector-container.abs.border-l.cutter.align-self-center", {
								style: {

									top: this.selectorTopPos + "px",
									left: this.selectorLeftPos + "px",
									//todo adjust position according to size top:... left:...
									height: this.selectorSize + "px",
									width: this.selectorSize + "px",

								},
								oncreate: (vnode) => {

									vnode.dom.addEventListener("mousedown", (e) => {

										console.log("mousedown inner")
										e = e || window.event
										moving = true
										// get the mouse cursor position at startup:
										pos3 = e.clientX
										pos4 = e.clientY
										// document.onmouseup = closeDragElement
										// call a function whenever the cursor moves:
										// document.onmousemove = elementDrag
									})

									vnode.dom.addEventListener("mousemove", (e) => {

										console.log("mousemove")
										container = e.currentTarget

										if (moving) {
											e = e || window.event
											// calculate the new cursor position:
											pos1 = pos3 - e.clientX
											pos2 = pos4 - e.clientY
											pos3 = e.clientX
											pos4 = e.clientY
											// set the element's new position:
											this.selectorTopPos = (container.offsetTop - pos2) + ""
											this.selectorLeftPos = (container.offsetLeft - pos1) + ""
											m.redraw()
										}
									})

									vnode.dom.addEventListener("mouseup", (e) => {

										console.log("mouseup inner")
										moving = false
									})
								},
							}),
							m("#picture-editor-container.flex-center.flex-column.pt-m", [
								m("img.align-self-center.border-radius-m", this.image && {
									src: this.image.src, width: this.picWidth, height: this.picHeight
								}
								), m("input", {
									type: "range",
									min: "40",
									value: this.selectorSize,
									max: "200",
									step: "2",
									onmousemove: (vnode) => {
										this.selectorLeftPos = Number(this.selectorLeftPos) + (Number(this.selectorSize) - vnode.currentTarget.value) / 2 + ""
										this.selectorTopPos = Number(this.selectorTopPos) + (Number(this.selectorSize) - vnode.currentTarget.value) / 2 + ""
										this.selectorSize = (vnode.currentTarget.value)


									}
								})]
							)]
					}
				}
				this.dialog = Dialog.showActionDialog({
					title: lang.get("editPhoto_label"), child: form, okAction: () => {
						this.dialog.close()
						//todo hier gehts weiter mit zuschneiden und speichern
					}
				})
			} else {
				return null
			}
		})
	}
}

function _imageCreation(pic: string): ?HTMLImageElement {
	let image = new Image()
	image.src = pic
	if (image.src.length == 0) {
		image.src = pic
		image = document.createElement('img')
	}
	if (image == null) {
		console.log("Bild wurde nicht geladen")
	} else {
		return image
	}
}
