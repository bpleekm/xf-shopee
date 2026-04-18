<template>
  <div class="home">
    <el-container>
      <el-header>
        <h1>Welcome to XF Shopee</h1>
        <p>Your one-stop shop for all your needs</p>
      </el-header>
      <el-main>
        <el-row :gutter="24">
          <el-col :span="24">
            <el-card>
              <template #header>
                <span>Featured Products</span>
              </template>
              <div v-if="productStore.loading && productStore.featuredProducts.length === 0" style="text-align: center; padding: 40px;">
                <el-skeleton :rows="3" animated />
              </div>
              <el-row :gutter="16" v-else>
                <el-col :span="8" v-for="product in productStore.featuredProducts" :key="product.id">
                  <el-card shadow="hover">
                    <img 
                      :src="product.image || 'https://via.placeholder.com/300x200/CCCCCC/FFFFFF?text=Product'" 
                      :alt="product.name" 
                      style="width:100%;height:200px;object-fit:cover" 
                      @error="handleImageError"
                    />
                    <h3>{{ product.name }}</h3>
                    <p style="color:#666;font-size:14px;height:40px;overflow:hidden;">{{ product.description || 'No description available' }}</p>
                    <div style="display:flex;justify-content:space-between;align-items:center">
                      <span style="font-weight:bold;color:#e4393c">${{ product.price?.toFixed(2) || '0.00' }}</span>
                      <el-button type="primary" size="small" @click="addToCart(product)">Add to Cart</el-button>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="24" style="margin-top:24px">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>About Our Store</span>
              </template>
              <p>XF Shopee is a premier department store offering a wide range of products from groceries to electronics.</p>
              <p>We provide high-quality products with competitive prices and excellent customer service.</p>
            </el-card>
          </el-col>
          <el-col :span="12">
               <el-card>
                <template #header>
                  <span>System Status</span>
                </template>
                <div v-if="loading">
                  <el-skeleton :rows="3" animated />
                </div>
                <div v-else-if="health">
                  <p><strong>Backend Status:</strong> <el-tag type="success">{{ health.data?.status || health.status }}</el-tag></p>
                  <p><strong>Service:</strong> {{ health.data?.service || health.service }}</p>
                  <p><strong>Version:</strong> {{ health.data?.version || health.version }}</p>
                  <p><strong>Timestamp:</strong> {{ new Date(health.data?.timestamp || health.timestamp).toLocaleString() }}</p>
                </div>
                <div v-else>
                  <p style="color:#ff4d4f">Unable to connect to backend</p>
                  <p style="color:#999;font-size:12px;">Please check if the backend server is running</p>
                </div>
              </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useCartStore } from '../stores/cart'
import { useProductStore } from '../stores/product'
import api from '../services/api'

const cartStore = useCartStore()
const productStore = useProductStore()
const health = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    // 并行获取健康状态和特色商品
    const [healthResponse] = await Promise.allSettled([
      api.health.check(),
      productStore.fetchFeaturedProducts()
    ])
    
    if (healthResponse.status === 'fulfilled') {
      health.value = healthResponse.value
    } else {
      console.error('Failed to fetch health:', healthResponse.reason)
    }
  } catch (error) {
    console.error('Failed to load page:', error)
  } finally {
    loading.value = false
  }
})

const addToCart = (product) => {
  cartStore.addItem(product, 1)
  ElMessage.success(`${product.name} added to cart!`)
}

const handleImageError = (event) => {
  event.target.src = 'https://via.placeholder.com/300x200/CCCCCC/FFFFFF?text=Product'
}
</script>

<style scoped>
.home {
  padding: 20px;
}
.el-header {
  text-align: center;
  padding: 40px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  margin-bottom: 24px;
}
</style>