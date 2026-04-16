<template>
  <div class="products">
    <el-container>
      <el-header style="margin-bottom: 24px;">
        <h1>Product Catalog</h1>
        <p>Browse our wide selection of products</p>
      </el-header>
      <el-main>
        <el-row :gutter="24">
          <el-col :span="24">
            <el-input
              v-model="searchQuery"
              placeholder="Search products..."
              style="max-width: 400px; margin-bottom: 24px;"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="6" v-for="product in filteredProducts" :key="product.id">
            <el-card shadow="hover" style="height: 100%;">
              <img 
                :src="product.image" 
                :alt="product.name" 
                style="width:100%;height:180px;object-fit:cover;border-radius:4px;margin-bottom:16px" 
              />
              <h3 style="margin: 0 0 8px 0;">{{ product.name }}</h3>
              <p style="color:#666;font-size:14px;margin-bottom:12px;min-height:40px;">{{ product.description }}</p>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-weight:bold;color:#e4393c;font-size:20px;">${{ product.price }}</span>
                <el-button type="primary" size="small" @click="addToCart(product)">
                  Add to Cart
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-empty 
          v-if="filteredProducts.length === 0" 
          description="No products found" 
          style="margin-top: 48px;"
        />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useCartStore } from '../stores/cart'

const cartStore = useCartStore()
const searchQuery = ref('')

const products = ref([
  { id: 1, name: 'Premium Coffee', description: 'Rich Arabica coffee beans', price: 24.99, category: 'Food', image: 'https://via.placeholder.com/300x200/8B4513/FFFFFF?text=Coffee' },
  { id: 2, name: 'Organic Apples', description: 'Fresh organic apples', price: 5.99, category: 'Food', image: 'https://via.placeholder.com/300x200/FF6347/FFFFFF?text=Apples' },
  { id: 3, name: 'Wireless Headphones', description: 'Noise-cancelling headphones', price: 89.99, category: 'Electronics', image: 'https://via.placeholder.com/300x200/4682B4/FFFFFF?text=Headphones' },
  { id: 4, name: 'Yoga Mat', description: 'Non-slip yoga mat', price: 34.99, category: 'Fitness', image: 'https://via.placeholder.com/300x200/32CD32/FFFFFF?text=Yoga+Mat' },
  { id: 5, name: 'Desk Lamp', description: 'LED desk lamp with adjustable brightness', price: 45.99, category: 'Home', image: 'https://via.placeholder.com/300x200/FFD700/000000?text=Lamp' },
  { id: 6, name: 'Water Bottle', description: 'Insulated stainless steel water bottle', price: 28.99, category: 'Fitness', image: 'https://via.placeholder.com/300x200/1E90FF/FFFFFF?text=Bottle' },
  { id: 7, name: 'Notebook', description: 'Leather-bound notebook', price: 18.99, category: 'Office', image: 'https://via.placeholder.com/300x200/8B7355/FFFFFF?text=Notebook' },
  { id: 8, name: 'Bluetooth Speaker', description: 'Portable waterproof speaker', price: 79.99, category: 'Electronics', image: 'https://via.placeholder.com/300x200/9370DB/FFFFFF?text=Speaker' },
])

const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) return products.value
  const query = searchQuery.value.toLowerCase()
  return products.value.filter(p => 
    p.name.toLowerCase().includes(query) || 
    p.description.toLowerCase().includes(query) ||
    p.category.toLowerCase().includes(query)
  )
})

const addToCart = (product) => {
  cartStore.addItem(product, 1)
  ElMessage.success(`${product.name} added to cart!`)
}
</script>

<style scoped>
.products {
  padding: 20px;
}

.el-header {
  text-align: center;
  padding: 20px 0;
}

.el-header h1 {
  margin: 0;
  font-size: 32px;
  color: #333;
}

.el-header p {
  margin: 8px 0 0;
  color: #666;
  font-size: 16px;
}
</style>