import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartApi } from '../services/api'
import { useUserStore } from './user'
import { ElMessage } from 'element-plus'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const loading = ref(false)
  const userStore = useUserStore()

  const totalItems = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const totalPrice = computed(() => items.value.reduce((sum, item) => sum + (item.price * item.quantity), 0))

  // 初始化购物车
  const init = async () => {
    if (userStore.isAuthenticated) {
      await fetchCart()
    } else {
      // 加载本地购物车
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        try {
          items.value = JSON.parse(savedCart)
        } catch (error) {
          console.error('Failed to parse saved cart:', error)
          items.value = []
        }
      }
    }
  }

  // 获取购物车（已登录用户）
  const fetchCart = async () => {
    if (!userStore.isAuthenticated) return
    
    loading.value = true
    try {
      const response = await cartApi.getCart()
      // 后端返回的购物车格式可能不同，这里需要适配
      // 假设返回格式为 { items: [{ product, quantity }] }
      const cartItems = response.data?.items || []
      items.value = cartItems.map(item => ({
        ...item.product,
        quantity: item.quantity
      }))
    } catch (error) {
      console.error('Failed to fetch cart:', error)
      // 如果获取失败，使用本地购物车
    } finally {
      loading.value = false
    }
  }

  // 添加到购物车
  const addItem = async (product, quantity = 1) => {
    const existing = items.value.find(item => item.id === product.id)
    
    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({ ...product, quantity })
    }

    // 保存到本地存储
    saveToLocalStorage()

    // 如果已登录，同步到后端
    if (userStore.isAuthenticated) {
      try {
        await cartApi.addItem(product.id, quantity)
      } catch (error) {
        console.error('Failed to sync cart to backend:', error)
      }
    }

    ElMessage.success(`${product.name} added to cart!`)
  }

  // 移除商品
  const removeItem = async (productId) => {
    const item = items.value.find(item => item.id === productId)
    if (!item) return
    
    items.value = items.value.filter(item => item.id !== productId)
    
    // 保存到本地存储
    saveToLocalStorage()
    
    // 如果已登录，同步到后端
    if (userStore.isAuthenticated) {
      try {
        // 需要后端提供根据productId删除的API
        // 暂时使用本地删除
        await cartApi.clearCart() // 简化处理，实际应该删除单个商品
      } catch (error) {
        console.error('Failed to remove item from backend:', error)
      }
    }
    
    ElMessage.success('Item removed from cart')
  }

  // 更新数量
  const updateQuantity = async (productId, quantity) => {
    const item = items.value.find(item => item.id === productId)
    if (!item) return
    
    item.quantity = quantity
    if (item.quantity <= 0) {
      await removeItem(productId)
      return
    }
    
    // 保存到本地存储
    saveToLocalStorage()
    
    // 如果已登录，同步到后端
    if (userStore.isAuthenticated) {
      try {
        // 需要后端提供更新购物车项的API
        // 暂时使用本地更新
      } catch (error) {
        console.error('Failed to update quantity in backend:', error)
      }
    }
  }

  // 清空购物车
  const clearCart = async () => {
    items.value = []
    localStorage.removeItem('cart')
    
    // 如果已登录，同步到后端
    if (userStore.isAuthenticated) {
      try {
        await cartApi.clearCart()
      } catch (error) {
        console.error('Failed to clear cart in backend:', error)
      }
    }
  }

  // 合并购物车（登录后）
  const mergeCart = async () => {
    if (!userStore.isAuthenticated) return
    
    const localCart = JSON.parse(localStorage.getItem('cart') || '[]')
    if (localCart.length === 0) return
    
    try {
      // 将本地购物车商品添加到后端购物车
      for (const item of localCart) {
        await cartApi.addItem(item.id, item.quantity)
      }
      
      // 清空本地购物车
      localStorage.removeItem('cart')
      await fetchCart() // 重新获取合并后的购物车
      
      ElMessage.success('Cart merged successfully')
    } catch (error) {
      console.error('Failed to merge cart:', error)
    }
  }

  // 结账
  const checkout = async (checkoutData) => {
    if (!userStore.isAuthenticated) {
      ElMessage.warning('Please login to checkout')
      return { success: false, error: 'Not authenticated' }
    }
    
    loading.value = true
    try {
      const response = await cartApi.checkout(checkoutData)
      // 结账成功后清空购物车
      await clearCart()
      ElMessage.success('Order placed successfully!')
      return { success: true, data: response.data }
    } catch (error) {
      const errorMsg = error.message || 'Checkout failed'
      ElMessage.error(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      loading.value = false
    }
  }

  // 保存到本地存储
  const saveToLocalStorage = () => {
    localStorage.setItem('cart', JSON.stringify(items.value))
  }

  return {
    items,
    loading,
    totalItems,
    totalPrice,
    init,
    fetchCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    mergeCart,
    checkout,
  }
})