//
//  ScannerModule.m
//  XFShopee
//

#import "ScannerModule.h"
#import <AVFoundation/AVFoundation.h>
#import <React/RCTUtils.h>

@interface ScannerModule () <AVCaptureMetadataOutputObjectsDelegate>

@property (nonatomic, strong) RCTPromiseResolveBlock scanResolve;
@property (nonatomic, strong) RCTPromiseRejectBlock scanReject;
@property (nonatomic, strong) AVCaptureSession *captureSession;
@property (nonatomic, strong) UIViewController *presentedViewController;

@end

@implementation ScannerModule

// Export the module to React Native
RCT_EXPORT_MODULE();

// MARK: - Permission Check

- (BOOL)isCameraAuthorized {
    AVAuthorizationStatus status = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
    return status == AVAuthorizationStatusAuthorized;
}

- (void)requestCameraPermissionWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
    [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
        dispatch_async(dispatch_get_main_queue(), ^{
            if (granted) {
                resolve(@(YES));
            } else {
                reject(@"CAMERA_PERMISSION_DENIED", @"Camera permission denied", nil);
            }
        });
    }];
}

// MARK: - Scanner Setup

- (void)setupCaptureSession {
    if (self.captureSession) {
        return;
    }
    
    self.captureSession = [[AVCaptureSession alloc] init];
    
    // Get the default capture device
    AVCaptureDevice *device = [AVCaptureDevice defaultDeviceWithMediaType:AVMediaTypeVideo];
    if (!device) {
        return;
    }
    
    NSError *error = nil;
    AVCaptureDeviceInput *input = [AVCaptureDeviceInput deviceInputWithDevice:device error:&error];
    if (error || !input) {
        return;
    }
    
    if ([self.captureSession canAddInput:input]) {
        [self.captureSession addInput:input];
    }
    
    AVCaptureMetadataOutput *output = [[AVCaptureMetadataOutput alloc] init];
    if ([self.captureSession canAddOutput:output]) {
        [self.captureSession addOutput:output];
        
        // Set delegate and dispatch queue
        [output setMetadataObjectsDelegate:self queue:dispatch_get_main_queue()];
        
        // Set metadata types (QR code and barcodes)
        [output setMetadataObjectTypes:@[
            AVMetadataObjectTypeQRCode,
            AVMetadataObjectTypeEAN13Code,
            AVMetadataObjectTypeEAN8Code,
            AVMetadataObjectTypeCode128Code,
            AVMetadataObjectTypeCode39Code,
            AVMetadataObjectTypeCode93Code,
            AVMetadataObjectTypeUPCECode,
            AVMetadataObjectTypePDF417Code,
            AVMetadataObjectTypeAztecCode,
            AVMetadataObjectTypeDataMatrixCode
        ]];
    }
}

- (void)startCaptureSession {
    if (!self.captureSession.isRunning) {
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
            [self.captureSession startRunning];
        });
    }
}

- (void)stopCaptureSession {
    if (self.captureSession.isRunning) {
        [self.captureSession stopRunning];
    }
}

- (void)cleanupCaptureSession {
    [self stopCaptureSession];
    self.captureSession = nil;
}

// MARK: - Scanner UI

- (UIViewController *)createScannerViewController {
    UIViewController *viewController = [[UIViewController alloc] init];
    viewController.modalPresentationStyle = UIModalPresentationFullScreen;
    
    // Setup preview layer
    AVCaptureVideoPreviewLayer *previewLayer = [AVCaptureVideoPreviewLayer layerWithSession:self.captureSession];
    previewLayer.videoGravity = AVLayerVideoGravityResizeAspectFill;
    previewLayer.frame = viewController.view.layer.bounds;
    [viewController.view.layer addSublayer:previewLayer];
    
    // Add cancel button
    UIButton *cancelButton = [UIButton buttonWithType:UIButtonTypeSystem];
    [cancelButton setTitle:@"Cancel" forState:UIControlStateNormal];
    [cancelButton setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];
    cancelButton.backgroundColor = [UIColor colorWithWhite:0.0 alpha:0.7];
    cancelButton.layer.cornerRadius = 8.0;
    cancelButton.frame = CGRectMake(20, 50, 100, 44);
    [cancelButton addTarget:self action:@selector(cancelScan:) forControlEvents:UIControlEventTouchUpInside];
    [viewController.view addSubview:cancelButton];
    
    return viewController;
}

- (void)cancelScan:(id)sender {
    [self dismissScanner];
    
    if (self.scanReject) {
        self.scanReject(@"SCAN_CANCELLED", @"User cancelled scan", nil);
        self.scanResolve = nil;
        self.scanReject = nil;
    }
}

- (void)dismissScanner {
    if (self.presentedViewController) {
        [self.presentedViewController dismissViewControllerAnimated:YES completion:^{
            self.presentedViewController = nil;
            [self cleanupCaptureSession];
        }];
    }
}

// MARK: - AVCaptureMetadataOutputObjectsDelegate

- (void)captureOutput:(AVCaptureOutput *)output didOutputMetadataObjects:(NSArray<__kindof AVMetadataObject *> *)metadataObjects fromConnection:(AVCaptureConnection *)connection {
    if (metadataObjects.count == 0) {
        return;
    }
    
    AVMetadataMachineReadableCodeObject *metadataObj = metadataObjects.firstObject;
    if (!metadataObj || !metadataObj.stringValue) {
        return;
    }
    
    // Stop scanning
    [self stopCaptureSession];
    
    // Determine format
    NSString *format = @"UNKNOWN";
    if ([metadataObj.type isEqualToString:AVMetadataObjectTypeQRCode]) {
        format = @"QR_CODE";
    } else if ([metadataObj.type isEqualToString:AVMetadataObjectTypeEAN13Code]) {
        format = @"EAN_13";
    } else if ([metadataObj.type isEqualToString:AVMetadataObjectTypeEAN8Code]) {
        format = @"EAN_8";
    } else if ([metadataObj.type isEqualToString:AVMetadataObjectTypeCode128Code]) {
        format = @"CODE_128";
    } else if ([metadataObj.type isEqualToString:AVMetadataObjectTypeCode39Code]) {
        format = @"CODE_39";
    } else if ([metadataObj.type isEqualToString:AVMetadataObjectTypeUPCECode]) {
        format = @"UPC_E";
    } else if ([metadataObj.type isEqualToString:AVMetadataObjectTypePDF417Code]) {
        format = @"PDF_417";
    } else if ([metadataObj.type isEqualToString:AVMetadataObjectTypeAztecCode]) {
        format = @"AZTEC";
    } else if ([metadataObj.type isEqualToString:AVMetadataObjectTypeDataMatrixCode]) {
        format = @"DATA_MATRIX";
    }
    
    // Return result
    if (self.scanResolve) {
        NSDictionary *result = @{
            @"success": @(YES),
            @"data": metadataObj.stringValue,
            @"format": format,
            @"timestamp": @([NSDate date].timeIntervalSince1970 * 1000)
        };
        
        self.scanResolve(result);
        self.scanResolve = nil;
        self.scanReject = nil;
    }
    
    // Dismiss scanner after a short delay
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [self dismissScanner];
    });
}

// MARK: - RCT Exposed Methods

RCT_EXPORT_METHOD(scanBarcode:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        // Check camera permission
        AVAuthorizationStatus status = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
        
        if (status == AVAuthorizationStatusDenied || status == AVAuthorizationStatusRestricted) {
            reject(@"CAMERA_PERMISSION_DENIED", @"Camera permission is required for scanning", nil);
            return;
        }
        
        if (status == AVAuthorizationStatusNotDetermined) {
            [self requestCameraPermissionWithResolver:^(id result) {
                [self startBarcodeScanWithResolver:resolve rejecter:reject];
            } rejecter:reject];
            return;
        }
        
        [self startBarcodeScanWithResolver:resolve rejecter:reject];
    });
}

RCT_EXPORT_METHOD(scanQRCode:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    // For now, use the same barcode scanning but we could customize for QR codes
    [self scanBarcode:resolve rejecter:reject];
}

- (void)startBarcodeScanWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
    // Store callbacks
    self.scanResolve = resolve;
    self.scanReject = reject;
    
    // Setup capture session
    [self setupCaptureSession];
    if (!self.captureSession) {
        reject(@"SCANNER_ERROR", @"Failed to setup scanner", nil);
        self.scanResolve = nil;
        self.scanReject = nil;
        return;
    }
    
    // Start capture session
    [self startCaptureSession];
    
    // Present scanner view controller
    UIViewController *rootViewController = RCTPresentedViewController();
    if (!rootViewController) {
        reject(@"SCANNER_ERROR", @"No view controller to present scanner", nil);
        self.scanResolve = nil;
        self.scanReject = nil;
        return;
    }
    
    self.presentedViewController = [self createScannerViewController];
    [rootViewController presentViewController:self.presentedViewController animated:YES completion:nil];
}

// MARK: - Cleanup

- (void)invalidate {
    [self cleanupCaptureSession];
    self.scanResolve = nil;
    self.scanReject = nil;
    
    if (self.presentedViewController) {
        [self.presentedViewController dismissViewControllerAnimated:NO completion:nil];
        self.presentedViewController = nil;
    }
}

- (void)dealloc {
    [self invalidate];
}

@end