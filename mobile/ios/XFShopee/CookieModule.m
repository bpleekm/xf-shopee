//
//  CookieModule.m
//  XFShopee
//

#import "CookieModule.h"
#import <WebKit/WebKit.h>
#import <React/RCTUtils.h>

@implementation CookieModule

// Export the module to React Native
RCT_EXPORT_MODULE();

// MARK: - Cookie Parsing

- (NSArray<NSHTTPCookie *> *)cookiesFromStringArray:(NSArray<NSString *> *)cookieStrings forDomain:(NSString *)domain {
    NSMutableArray<NSHTTPCookie *> *cookies = [NSMutableArray array];
    
    NSURL *url = [NSURL URLWithString:domain];
    if (!url) {
        url = [NSURL URLWithString:@"https://xfshopee.com"];
    }
    
    for (NSString *cookieString in cookieStrings) {
        NSMutableDictionary *cookieProperties = [NSMutableDictionary dictionary];
        
        // Parse cookie string (format: "name=value; path=/; secure")
        NSArray *components = [cookieString componentsSeparatedByString:@";"];
        if (components.count == 0) {
            continue;
        }
        
        // Parse name=value
        NSString *nameValuePair = [components[0] stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
        NSArray *nameValueComponents = [nameValuePair componentsSeparatedByString:@"="];
        if (nameValueComponents.count != 2) {
            continue;
        }
        
        NSString *name = [nameValueComponents[0] stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
        NSString *value = [nameValueComponents[1] stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
        
        [cookieProperties setObject:name forKey:NSHTTPCookieName];
        [cookieProperties setObject:value forKey:NSHTTPCookieValue];
        [cookieProperties setObject:url.host ?: @"xfshopee.com" forKey:NSHTTPCookieDomain];
        [cookieProperties setObject:url.path ?: @"/" forKey:NSHTTPCookiePath];
        
        // Parse additional properties
        for (int i = 1; i < components.count; i++) {
            NSString *property = [components[i] stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
            
            if ([property caseInsensitiveCompare:@"secure"] == NSOrderedSame) {
                [cookieProperties setObject:@YES forKey:NSHTTPCookieSecure];
            } else if ([property caseInsensitiveCompare:@"httponly"] == NSOrderedSame) {
                [cookieProperties setObject:@YES forKey:NSHTTPCookieDiscard];
            } else if ([property hasPrefix:@"path="]) {
                NSString *path = [[property substringFromIndex:5] stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
                [cookieProperties setObject:path forKey:NSHTTPCookiePath];
            } else if ([property hasPrefix:@"domain="]) {
                NSString *domain = [[property substringFromIndex:7] stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
                [cookieProperties setObject:domain forKey:NSHTTPCookieDomain];
            } else if ([property hasPrefix:@"max-age="]) {
                NSString *maxAgeStr = [[property substringFromIndex:8] stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
                NSInteger maxAge = [maxAgeStr integerValue];
                if (maxAge > 0) {
                    NSDate *expiresDate = [NSDate dateWithTimeIntervalSinceNow:maxAge];
                    [cookieProperties setObject:expiresDate forKey:NSHTTPCookieExpires];
                }
            } else if ([property hasPrefix:@"expires="]) {
                // Skip expires parsing for simplicity
                // In production, you would parse the date string
            }
        }
        
        NSHTTPCookie *cookie = [NSHTTPCookie cookieWithProperties:cookieProperties];
        if (cookie) {
            [cookies addObject:cookie];
        }
    }
    
    return [cookies copy];
}

// MARK: - Cookie Store Operations

- (WKHTTPCookieStore *)cookieStore {
    static WKWebsiteDataStore *dataStore = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        // Create a data store for cookie operations
        dataStore = [WKWebsiteDataStore defaultDataStore];
    });
    
    return dataStore.httpCookieStore;
}

// MARK: - RCT Exposed Methods

RCT_EXPORT_METHOD(injectCookies:(NSArray<NSString *> *)cookieStrings
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSArray<NSHTTPCookie *> *cookies = [self cookiesFromStringArray:cookieStrings forDomain:nil];
        WKHTTPCookieStore *cookieStore = [self cookieStore];
        
        if (cookies.count == 0) {
            resolve(@(YES));
            return;
        }
        
        dispatch_group_t group = dispatch_group_create();
        __block BOOL success = YES;
        
        for (NSHTTPCookie *cookie in cookies) {
            dispatch_group_enter(group);
            [cookieStore setCookie:cookie completionHandler:^{
                dispatch_group_leave(group);
            }];
        }
        
        dispatch_group_notify(group, dispatch_get_main_queue(), ^{
            resolve(@(success));
        });
    } @catch (NSException *exception) {
        reject(@"COOKIE_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(getCookies:(NSString *)domain
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        WKHTTPCookieStore *cookieStore = [self cookieStore];
        
        [cookieStore getAllCookies:^(NSArray<NSHTTPCookie *> *cookies) {
            NSMutableArray<NSString *> *cookieStrings = [NSMutableArray array];
            
            NSURL *url = [NSURL URLWithString:domain];
            NSString *targetDomain = url.host;
            
            for (NSHTTPCookie *cookie in cookies) {
                // Filter by domain if specified
                if (targetDomain && ![cookie.domain containsString:targetDomain]) {
                    continue;
                }
                
                // Build cookie string
                NSMutableString *cookieString = [NSMutableString stringWithFormat:@"%@=%@", cookie.name, cookie.value];
                
                if (cookie.domain && ![cookie.domain hasPrefix:@"."]) {
                    [cookieString appendFormat:@"; domain=%@", cookie.domain];
                }
                
                if (cookie.path) {
                    [cookieString appendFormat:@"; path=%@", cookie.path];
                }
                
                if (cookie.secure) {
                    [cookieString appendString:@"; secure"];
                }
                
                if (cookie.expiresDate) {
                    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
                    formatter.dateFormat = @"EEE, dd MMM yyyy HH:mm:ss zzz";
                    formatter.locale = [NSLocale localeWithLocaleIdentifier:@"en_US"];
                    [cookieString appendFormat:@"; expires=%@", [formatter stringFromDate:cookie.expiresDate]];
                }
                
                [cookieStrings addObject:[cookieString copy]];
            }
            
            resolve(cookieStrings);
        }];
    } @catch (NSException *exception) {
        reject(@"COOKIE_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(clearCookies:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSSet<NSString *> *cookieTypes = [NSSet setWithObject:WKWebsiteDataTypeCookies];
        NSDate *sinceDate = [NSDate dateWithTimeIntervalSince1970:0];
        
        [[WKWebsiteDataStore defaultDataStore] removeDataOfTypes:cookieTypes
                                                   modifiedSince:sinceDate
                                               completionHandler:^{
            resolve(@(YES));
        }];
    } @catch (NSException *exception) {
        reject(@"COOKIE_ERROR", exception.reason, nil);
    }
}

@end