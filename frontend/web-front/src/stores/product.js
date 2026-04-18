import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { productApi } from '../services/api'
import { ElMessage } from 'element-plus'

export const useProductStore = defineStore('product', () => {
  const products = ref([])
  const featuredProducts = ref([])
  const categories = ref([])
  const loading = ref(false)
  const currentProduct = ref(null)

  // 获取所有商品
  const fetchProducts = async (params = {}) => {
    loading.value = true
    try {
      const response = await productApi.getAll(params)
      products.value = response.data.products || []
      return products.value
    } catch (error) {
      ElMessage.error('获取商品列表失败')
      console.error(error)
      return []
    } finally {
      loading.value = false
    }
  }

  // 获取特色商品
  const fetchFeaturedProducts = async () => {
    loading.value = true
    try {
      const response = await productApi.getAll({ featured: true, limit: 6 })
      featuredProducts.value = response.data.products || []
      return featuredProducts.value
    } catch (error) {
      // 如果后端不支持featured参数，使用前6个商品作为特色商品
      await fetchProducts({ limit: 6 })
      featuredProducts.value = products.value.slice(0, 6)
      return featuredProducts.value
    } finally {
      loading.value = false
    }
  }

  // 获取商品详情
  const fetchProductById = async (id) => {
    loading.value = true
    try {
      const response = await productApi.getById(id)
      currentProduct.value = response.data
      return currentProduct.value
    } catch (error) {
      ElMessage.error('获取商品详情失败')
      console.error(error)
      return null
    } finally {
      loading.value = false
    }
  }

  // 搜索商品
  const searchProducts = async (query) => {
    loading.value = true
    try {
      const response = await productApi.search(query)
      products.value = response.data.products || []
      return products.value
    } catch (error) {
      // 如果后端不支持搜索API，在前端过滤
      await fetchProducts()
      const queryLower = query.toLowerCase()
      products.value = products.value.filter(p => 
        p.name.toLowerCase().includes(queryLower) || 
        p.description.toLowerCase().includes(queryLower) ||
        p.category?.toLowerCase().includes(queryLower)
      )
      return products.value
    } finally {
      loading.value = false
    }
  }

  // 按分类获取商品
  const fetchProductsByCategory = async (category) => {
    loading.value = true
    try {
      const response = await productApi.getByCategory(category)
      products.value = response.data.products || []
      return products.value
    } catch (error) {
      // 如果后端不支持分类API，在前端过滤
      await fetchProducts()
      products.value = products.value.filter(p => p.category === category)
      return products.value
    } finally {
      loading.value = false
    }
  }

  // 获取所有分类
  const fetchCategories = async () => {
    try {
      await fetchProducts()
      // 从商品中提取分类
      const categorySet = new Set()
      products.value.forEach(product => {
        if (product.category) {
          categorySet.add(product.category)
        }
      })
      categories.value = Array.from(categorySet)
      return categories.value
    } catch (error) {
      console.error('获取分类失败:', error)
      return []
    }
  }

  // 获取推荐商品（基于当前商品）
  const getRelatedProducts = (productId, limit = 4) => {
    if (!products.value.length) return []
    
    // 排除当前商品，随机选择其他商品
    const otherProducts = products.value.filter(p => p.id !== productId)
    const shuffled = [...otherProducts].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, limit)
  }

  // 获取热门商品（基于销量或查看次数）
  const getPopularProducts = (limit = 6) => {
    if (!products.value.length) return []
    
    // 暂时按价格排序，实际应基于销量或查看次数
    return [...products.value]
      .sort((a, b) => b.price - a.price) // 暂时按价格从高到低
      .slice(0, limit)
  }

  return {
    products,
    featuredProducts,
    categories,
    loading,
    currentProduct,
    fetchProducts,
    fetchFeaturedProducts,
    fetchProductById,
    searchProducts,
    fetchProductsByCategory,
    fetchCategories,
    getRelatedProducts,
    getPopularProducts,
  }
})