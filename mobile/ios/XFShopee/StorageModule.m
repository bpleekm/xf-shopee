//
//  StorageModule.m
//  XFShopee
//

#import "StorageModule.h"
#import <React/RCTLog.h>
#import <Security/Security.h>

@implementation StorageModule

// Export the module to React Native
RCT_EXPORT_MODULE();

// MARK: - Keychain Helper Methods

- (NSMutableDictionary *)keychainQueryForKey:(NSString *)key {
    return [@{
        (__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
        (__bridge id)kSecAttrService: @"com.xfshopee.storage",
        (__bridge id)kSecAttrAccount: key,
        (__bridge id)kSecAttrAccessible: (__bridge id)kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
    } mutableCopy];
}

- (BOOL)setKeychainValue:(NSString *)value forKey:(NSString *)key {
    NSMutableDictionary *keychainQuery = [self keychainQueryForKey:key];
    
    // Delete existing item if present
    SecItemDelete((__bridge CFDictionaryRef)keychainQuery);
    
    // Add new item
    [keychainQuery setObject:[value dataUsingEncoding:NSUTF8StringEncoding] forKey:(__bridge id)kSecValueData];
    
    OSStatus status = SecItemAdd((__bridge CFDictionaryRef)keychainQuery, NULL);
    return status == errSecSuccess;
}

- (NSString *)getKeychainValueForKey:(NSString *)key {
    NSMutableDictionary *keychainQuery = [self keychainQueryForKey:key];
    [keychainQuery setObject:@YES forKey:(__bridge id)kSecReturnData];
    [keychainQuery setObject:(__bridge id)kSecMatchLimitOne forKey:(__bridge id)kSecMatchLimit];
    
    CFTypeRef result = NULL;
    OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)keychainQuery, &result);
    
    if (status == errSecSuccess) {
        NSData *data = (__bridge_transfer NSData *)result;
        return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    }
    
    return nil;
}

- (BOOL)deleteKeychainValueForKey:(NSString *)key {
    NSMutableDictionary *keychainQuery = [self keychainQueryForKey:key];
    OSStatus status = SecItemDelete((__bridge CFDictionaryRef)keychainQuery);
    return status == errSecSuccess;
}

// MARK: - RCT Exposed Methods

RCT_EXPORT_METHOD(setItem:(NSString *)key
                  value:(NSString *)value
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        BOOL success = [self setKeychainValue:value forKey:key];
        if (success) {
            resolve(@(YES));
        } else {
            reject(@"STORAGE_ERROR", @"Failed to store value", nil);
        }
    } @catch (NSException *exception) {
        reject(@"STORAGE_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(getItem:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSString *value = [self getKeychainValueForKey:key];
        resolve(value ?: [NSNull null]);
    } @catch (NSException *exception) {
        reject(@"STORAGE_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(removeItem:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        BOOL success = [self deleteKeychainValueForKey:key];
        if (success) {
            resolve(@(YES));
        } else {
            // If item doesn't exist, still return success
            resolve(@(YES));
        }
    } @catch (NSException *exception) {
        reject(@"STORAGE_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(clear:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSMutableDictionary *keychainQuery = [@{
            (__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
            (__bridge id)kSecAttrService: @"com.xfshopee.storage",
            (__bridge id)kSecAttrAccessible: (__bridge id)kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        } mutableCopy];
        
        OSStatus status = SecItemDelete((__bridge CFDictionaryRef)keychainQuery);
        // errSecItemNotFound is acceptable when clearing
        if (status == errSecSuccess || status == errSecItemNotFound) {
            resolve(@(YES));
        } else {
            reject(@"STORAGE_ERROR", @"Failed to clear storage", nil);
        }
    } @catch (NSException *exception) {
        reject(@"STORAGE_ERROR", exception.reason, nil);
    }
}

@end