//
//  TUTNotificationCenterImpl.m
//  tutanota
//
//  Created by Tutao GmbH on 04.12.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import "TUTNotificationCenter.h"

#import <UserNotifications/UserNotifications.h>

@implementation TUTNotificationCenterImpl

- (void)removePendingNotificationRequestsWithIdentifiers:(NSArray<NSString *> *)identifiers {
    [UNUserNotificationCenter.currentNotificationCenter removePendingNotificationRequestsWithIdentifiers:identifiers];
}

- (void)addNotificationRequest:(UNNotificationRequest *)request withCompletionHandler:(void (^)(NSError * _Nullable))completionHandler {
    [UNUserNotificationCenter.currentNotificationCenter addNotificationRequest:request withCompletionHandler:completionHandler];
}

@end
