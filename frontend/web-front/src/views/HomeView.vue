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
              <el-row :gutter="16">
                <el-col :span="8" v-for="product in featuredProducts" :key="product.id">
                  <el-card shadow="hover">
                    <img :src="product.image" :alt="product.name" style="width:100%;height:200px;object-fit:cover" />
                    <h3>{{ product.name }}</h3>
                    <p>{{ product.description }}</p>
                    <div style="display:flex;justify-content:space-between;align-items:center">
                      <span style="font-weight:bold;color:#e4393c">${{ product.price }}</span>
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
              <div v-if="health">
                <p><strong>Backend Status:</strong> <el-tag type="success">{{ health.status }}</el-tag></p>
                <p><strong>Service:</strong> {{ health.service }}</p>
                <p><strong>Version:</strong> {{ health.version }}</p>
              </div>
              <div v-else>
                <p>Connecting to backend...</p>
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

const cartStore = useCartStore()
const health = ref(null)

const featuredProducts = ref([
  { id: 1, name: 'Premium Coffee', description: 'Rich Arabica coffee beans', price: 24.99, image: 'https://via.placeholder.com/300x200/8B4513/FFFFFF?text=Coffee' },
  { id: 2, name: 'Organic Apples', description: 'Fresh organic apples', price: 5.99, image: 'https://via.placeholder.com/300x200/FF6347/FFFFFF?text=Apples' },
  { id: 3, name: 'Wireless Headphones', description: 'Noise-cancelling headphones', price: 89.99, image: 'https://via.placeholder.com/300x200/4682B4/FFFFFF?text=Headphones' },
])

onMounted(() => {
  fetch('/api/health')
    .then(res => res.json())
    .then(data => health.value = data)
    .catch(err => console.error('Failed to fetch health:', err))
})

const addToCart = (product) => {
  cartStore.addItem(product, 1)
  ElMessage.success(`${product.name} added to cart!`)
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