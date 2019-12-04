//
//  TUTAlarmManager.h
//  tutanota
//
//  Created by Tutao GmbH on 07.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "Utils/TUTSseInfo.h"
#import "Utils/TUTUserPreferenceFacade.h"
#import "Alarms/TUTMissedNotification.h"
#import "TUTKeychainManager.h"
#import "TUTNotificationCenter.h"

NS_ASSUME_NONNULL_BEGIN

@interface TUTAlarmManager : NSObject
- (instancetype) initWithUserPreferences:(TUTUserPreferenceFacade *)userPref
                         keychainManager:(TUTKeychainManager *)keychainManager
                      notificationCenter:(id<TUTNotificationCenter> _Nonnull)notificationCenter;
- (void)scheduleAlarms:(TUTMissedNotification*)notificaiton completionsHandler:(void(^)(void))completionHandler;
- (void)fetchMissedNotificationsForChangeTime:(NSString *_Nullable)changeTime : (void(^)(NSError *))completionHandler;
- (void)rescheduleEvents;
- (void)unscheduleAlarmsForUserId:(NSString *)userId;

@end

NS_ASSUME_NONNULL_END
