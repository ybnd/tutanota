//
//  AlarmManagerTest.swift
//  tutanotaTests
//
//  Created by Tutao GmbH on 04.12.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

import Foundation
import XCTest

let FIXED_IV_BYTES = [
    0x88, 0x88, 0x88, 0x88,
    0x88, 0x88, 0x88, 0x88,
    0x88, 0x88, 0x88, 0x88,
    0x88, 0x88, 0x88, 0x88
];

class AlarmManagerTest: XCTestCase {
    
    func testUnscheduleAlarms() {
        let userPreference = UserPreferenceStub()
        let keychainManager = KeychainManagerStub()
        let userId = "userId"
        let pushIdentifier = TUTIdTuple(listId: "listId", elementId: "elementId")
        let pushIdentifierKey = Data(capacity: 128)
        
        let removedUserAlarm = createNotification(userId: userId, pushIdentifier: pushIdentifier, pushIdentifierKey: pushIdentifierKey)
        let anotherUserAlarm = createNotification(userId: "anotherUser", pushIdentifier: pushIdentifier, pushIdentifierKey: pushIdentifierKey)
        let alarmWithoutKey = createNotification(userId: userId, pushIdentifier: TUTIdTuple(listId: "anotherListId", elementId: "anotherElementId"), pushIdentifierKey: Data())
        userPreference.storeRepeating([removedUserAlarm, anotherUserAlarm, alarmWithoutKey])
        try! keychainManager.storeKey(pushIdentifierKey, withId: pushIdentifier.elementId)
        XCTAssert(userPreference.storedAlarms.count == 3)
        let notificationCenter = NotificationCenterStub()
        let alarmManager = TUTAlarmManager(userPreferences: userPreference,
                                           keychainManager: keychainManager,
                                           notificationCenter: notificationCenter)
    
        
        alarmManager.unscheduleAlarms(forUserId: userId)
        
        XCTAssertEqual(notificationCenter.removedIdentifiers, [removedUserAlarm.alarmInfo.alarmIdentifier])
        XCTAssertEqual(userPreference.storedAlarms, [anotherUserAlarm])
    }
    
    func encryptStringToBase64(key: Data, value: String) -> String {
        let iv = Data(bytes: FIXED_IV_BYTES, count: TUTAO_IV_BYTE_SIZE);
        return (try! TUTAes128Facade .encrypt(value.data(using: .utf8), withKey: key, withIv: iv, withMac: true)).base64EncodedString()
    }
    
    func createNotification(userId: String, pushIdentifier: TUTIdTuple, pushIdentifierKey: Data) -> TUTAlarmNotification {
        let sessionKey = Data(capacity: 127)
        let sessionKeys = [
            TUTNotificationSessionKey(
                pushIdentifier: pushIdentifier,
                pushIdentifierSessionEncSessionKey: try! TUTAes128Facade.encrypt(
                        sessionKey,
                        withKey: pushIdentifierKey,
                        withIv: Data(capacity: TUTAO_IV_BYTE_SIZE),
                        withMac: false).base64EncodedString()
                
            )
        ]
        let alarmidentifier = UUID.init().uuidString
        return TUTAlarmNotification(
            operation: "0",
            summary: "summary",
            eventStart: "",
            eventEnd: "",
            alarmInfo: TUTAlarmInfo(alarmIdentifier: alarmidentifier,
                                    trigger: encryptStringToBase64(key: sessionKey, value: "10M")),
            notificationSessionKeys:sessionKeys,
            repeatRule: nil,
            user: userId,
            jsonDict: [:]
        )
    }
}

class UserPreferenceStub : TUTUserPreferenceFacade {
    let storedAlarms: NSMutableArray = []
    
    override func getRepeatingAlarmNotifications() -> NSMutableArray {
        return storedAlarms
    }
    
    override func storeRepeating(_ alarmNotifications: [TUTAlarmNotification]) {
        storedAlarms.removeAllObjects()
        storedAlarms.addObjects(from: alarmNotifications)
    }
}

class KeychainManagerStub : TUTKeychainManager {
    var keys: [String: Data] = [:]
    
    override func getKeyWithError(_ keyId: String) throws -> Data {
        if let data = keys[keyId] {
            return data
        } else {
            throw AssertError(message: "no key \(keyId)")
        }
    }
    
    override func storeKey(_ key: Data, withId keyId: String) throws {
        return keys[keyId] = key
    }
}

@objc
class NotificationCenterStub : NSObject, TUTNotificationCenter {
    var removedIdentifiers = Array<String>()
    
    func add(_ request: UNNotificationRequest, withCompletionHandler completionHandler: ((Error?) -> Void)? = nil) {
        
    }
    
    func removePendingNotificationRequests(withIdentifiers identifiers: [String]) {
        removedIdentifiers.append(contentsOf: identifiers)
    }
}

struct AssertError : Error {
    let message: String
}
