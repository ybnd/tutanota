//
//  TUTNotificationCenterImpl.h
//  tutanota
//
//  Created by Tutao GmbH on 04.12.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@protocol TUTNotificationCenter <NSObject>
- (void)removePendingNotificationRequestsWithIdentifiers:(NSArray<NSString *> *)identifiers;
- (void)addNotificationRequest:(UNNotificationRequest *)request withCompletionHandler:(nullable void(^)(NSError *__nullable error))completionHandler;

@end

@interface TUTNotificationCenterImpl : NSObject <TUTNotificationCenter>

@end

NS_ASSUME_NONNULL_END
