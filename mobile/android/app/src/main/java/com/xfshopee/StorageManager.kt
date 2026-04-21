package com.xfshopee

import android.content.Context
import android.content.SharedPreferences
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.nio.charset.StandardCharsets
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * 存储管理器
 * 
 * 提供安全的本地存储功能，支持明文和加密存储
 * 使用SharedPreferences作为后端，支持加密选项
 */
class StorageManager(private val context: Context) {
    
    companion object {
        // 存储文件名
        private const val PREF_NAME = "xfshopee_storage"
        private const val ENCRYPTED_PREF_NAME = "xfshopee_encrypted_storage"
        
        // 加密算法
        private const val KEY_ALIAS = "xfshopee_master_key"
        private const val ANDROID_KEYSTORE = "AndroidKeyStore"
        private const val TRANSFORMATION = "AES/GCM/NoPadding"
        private const val GCM_TAG_LENGTH = 128
    }
    
    // 明文SharedPreferences
    private val sharedPrefs: SharedPreferences by lazy {
        context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    }
    
    // 加密SharedPreferences
    private val encryptedPrefs: SharedPreferences by lazy {
        try {
            val masterKey = MasterKey.Builder(context, KEY_ALIAS)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
            
            EncryptedSharedPreferences.create(
                context,
                ENCRYPTED_PREF_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            // 如果加密失败，回退到明文存储
            println("Failed to create encrypted preferences: ${e.message}")
            sharedPrefs
        }
    }
    
    /**
     * 设置字符串值（明文）
     */
    fun setString(key: String, value: String) {
        sharedPrefs.edit().putString(key, value).apply()
    }
    
    /**
     * 获取字符串值（明文）
     */
    fun getString(key: String, defaultValue: String = ""): String {
        return sharedPrefs.getString(key, defaultValue) ?: defaultValue
    }
    
    /**
     * 设置字符串值（加密）
     */
    fun setStringEncrypted(key: String, value: String) {
        encryptedPrefs.edit().putString(key, value).apply()
    }
    
    /**
     * 获取字符串值（加密）
     */
    fun getStringEncrypted(key: String, defaultValue: String = ""): String {
        return encryptedPrefs.getString(key, defaultValue) ?: defaultValue
    }
    
    /**
     * 设置整数值
     */
    fun setInt(key: String, value: Int) {
        sharedPrefs.edit().putInt(key, value).apply()
    }
    
    /**
     * 获取整数值
     */
    fun getInt(key: String, defaultValue: Int = 0): Int {
        return sharedPrefs.getInt(key, defaultValue)
    }
    
    /**
     * 设置布尔值
     */
    fun setBoolean(key: String, value: Boolean) {
        sharedPrefs.edit().putBoolean(key, value).apply()
    }
    
    /**
     * 获取布尔值
     */
    fun getBoolean(key: String, defaultValue: Boolean = false): Boolean {
        return sharedPrefs.getBoolean(key, defaultValue)
    }
    
    /**
     * 设置长整数值
     */
    fun setLong(key: String, value: Long) {
        sharedPrefs.edit().putLong(key, value).apply()
    }
    
    /**
     * 获取长整数值
     */
    fun getLong(key: String, defaultValue: Long = 0L): Long {
        return sharedPrefs.getLong(key, defaultValue)
    }
    
    /**
     * 设置浮点数值
     */
    fun setFloat(key: String, value: Float) {
        sharedPrefs.edit().putFloat(key, value).apply()
    }
    
    /**
     * 获取浮点数值
     */
    fun getFloat(key: String, defaultValue: Float = 0f): Float {
        return sharedPrefs.getFloat(key, defaultValue)
    }
    
    /**
     * 移除指定键
     */
    fun remove(key: String) {
        sharedPrefs.edit().remove(key).apply()
        encryptedPrefs.edit().remove(key).apply()
    }
    
    /**
     * 清空所有存储
     */
    fun clear() {
        sharedPrefs.edit().clear().apply()
        encryptedPrefs.edit().clear().apply()
    }
    
    /**
     * 检查键是否存在
     */
    fun contains(key: String): Boolean {
        return sharedPrefs.contains(key) || encryptedPrefs.contains(key)
    }
    
    /**
     * 获取所有键
     */
    fun getAllKeys(): Set<String> {
        val allKeys = mutableSetOf<String>()
        allKeys.addAll(sharedPrefs.all.keys)
        allKeys.addAll(encryptedPrefs.all.keys)
        return allKeys
    }
    
    /**
     * 手动加密字符串
     */
    fun encryptString(plaintext: String): String? {
        return try {
            val cipher = Cipher.getInstance(TRANSFORMATION)
            val secretKey = getOrCreateSecretKey()
            
            cipher.init(Cipher.ENCRYPT_MODE, secretKey)
            val iv = cipher.iv
            val ciphertext = cipher.doFinal(plaintext.toByteArray(StandardCharsets.UTF_8))
            
            // 组合IV和密文
            val combined = ByteArray(iv.size + ciphertext.size)
            System.arraycopy(iv, 0, combined, 0, iv.size)
            System.arraycopy(ciphertext, 0, combined, iv.size, ciphertext.size)
            
            Base64.encodeToString(combined, Base64.DEFAULT)
        } catch (e: Exception) {
            println("Encryption failed: ${e.message}")
            null
        }
    }
    
    /**
     * 手动解密字符串
     */
    fun decryptString(encrypted: String): String? {
        return try {
            val combined = Base64.decode(encrypted, Base64.DEFAULT)
            
            // 提取IV（12字节用于GCM）
            val iv = ByteArray(12)
            System.arraycopy(combined, 0, iv, 0, iv.size)
            
            // 提取密文
            val ciphertext = ByteArray(combined.size - iv.size)
            System.arraycopy(combined, iv.size, ciphertext, 0, ciphertext.size)
            
            val cipher = Cipher.getInstance(TRANSFORMATION)
            val secretKey = getOrCreateSecretKey()
            
            val spec = GCMParameterSpec(GCM_TAG_LENGTH, iv)
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec)
            
            val plaintext = cipher.doFinal(ciphertext)
            String(plaintext, StandardCharsets.UTF_8)
        } catch (e: Exception) {
            println("Decryption failed: ${e.message}")
            null
        }
    }
    
    /**
     * 获取或创建密钥
     */
    private fun getOrCreateSecretKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
        keyStore.load(null)
        
        if (!keyStore.containsAlias(KEY_ALIAS)) {
            val keyGenerator = KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                ANDROID_KEYSTORE
            )
            
            val keyGenParameterSpec = KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build()
            
            keyGenerator.init(keyGenParameterSpec)
            keyGenerator.generateKey()
        }
        
        return keyStore.getKey(KEY_ALIAS, null) as SecretKey
    }
    
    /**
     * 导出存储数据（调试用）
     */
    fun exportData(): Map<String, Any> {
        val data = mutableMapOf<String, Any>()
        
        // 明文数据
        sharedPrefs.all.forEach { (key, value) ->
            data["plain_$key"] = value
        }
        
        // 加密数据（值已加密）
        encryptedPrefs.all.forEach { (key, value) ->
            data["encrypted_$key"] = value
        }
        
        return data
    }
    
    /**
     * 导入存储数据（调试用）
     */
    fun importData(data: Map<String, Any>) {
        val plainEditor = sharedPrefs.edit()
        val encryptedEditor = encryptedPrefs.edit()
        
        data.forEach { (key, value) ->
            when {
                key.startsWith("plain_") -> {
                    val actualKey = key.removePrefix("plain_")
                    when (value) {
                        is String -> plainEditor.putString(actualKey, value)
                        is Int -> plainEditor.putInt(actualKey, value)
                        is Boolean -> plainEditor.putBoolean(actualKey, value)
                        is Long -> plainEditor.putLong(actualKey, value)
                        is Float -> plainEditor.putFloat(actualKey, value)
                    }
                }
                key.startsWith("encrypted_") -> {
                    val actualKey = key.removePrefix("encrypted_")
                    if (value is String) {
                        encryptedEditor.putString(actualKey, value)
                    }
                }
            }
        }
        
        plainEditor.apply()
        encryptedEditor.apply()
    }
}