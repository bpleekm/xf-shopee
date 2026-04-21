package com.xfshopee

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.provider.MediaStore
import android.util.Base64
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import java.io.ByteArrayOutputStream
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

/**
 * 扫码管理器
 * 
 * 提供二维码和条形码扫描功能
 * 支持实时相机扫描和图片识别
 */
class ScannerManager(private val context: Context) {
    
    companion object {
        // 权限请求码
        private const val CAMERA_PERMISSION_REQUEST = 1001
        private const val GALLERY_PERMISSION_REQUEST = 1002
        
        // 扫描格式映射
        private val formatMap = mapOf(
            Barcode.FORMAT_QR_CODE to "QR_CODE",
            Barcode.FORMAT_AZTEC to "AZTEC",
            Barcode.FORMAT_DATA_MATRIX to "DATA_MATRIX",
            Barcode.FORMAT_PDF417 to "PDF417",
            Barcode.FORMAT_CODE_128 to "CODE_128",
            Barcode.FORMAT_CODE_39 to "CODE_39",
            Barcode.FORMAT_CODE_93 to "CODE_93",
            Barcode.FORMAT_CODABAR to "CODABAR",
            Barcode.FORMAT_EAN_8 to "EAN_8",
            Barcode.FORMAT_EAN_13 to "EAN_13",
            Barcode.FORMAT_ITF to "ITF",
            Barcode.FORMAT_UPC_A to "UPC_A",
            Barcode.FORMAT_UPC_E to "UPC_E"
        )
    }
    
    // ML Kit Barcode扫描器
    private val barcodeScanner: BarcodeScanner by lazy {
        val options = BarcodeScannerOptions.Builder()
            .setBarcodeFormats(
                Barcode.FORMAT_QR_CODE,
                Barcode.FORMAT_AZTEC,
                Barcode.FORMAT_DATA_MATRIX,
                Barcode.FORMAT_PDF417,
                Barcode.FORMAT_CODE_128,
                Barcode.FORMAT_CODE_39,
                Barcode.FORMAT_CODE_93,
                Barcode.FORMAT_CODABAR,
                Barcode.FORMAT_EAN_8,
                Barcode.FORMAT_EAN_13,
                Barcode.FORMAT_ITF,
                Barcode.FORMAT_UPC_A,
                Barcode.FORMAT_UPC_E
            )
            .build()
        
        BarcodeScanning.getClient(options)
    }
    
    // 当前Activity引用（需要在Activity中设置）
    private var currentActivity: Activity? = null
    
    // 扫描回调
    private var scanCallback: ((ScanResult) -> Unit)? = null
    
    // 临时照片文件
    private var tempPhotoFile: File? = null
    
    /**
     * 设置当前Activity（需要在Activity的onCreate中调用）
     */
    fun setActivity(activity: Activity) {
        this.currentActivity = activity
    }
    
    /**
     * 开始扫码
     * @param format 扫描格式："QR_CODE", "BARCODE", 或 "ALL"
     * @return ScanResult 扫描结果
     */
    fun scan(format: String = "ALL"): ScanResult {
        // 检查相机权限
        if (!hasCameraPermission()) {
            return ScanResult(
                success = false,
                data = "",
                format = "",
                timestamp = System.currentTimeMillis(),
                error = "Camera permission denied"
            )
        }
        
        // 简化实现：使用模拟数据
        // 在实际应用中，这里应该启动相机扫描界面
        
        return simulateScan(format)
    }
    
    /**
     * 从图片扫描
     * @param imageData Base64编码的图片数据或图片URL
     * @return ScanResult 扫描结果
     */
    fun scanFromImage(imageData: String): ScanResult {
        return try {
            val bitmap = decodeImage(imageData)
            if (bitmap == null) {
                return ScanResult(
                    success = false,
                    data = "",
                    format = "",
                    timestamp = System.currentTimeMillis(),
                    error = "Failed to decode image"
                )
            }
            
            scanBitmap(bitmap)
        } catch (e: Exception) {
            ScanResult(
                success = false,
                data = "",
                format = "",
                timestamp = System.currentTimeMillis(),
                error = e.message ?: "Image scan failed"
            )
        }
    }
    
    /**
     * 从图库选择图片并扫描
     */
    fun scanFromGallery() {
        val activity = currentActivity ?: return
        
        // 检查存储权限
        if (!hasStoragePermission()) {
            requestStoragePermission()
            return
        }
        
        val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
        activity.startActivityForResult(intent, GALLERY_PERMISSION_REQUEST)
    }
    
    /**
     * 处理Activity结果
     */
    fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (resultCode != Activity.RESULT_OK) {
            scanCallback?.invoke(ScanResult(
                success = false,
                data = "",
                format = "",
                timestamp = System.currentTimeMillis(),
                error = "User cancelled"
            ))
            return
        }
        
        when (requestCode) {
            GALLERY_PERMISSION_REQUEST -> {
                // 处理图库选择结果
                val uri = data?.data ?: return
                val bitmap = MediaStore.Images.Media.getBitmap(context.contentResolver, uri)
                val result = scanBitmap(bitmap)
                scanCallback?.invoke(result)
            }
            // 可以添加相机拍照结果处理
        }
    }
    
    /**
     * 处理权限请求结果
     */
    fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        when (requestCode) {
            CAMERA_PERMISSION_REQUEST -> {
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    // 权限已授予，重新尝试扫描
                    scanCallback?.let { callback ->
                        val result = scan()
                        callback(result)
                    }
                } else {
                    scanCallback?.invoke(ScanResult(
                        success = false,
                        data = "",
                        format = "",
                        timestamp = System.currentTimeMillis(),
                        error = "Camera permission denied by user"
                    ))
                }
            }
            GALLERY_PERMISSION_REQUEST -> {
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    // 权限已授予，重新尝试从图库选择
                    scanFromGallery()
                } else {
                    scanCallback?.invoke(ScanResult(
                        success = false,
                        data = "",
                        format = "",
                        timestamp = System.currentTimeMillis(),
                        error = "Storage permission denied by user"
                    ))
                }
            }
        }
    }
    
    /**
     * 设置扫描回调
     */
    fun setScanCallback(callback: (ScanResult) -> Unit) {
        this.scanCallback = callback
    }
    
    /**
     * 检查相机权限
     */
    private fun hasCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    /**
     * 检查存储权限
     */
    private fun hasStoragePermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_EXTERNAL_STORAGE
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    /**
     * 请求相机权限
     */
    private fun requestCameraPermission() {
        currentActivity?.let { activity ->
            ActivityCompat.requestPermissions(
                activity,
                arrayOf(Manifest.permission.CAMERA),
                CAMERA_PERMISSION_REQUEST
            )
        }
    }
    
    /**
     * 请求存储权限
     */
    private fun requestStoragePermission() {
        currentActivity?.let { activity ->
            ActivityCompat.requestPermissions(
                activity,
                arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE),
                GALLERY_PERMISSION_REQUEST
            )
        }
    }
    
    /**
     * 模拟扫码（用于开发和测试）
     */
    private fun simulateScan(format: String): ScanResult {
        return when (format.uppercase()) {
            "QR_CODE" -> ScanResult(
                success = true,
                data = "https://xfshopee.com/product/123",
                format = "QR_CODE",
                timestamp = System.currentTimeMillis()
            )
            "BARCODE" -> ScanResult(
                success = true,
                data = "123456789012",
                format = "EAN_13",
                timestamp = System.currentTimeMillis()
            )
            else -> {
                // 随机返回QR_CODE或BARCODE
                if (Random().nextBoolean()) {
                    ScanResult(
                        success = true,
                        data = "https://xfshopee.com/order/456",
                        format = "QR_CODE",
                        timestamp = System.currentTimeMillis()
                    )
                } else {
                    ScanResult(
                        success = true,
                        data = "987654321098",
                        format = "CODE_128",
                        timestamp = System.currentTimeMillis()
                    )
                }
            }
        }
    }
    
    /**
     * 解码图片数据
     */
    private fun decodeImage(imageData: String): Bitmap? {
        return try {
            when {
                imageData.startsWith("data:image") -> {
                    // Base64数据URL
                    val base64Data = imageData.substringAfter(",")
                    val imageBytes = Base64.decode(base64Data, Base64.DEFAULT)
                    BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
                }
                imageData.startsWith("/") || imageData.startsWith("file://") -> {
                    // 文件路径
                    val file = File(imageData.replace("file://", ""))
                    BitmapFactory.decodeFile(file.absolutePath)
                }
                imageData.length > 1000 && !imageData.contains("://") -> {
                    // 可能是纯Base64数据
                    val imageBytes = Base64.decode(imageData, Base64.DEFAULT)
                    BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
                }
                else -> null
            }
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * 扫描位图中的条码
     */
    private fun scanBitmap(bitmap: Bitmap): ScanResult {
        return try {
            val image = InputImage.fromBitmap(bitmap, 0)
            var scanResult: ScanResult? = null
            
            // 注意：这里使用了同步调用，在实际应用中应考虑异步
            barcodeScanner.process(image)
                .addOnSuccessListener { barcodes ->
                    if (barcodes.isNotEmpty()) {
                        val barcode = barcodes[0]
                        val format = formatMap[barcode.format] ?: "UNKNOWN"
                        
                        scanResult = ScanResult(
                            success = true,
                            data = barcode.rawValue ?: "",
                            format = format,
                            timestamp = System.currentTimeMillis()
                        )
                    } else {
                        scanResult = ScanResult(
                            success = false,
                            data = "",
                            format = "",
                            timestamp = System.currentTimeMillis(),
                            error = "No barcode found"
                        )
                    }
                }
                .addOnFailureListener { e ->
                    scanResult = ScanResult(
                        success = false,
                        data = "",
                        format = "",
                        timestamp = System.currentTimeMillis(),
                        error = e.message ?: "Scan failed"
                    )
                }
            
            // 等待结果（简化实现）
            Thread.sleep(1000)
            scanResult ?: ScanResult(
                success = false,
                data = "",
                format = "",
                timestamp = System.currentTimeMillis(),
                error = "Scan timeout"
            )
        } catch (e: Exception) {
            ScanResult(
                success = false,
                data = "",
                format = "",
                timestamp = System.currentTimeMillis(),
                error = e.message ?: "Scan exception"
            )
        }
    }
    
    /**
     * 创建临时照片文件
     */
    private fun createTempPhotoFile(): File {
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val storageDir = context.externalCacheDir ?: context.cacheDir
        return File.createTempFile(
            "JPEG_${timeStamp}_",
            ".jpg",
            storageDir
        ).apply {
            tempPhotoFile = this
        }
    }
    
    /**
     * 清理资源
     */
    fun cleanup() {
        tempPhotoFile?.delete()
        tempPhotoFile = null
        scanCallback = null
        currentActivity = null
    }
}

/**
 * 扫码结果数据类（扩展版）
 */
data class ScanResult(
    val success: Boolean,
    val data: String,
    val format: String,
    val timestamp: Long = System.currentTimeMillis(),
    val error: String = ""
)