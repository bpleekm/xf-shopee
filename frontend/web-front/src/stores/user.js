import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../services/api'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // 初始化时尝试加载用户信息
  const init = async () => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      token.value = savedToken
      try {
        user.value = JSON.parse(savedUser)
        // 验证token有效性
        await authApi.getCurrentUser()
      } catch (error) {
        console.error('Token validation failed:', error)
        logout()
      }
    }
  }

  // 登录
  const login = async (username, password) => {
    loading.value = true
    try {
      const response = await authApi.login(username, password)
      const { token: newToken, user: userData } = response.data
      
      // 保存到本地存储
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(userData))
      
      // 更新状态
      token.value = newToken
      user.value = userData
      
      ElMessage.success('登录成功！')
      return { success: true, data: userData }
    } catch (error) {
      const errorMsg = error.message || '登录失败，请检查用户名和密码'
      ElMessage.error(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (userData) => {
    loading.value = true
    try {
      const response = await authApi.register(userData)
      const { token: newToken, user: newUser } = response.data
      
      // 保存到本地存储
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(newUser))
      
      // 更新状态
      token.value = newToken
      user.value = newUser
      
      ElMessage.success('注册成功！')
      return { success: true, data: newUser }
    } catch (error) {
      const errorMsg = error.message || '注册失败'
      ElMessage.error(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = () => {
    authApi.logout()
    user.value = null
    token.value = null
    ElMessage.success('已退出登录')
  }

  // 更新用户信息
  const updateProfile = async (profileData) => {
    loading.value = true
    try {
      const response = await authApi.updateProfile(profileData)
      user.value = response.data
      localStorage.setItem('user', JSON.stringify(user.value))
      ElMessage.success('个人信息更新成功！')
      return { success: true, data: user.value }
    } catch (error) {
      ElMessage.error('更新失败：' + (error.message || '未知错误'))
      return { success: false, error }
    } finally {
      loading.value = false
    }
  }

  // 修改密码
  const changePassword = async (oldPassword, newPassword) => {
    loading.value = true
    try {
      await authApi.changePassword(oldPassword, newPassword)
      ElMessage.success('密码修改成功！')
      return { success: true }
    } catch (error) {
      ElMessage.error('密码修改失败：' + (error.message || '未知错误'))
      return { success: false, error }
    } finally {
      loading.value = false
    }
  }

  // 刷新用户信息
  const refreshUser = async () => {
    try {
      const response = await authApi.getCurrentUser()
      user.value = response.data
      localStorage.setItem('user', JSON.stringify(user.value))
      return user.value
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      return null
    }
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    init,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
  }
})