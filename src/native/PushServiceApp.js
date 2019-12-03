//@flow
import {load, loadAll, setup, update} from "../api/main/Entity"
import {_TypeModel as PushIdentifierModel, createPushIdentifier, PushIdentifierTypeRef} from "../api/entities/sys/PushIdentifier"
import {neverNull, noOp} from "../api/common/utils/Utils"
import type {PushServiceTypeEnum} from "../api/common/TutanotaConstants"
import {PushServiceType} from "../api/common/TutanotaConstants"
import {lang} from "../misc/LanguageViewModel"
import {getHttpOrigin, isAndroidApp, isDesktop, isIOSApp} from "../api/Env"
import {nativeApp} from "./NativeWrapper"
import {Request} from "../api/common/WorkerProtocol"
import {logins} from "../api/main/LoginController"
import {worker} from "../api/main/WorkerClient"
import {client} from "../misc/ClientDetector.js"
import {getElementId} from "../api/common/EntityFunctions"
import {deviceConfig} from "../misc/DeviceConfig"
import {getStartOfDay} from "../api/common/utils/DateUtils"

class PushServiceApp {
	_pushNotification: ?Object;
	_currentIdentifier: ?string;

	constructor() {
		this._pushNotification = null;
	}

	register(): Promise<void> {
		if (isAndroidApp() || isDesktop()) {
			return this._loadPushIdentifierFromNative()
			           .then(identifier => {
				           if (identifier) {
					           this._currentIdentifier = identifier
					           return this._loadPushIdentifier(identifier).then(pushIdentifier => {
						           if (!pushIdentifier) { // push identifier is  not associated with current user
							           return this._createPushIdentiferInstance(identifier, PushServiceType.SSE)
							                      .then(pushIdentifier => {
								                      return this._unscheduleAlarms()
								                                 .catch(noOp)
								                                 .then(() =>
									                                 this._storePushIdentifierLocally(pushIdentifier)
									                                     .then(() => this._scheduleAlarmsIfNeeded(pushIdentifier)))

							                      })
						           } else {
							           return this._storePushIdentifierLocally(pushIdentifier)
							                      .then(() => this._updatePushIdentifierTimeIfNeeded(pushIdentifier))
							                      .then(() => this._scheduleAlarmsIfNeeded(pushIdentifier))

						           }
					           })
				           } else {
					           return worker.generateSsePushIdentifer()
					                        .then(identifier => this._createPushIdentiferInstance(identifier, PushServiceType.SSE))
					                        .then(pushIdentifier => {
						                        this._currentIdentifier = pushIdentifier.identifier
						                        return this._storePushIdentifierLocally(pushIdentifier)
						                                   .then(() => this._scheduleAlarmsIfNeeded(pushIdentifier))
					                        })
				           }
			           })
			           .then(this._initPushNotifications)
		} else if (isIOSApp()) {
			return this._loadPushIdentifierFromNative()
			           .then(identifier => {
				           if (identifier) {
					           this._currentIdentifier = identifier
					           return this._loadPushIdentifier(identifier)
					                      .then(pushIdentifier => {
						                      if (pushIdentifier) {
							                      return this._updatePushIdentifierTimeIfNeeded(pushIdentifier)
							                                 .then(() => this._storePushIdentifierLocally(pushIdentifier))
							                                 .then(() => this._scheduleAlarmsIfNeeded(pushIdentifier))
						                      } else {
							                      return this._createPushIdentiferInstance(identifier, PushServiceType.IOS)
							                                 .then(() => this
								                                 ._unscheduleAlarms()
								                                 .catch(noOp)
								                                 .then(pushIdentifier => this
									                                 ._storePushIdentifierLocally(pushIdentifier)
									                                 .then(() => this._scheduleAlarmsIfNeeded(pushIdentifier))))

						                      }
					                      })
				           } else {
					           console.log("denied by user")
				           }
			           })
		} else {
			return Promise.resolve()
		}
	}

	_updatePushIdentifierTimeIfNeeded(pushIdentifier): Promise<void> {
		if (this._pushIdentifierShouldBeUpdated(pushIdentifier)) {
			pushIdentifier.lastUsageTime = new Date()
			return update(pushIdentifier)
				.catch(e => console.warn("Failed to update push identifier lastUsageTime", e))
		} else {
			return Promise.resolve()
		}
	}

	_pushIdentifierShouldBeUpdated(pushIdentifier) {
		return pushIdentifier.lastUsageTime < getStartOfDay(new Date()) || pushIdentifier.language !== lang.code
	}

	_loadPushIdentifierFromNative() {
		return nativeApp.invokeNative(new Request("getPushIdentifier", [
			logins.getUserController().user._id, logins.getUserController().userGroupInfo.mailAddress
		]))
	}

	_storePushIdentifierLocally(pushIdentifier: PushIdentifier): Promise<void> {
		const userId = logins.getUserController().user._id
		return worker.resolveSessionKey(PushIdentifierModel, pushIdentifier).then(skB64 => {
			return nativeApp.invokeNative(new Request("storePushIdentifierLocally", [
				pushIdentifier.identifier, userId, getHttpOrigin(), getElementId(pushIdentifier), skB64
			]))
		})

	}


	_loadPushIdentifier(identifier: string): Promise<?PushIdentifier> {
		let list = logins.getUserController().user.pushIdentifierList
		return loadAll(PushIdentifierTypeRef, neverNull(list).list).then(identifiers => {
			return identifiers.find(i => i.identifier === identifier)
		})
	}

	_unscheduleAlarms(): Promise<void> {
		const userId = logins.getUserController().user._id
		deviceConfig.setAlarmsScheduledForUser(userId, false)
		return nativeApp.invokeNative(new Request('unscheduleAlarms', [userId]))
	}

	_createPushIdentiferInstance(identifier: string, pushServiceType: PushServiceTypeEnum): Promise<PushIdentifier> {
		let list = logins.getUserController().user.pushIdentifierList
		let pushIdentifier = createPushIdentifier({
			_area: "0",
			_owner: logins.getUserController().userGroupInfo.group, // legacy
			_ownerGroup: logins.getUserController().userGroupInfo.group,
			displayName: client.getIdentifier(),
			pushServiceType: pushServiceType,
			identifier: identifier,
			language: lang.code,
			lastUsageTime: new Date(),
		})

		return setup(neverNull(list).list, pushIdentifier).then(id => {
			return [neverNull(list).list, id]
		}).then(id => load(PushIdentifierTypeRef, id))
	}


	updateBadge(newValue: number): void {
		if (this._pushNotification != null) {
			// not supported on all android devices.
			this._pushNotification.setApplicationIconBadgeNumber(() => {
				//success
			}, () => {
				//error
			}, newValue);
		}
	}

	closePushNotification(addresses: string[]) {
		nativeApp.invokeNative(new Request('closePushNotifications', [addresses]))
	}

	getPushIdentifier(): ?string {
		return this._currentIdentifier
	}

	_initPushNotifications(): Promise<void> {
		return nativeApp.invokeNative(new Request("initPushNotifications", []))
	}

	_scheduleAlarmsIfNeeded(pushIdentifier: PushIdentifier): Promise<void> {
		const userId = logins.getUserController().user._id
		if (!deviceConfig.areAlarmsScheduledForUser(userId)) {
			console.log("Alarms not scheduled for user, scheduling!")
			return worker.scheduleAlarmsForNewDevice(pushIdentifier)
			             .then(() => deviceConfig.setAlarmsScheduledForUser(userId, true))
		} else {
			return Promise.resolve()
		}
	}
}

export const pushServiceApp: PushServiceApp = new PushServiceApp()
