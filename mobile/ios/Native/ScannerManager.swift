import UIKit
import AVFoundation
import Vision

/**
 * 扫码结果结构体
 */
struct ScanResult {
    let success: Bool
    let data: String
    let format: String
    let timestamp: TimeInterval
    let error: String?
    
    init(success: Bool, data: String = "", format: String = "", timestamp: TimeInterval = Date().timeIntervalSince1970, error: String? = nil) {
        self.success = success
        self.data = data
        self.format = format
        self.timestamp = timestamp
        self.error = error
    }
}

/**
 * 扫码管理器
 * 
 * 提供二维码和条形码扫描功能
 * 支持实时相机扫描和图片识别
 */
class ScannerManager: NSObject {
    
    // 单例实例
    static let shared = ScannerManager()
    
    // 相机会话
    private var captureSession: AVCaptureSession?
    
    // 视频预览层
    private var previewLayer: AVCaptureVideoPreviewLayer?
    
    // 扫码回调
    private var scanCompletion: ((ScanResult) -> Void)?
    
    // 当前视图控制器 (用于呈现相机界面)
    private weak var currentViewController: UIViewController?
    
    // 是否正在扫描
    private var isScanning = false
    
    // 支持的条形码类型
    private let supportedBarcodeTypes: [VNBarcodeSymbology] = [
        .qr, .aztec, .dataMatrix, .pdf417,
        .code128, .code39, .code93, .codabar,
        .ean8, .ean13, .i2of5, .itf14, .upce
    ]
    
    private override init() {
        super.init()
        checkCameraPermission()
    }
    
    // MARK: - 公开方法
    
    /**
     * 开始扫码
     */
    func startScan(on viewController: UIViewController, format: String = "ALL", completion: @escaping (ScanResult) -> Void) {
        guard !isScanning else {
            completion(ScanResult(success: false, error: "Already scanning"))
            return
        }
        
        currentViewController = viewController
        scanCompletion = completion
        
        // 检查相机权限
        checkCameraPermission { [weak self] granted in
            guard let self = self else { return }
            
            if granted {
                self.setupAndStartScanning()
            } else {
                completion(ScanResult(success: false, error: "Camera permission denied"))
            }
        }
    }
    
    /**
     * 从图片扫描
     */
    func scanFromImage(_ image: UIImage, completion: @escaping (ScanResult) -> Void) {
        guard let cgImage = image.cgImage else {
            completion(ScanResult(success: false, error: "Invalid image"))
            return
        }
        
        let requestHandler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        let request = VNDetectBarcodesRequest { [weak self] request, error in
            self?.handleBarcodeDetection(request: request, error: error, completion: completion)
        }
        
        request.symbologies = supportedBarcodeTypes
        
        do {
            try requestHandler.perform([request])
        } catch {
            completion(ScanResult(success: false, error: "Failed to scan image: \(error.localizedDescription)"))
        }
    }
    
    /**
     * 从图片数据扫描
     */
    func scanFromImageData(_ imageData: Data, completion: @escaping (ScanResult) -> Void) {
        guard let image = UIImage(data: imageData) else {
            completion(ScanResult(success: false, error: "Invalid image data"))
            return
        }
        
        scanFromImage(image, completion: completion)
    }
    
    /**
     * 从Base64字符串扫描
     */
    func scanFromBase64(_ base64String: String, completion: @escaping (ScanResult) -> Void) {
        guard let imageData = Data(base64Encoded: base64String) else {
            completion(ScanResult(success: false, error: "Invalid base64 string"))
            return
        }
        
        scanFromImageData(imageData, completion: completion)
    }
    
    /**
     * 停止扫码
     */
    func stopScan() {
        guard isScanning else { return }
        
        isScanning = false
        captureSession?.stopRunning()
        previewLayer?.removeFromSuperlayer()
        
        captureSession = nil
        previewLayer = nil
        currentViewController = nil
    }
    
    /**
     * 检查扫码功能是否可用
     */
    func isScannerAvailable() -> Bool {
        return AVCaptureDevice.default(for: .video) != nil
    }
    
    /**
     * 获取支持的扫码格式
     */
    func getSupportedFormats() -> [String] {
        return supportedBarcodeTypes.map { $0.rawValue }
    }
    
    /**
     * 模拟扫码 (用于开发和测试)
     */
    func simulateScan(format: String = "QR_CODE", delay: TimeInterval = 1.0, completion: @escaping (ScanResult) -> Void) {
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
            let result: ScanResult
            
            switch format.uppercased() {
            case "QR_CODE":
                result = ScanResult(
                    success: true,
                    data: "https://xfshopee.com/product/123",
                    format: "QR_CODE"
                )
            case "BARCODE", "EAN_13":
                result = ScanResult(
                    success: true,
                    data: "123456789012",
                    format: "EAN_13"
                )
            case "CODE_128":
                result = ScanResult(
                    success: true,
                    data: "CODE128TEST",
                    format: "CODE_128"
                )
            default:
                result = ScanResult(
                    success: true,
                    data: "https://xfshopee.com/order/456",
                    format: "QR_CODE"
                )
            }
            
            completion(result)
        }
    }
    
    // MARK: - 私有方法
    
    /**
     * 检查相机权限
     */
    private func checkCameraPermission(completion: ((Bool) -> Void)? = nil) {
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        
        switch status {
        case .authorized:
            completion?(true)
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { granted in
                DispatchQueue.main.async {
                    completion?(granted)
                }
            }
        case .denied, .restricted:
            completion?(false)
        @unknown default:
            completion?(false)
        }
    }
    
    /**
     * 设置并开始扫描
     */
    private func setupAndStartScanning() {
        guard let viewController = currentViewController else {
            scanCompletion?(ScanResult(success: false, error: "No view controller"))
            return
        }
        
        // 创建捕获会话
        let session = AVCaptureSession()
        session.sessionPreset = .high
        
        // 获取视频设备
        guard let videoDevice = AVCaptureDevice.default(for: .video),
              let videoInput = try? AVCaptureDeviceInput(device: videoDevice) else {
            scanCompletion?(ScanResult(success: false, error: "No camera available"))
            return
        }
        
        // 添加视频输入
        if session.canAddInput(videoInput) {
            session.addInput(videoInput)
        } else {
            scanCompletion?(ScanResult(success: false, error: "Cannot add video input"))
            return
        }
        
        // 添加视频输出
        let videoOutput = AVCaptureVideoDataOutput()
        videoOutput.setSampleBufferDelegate(self, queue: DispatchQueue(label: "scanner.queue"))
        
        if session.canAddOutput(videoOutput) {
            session.addOutput(videoOutput)
        } else {
            scanCompletion?(ScanResult(success: false, error: "Cannot add video output"))
            return
        }
        
        // 创建预览层
        let previewLayer = AVCaptureVideoPreviewLayer(session: session)
        previewLayer.videoGravity = .resizeAspectFill
        previewLayer.frame = viewController.view.bounds
        viewController.view.layer.addSublayer(previewLayer)
        
        // 添加扫码框
        addScanFrame(to: viewController.view)
        
        // 添加取消按钮
        addCancelButton(to: viewController.view)
        
        // 保存引用
        self.captureSession = session
        self.previewLayer = previewLayer
        
        // 开始扫描
        isScanning = true
        session.startRunning()
    }
    
    /**
     * 添加扫码框
     */
    private func addScanFrame(to view: UIView) {
        let scanFrameSize: CGFloat = 250
        let scanFrameView = UIView(frame: CGRect(x: (view.bounds.width - scanFrameSize) / 2,
                                                y: (view.bounds.height - scanFrameSize) / 2,
                                                width: scanFrameSize,
                                                height: scanFrameSize))
        scanFrameView.layer.borderColor = UIColor.green.cgColor
        scanFrameView.layer.borderWidth = 2
        scanFrameView.backgroundColor = UIColor.clear
        scanFrameView.tag = 1001
        
        // 添加四个角
        addCorner(to: scanFrameView, position: .topLeft)
        addCorner(to: scanFrameView, position: .topRight)
        addCorner(to: scanFrameView, position: .bottomLeft)
        addCorner(to: scanFrameView, position: .bottomRight)
        
        view.addSubview(scanFrameView)
    }
    
    /**
     * 添加角标
     */
    private enum CornerPosition {
        case topLeft, topRight, bottomLeft, bottomRight
    }
    
    private func addCorner(to view: UIView, position: CornerPosition) {
        let cornerLength: CGFloat = 20
        let cornerWidth: CGFloat = 3
        let cornerColor = UIColor.green
        
        let cornerView = UIView()
        cornerView.backgroundColor = cornerColor
        
        switch position {
        case .topLeft:
            cornerView.frame = CGRect(x: 0, y: 0, width: cornerLength, height: cornerWidth)
            let verticalCorner = UIView(frame: CGRect(x: 0, y: 0, width: cornerWidth, height: cornerLength))
            verticalCorner.backgroundColor = cornerColor
            view.addSubview(verticalCorner)
        case .topRight:
            cornerView.frame = CGRect(x: view.bounds.width - cornerLength, y: 0, width: cornerLength, height: cornerWidth)
            let verticalCorner = UIView(frame: CGRect(x: view.bounds.width - cornerWidth, y: 0, width: cornerWidth, height: cornerLength))
            verticalCorner.backgroundColor = cornerColor
            view.addSubview(verticalCorner)
        case .bottomLeft:
            cornerView.frame = CGRect(x: 0, y: view.bounds.height - cornerWidth, width: cornerLength, height: cornerWidth)
            let verticalCorner = UIView(frame: CGRect(x: 0, y: view.bounds.height - cornerLength, width: cornerWidth, height: cornerLength))
            verticalCorner.backgroundColor = cornerColor
            view.addSubview(verticalCorner)
        case .bottomRight:
            cornerView.frame = CGRect(x: view.bounds.width - cornerLength, y: view.bounds.height - cornerWidth, width: cornerLength, height: cornerWidth)
            let verticalCorner = UIView(frame: CGRect(x: view.bounds.width - cornerWidth, y: view.bounds.height - cornerLength, width: cornerWidth, height: cornerLength))
            verticalCorner.backgroundColor = cornerColor
            view.addSubview(verticalCorner)
        }
        
        view.addSubview(cornerView)
    }
    
    /**
     * 添加取消按钮
     */
    private func addCancelButton(to view: UIView) {
        let button = UIButton(type: .system)
        button.frame = CGRect(x: 20, y: view.bounds.height - 80, width: view.bounds.width - 40, height: 50)
        button.setTitle("取消", for: .normal)
        button.titleLabel?.font = UIFont.boldSystemFont(ofSize: 18)
        button.backgroundColor = UIColor.systemRed.withAlphaComponent(0.8)
        button.setTitleColor(.white, for: .normal)
        button.layer.cornerRadius = 10
        button.addTarget(self, action: #selector(cancelScan), for: .touchUpInside)
        button.tag = 1002
        
        view.addSubview(button)
    }
    
    /**
     * 取消扫码
     */
    @objc private func cancelScan() {
        let result = ScanResult(success: false, error: "User cancelled")
        scanCompletion?(result)
        stopScan()
        cleanupView()
    }
    
    /**
     * 清理视图
     */
    private func cleanupView() {
        currentViewController?.view.viewWithTag(1001)?.removeFromSuperview()
        currentViewController?.view.viewWithTag(1002)?.removeFromSuperview()
    }
    
    /**
     * 处理条形码检测结果
     */
    private func handleBarcodeDetection(request: VNRequest, error: Error?, completion: @escaping (ScanResult) -> Void) {
        if let error = error {
            completion(ScanResult(success: false, error: "Detection failed: \(error.localizedDescription)"))
            return
        }
        
        guard let observations = request.results as? [VNBarcodeObservation],
              let barcode = observations.first,
              let payload = barcode.payloadStringValue else {
            completion(ScanResult(success: false, error: "No barcode found"))
            return
        }
        
        let result = ScanResult(
            success: true,
            data: payload,
            format: barcode.symbology.rawValue,
            timestamp: Date().timeIntervalSince1970
        )
        
        DispatchQueue.main.async {
            completion(result)
            self.stopScan()
            self.cleanupView()
        }
    }
    
    /**
     * 处理扫码结果
     */
    private func handleScanResult(_ result: ScanResult) {
        DispatchQueue.main.async {
            self.scanCompletion?(result)
            self.stopScan()
            self.cleanupView()
        }
    }
    
    deinit {
        stopScan()
    }
}

// MARK: - AVCaptureVideoDataOutputSampleBufferDelegate
extension ScannerManager: AVCaptureVideoDataOutputSampleBufferDelegate {
    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        guard isScanning,
              let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
            return
        }
        
        let requestHandler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:])
        let request = VNDetectBarcodesRequest { [weak self] request, error in
            self?.handleBarcodeDetection(request: request, error: error) { result in
                if result.success {
                    self?.handleScanResult(result)
                }
            }
        }
        
        request.symbologies = supportedBarcodeTypes
        
        do {
            try requestHandler.perform([request])
        } catch {
            print("Failed to perform barcode detection: \(error)")
        }
    }
}