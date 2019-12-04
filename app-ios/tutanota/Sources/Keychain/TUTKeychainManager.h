//
//  TUTKeychainManager.h
//  tutanota
//
//  Created by Tutao GmbH on 17.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface TUTKeychainManager : NSObject

// Return BOOL to please Swift interop - method *must* return nullable pointer or boolean to be converted into "throws"
- (BOOL)storeKey:(NSData *)key withId:(NSString *)keyId error:(NSError **)error;
- (NSData * _Nullable)getKeyWithError:(NSString *)keyId error:(NSError **)error;

@end

NS_ASSUME_NONNULL_END
