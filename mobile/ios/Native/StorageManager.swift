import UIKit
import Security

/**
 * 存储管理器
 * 
 * 提供安全的本地存储功能，支持键值对存储
 */
class StorageManager: NSObject {
    
    // 单例实例
    static let shared = StorageManager()
    
    // UserDefaults实例
    private let userDefaults: UserDefaults
    
    // 钥匙串服务标识
    private let keychainService = "com.xfshopee.app"
    
    private override init() {
        // 使用应用组标识符，支持扩展间共享数据
        if let appGroup = UserDefaults(suiteName: "group.com.xfshopee.app") {
            userDefaults = appGroup
        } else {
            userDefaults = UserDefaults.standard
        }
        
        super.init()
    }
    
    // MARK: - UserDefaults 存储 (明文)
    
    /**
     * 设置字符串值
     */
    func setString(key: String, value: String) {
        userDefaults.set(value, forKey: key)
        userDefaults.synchronize()
    }
    
    /**
     * 获取字符串值
     */
    func getString(key: String, defaultValue: String = "") -> String {
        return userDefaults.string(forKey: key) ?? defaultValue
    }
    
    /**
     * 设置整数值
     */
    func setInt(key: String, value: Int) {
        userDefaults.set(value, forKey: key)
    }
    
    /**
     * 获取整数值
     */
    func getInt(key: String, defaultValue: Int = 0) -> Int {
        return userDefaults.integer(forKey: key)
    }
    
    /**
     * 设置布尔值
     */
    func setBool(key: String, value: Bool) {
        userDefaults.set(value, forKey: key)
    }
    
    /**
     * 获取布尔值
     */
    func getBool(key: String, defaultValue: Bool = false) -> Bool {
        return userDefaults.bool(forKey: key)
    }
    
    /**
     * 设置双精度值
     */
    func setDouble(key: String, value: Double) {
        userDefaults.set(value, forKey: key)
    }
    
    /**
     * 获取双精度值
     */
    func getDouble(key: String, defaultValue: Double = 0.0) -> Double {
        return userDefaults.double(forKey: key)
    }
    
    /**
     * 设置数据值
     */
    func setData(key: String, value: Data) {
        userDefaults.set(value, forKey: key)
    }
    
    /**
     * 获取数据值
     */
    func getData(key: String) -> Data? {
        return userDefaults.data(forKey: key)
    }
    
    /**
     * 移除指定键
     */
    func remove(key: String) {
        userDefaults.removeObject(forKey: key)
    }
    
    /**
     * 清空所有存储
     */
    func clear() {
        let dictionary = userDefaults.dictionaryRepresentation()
        dictionary.keys.forEach { key in
            userDefaults.removeObject(forKey: key)
        }
        userDefaults.synchronize()
    }
    
    /**
     * 检查键是否存在
     */
    func contains(key: String) -> Bool {
        return userDefaults.object(forKey: key) != nil
    }
    
    /**
     * 获取所有键
     */
    func getAllKeys() -> [String] {
        return Array(userDefaults.dictionaryRepresentation().keys)
    }
    
    // MARK: - 钥匙串存储 (加密)
    
    /**
     * 保存字符串到钥匙串 (加密)
     */
    func saveToKeychain(key: String, value: String) -> Bool {
        guard let data = value.data(using: .utf8) else {
            return false
        }
        
        return saveToKeychain(key: key, data: data)
    }
    
    /**
     * 从钥匙串读取字符串 (加密)
     */
    func loadFromKeychain(key: String) -> String? {
        guard let data = loadFromKeychain(key: key) else {
            return nil
        }
        
        return String(data: data, encoding: .utf8)
    }
    
    /**
     * 保存数据到钥匙串
     */
    private func saveToKeychain(key: String, data: Data) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]
        
        // 先删除已存在的项目
        SecItemDelete(query as CFDictionary)
        
        // 添加新项目
        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }
    
    /**
     * 从钥匙串加载数据
     */
    private func loadFromKeychain(key: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        if status == errSecSuccess, let data = result as? Data {
            return data
        }
        
        return nil
    }
    
    /**
     * 从钥匙串删除项目
     */
    func deleteFromKeychain(key: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: key
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }
    
    /**
     * 清空钥匙串
     */
    func clearKeychain() -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }
    
    // MARK: - 文件存储
    
    /**
     * 保存数据到文件
     */
    func saveToFile(filename: String, data: Data, directory: FileManager.SearchPathDirectory = .documentDirectory) -> Bool {
        guard let directoryURL = FileManager.default.urls(for: directory, in: .userDomainMask).first else {
            return false
        }
        
        let fileURL = directoryURL.appendingPathComponent(filename)
        
        do {
            try data.write(to: fileURL)
            return true
        } catch {
            print("Failed to save file: \(error)")
            return false
        }
    }
    
    /**
     * 从文件加载数据
     */
    func loadFromFile(filename: String, directory: FileManager.SearchPathDirectory = .documentDirectory) -> Data? {
        guard let directoryURL = FileManager.default.urls(for: directory, in: .userDomainMask).first else {
            return nil
        }
        
        let fileURL = directoryURL.appendingPathComponent(filename)
        
        do {
            return try Data(contentsOf: fileURL)
        } catch {
            print("Failed to load file: \(error)")
            return nil
        }
    }
    
    /**
     * 删除文件
     */
    func deleteFile(filename: String, directory: FileManager.SearchPathDirectory = .documentDirectory) -> Bool {
        guard let directoryURL = FileManager.default.urls(for: directory, in: .userDomainMask).first else {
            return false
        }
        
        let fileURL = directoryURL.appendingPathComponent(filename)
        
        do {
            try FileManager.default.removeItem(at: fileURL)
            return true
        } catch {
            print("Failed to delete file: \(error)")
            return false
        }
    }
    
    /**
     * 检查文件是否存在
     */
    func fileExists(filename: String, directory: FileManager.SearchPathDirectory = .documentDirectory) -> Bool {
        guard let directoryURL = FileManager.default.urls(for: directory, in: .userDomainMask).first else {
            return false
        }
        
        let fileURL = directoryURL.appendingPathComponent(filename)
        return FileManager.default.fileExists(atPath: fileURL.path)
    }
    
    // MARK: - 辅助方法
    
    /**
     * 导出所有数据 (调试用)
     */
    func exportAllData() -> [String: Any] {
        var result: [String: Any] = [:]
        
        // UserDefaults数据
        let defaultsData = userDefaults.dictionaryRepresentation()
        result["userDefaults"] = defaultsData
        
        // 钥匙串数据 (只列出键)
        var keychainKeys: [String] = []
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecReturnAttributes as String: true,
            kSecMatchLimit as String: kSecMatchLimitAll
        ]
        
        var resultRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &resultRef)
        
        if status == errSecSuccess, let items = resultRef as? [[String: Any]] {
            for item in items {
                if let account = item[kSecAttrAccount as String] as? String {
                    keychainKeys.append(account)
                }
            }
        }
        
        result["keychainKeys"] = keychainKeys
        
        return result
    }
    
    /**
     * 备份数据到文件
     */
    func backupToFile() -> URL? {
        let data = exportAllData()
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: data, options: .prettyPrinted)
            let timestamp = Int(Date().timeIntervalSince1970)
            let filename = "backup_\(timestamp).json"
            
            if saveToFile(filename: filename, data: jsonData) {
                return FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?.appendingPathComponent(filename)
            }
        } catch {
            print("Failed to create backup: \(error)")
        }
        
        return nil
    }
    
    /**
     * 从备份恢复数据
     */
    func restoreFromFile(url: URL) -> Bool {
        do {
            let data = try Data(contentsOf: url)
            let json = try JSONSerialization.jsonObject(with: data, options: [])
            
            guard let backupData = json as? [String: Any] else {
                return false
            }
            
            // 恢复UserDefaults数据
            if let defaultsData = backupData["userDefaults"] as? [String: Any] {
                for (key, value) in defaultsData {
                    userDefaults.set(value, forKey: key)
                }
                userDefaults.synchronize()
            }
            
            return true
        } catch {
            print("Failed to restore from backup: \(error)")
            return false
        }
    }
}