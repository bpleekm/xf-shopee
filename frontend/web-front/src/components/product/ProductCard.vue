<template>
  <el-card shadow="hover" :class="['product-card', { 'product-card--featured': featured }]">
    <div class="product-image-container">
      <img 
        :src="product.image || defaultImage" 
        :alt="product.name" 
        class="product-image"
        @error="handleImageError"
      />
      <el-tag v-if="product.category" class="product-category" size="small" type="info">
        {{ product.category }}
      </el-tag>
      <el-tag v-if="product.stock <= 5 && product.stock > 0" class="product-stock" size="small" type="warning">
        Low Stock
      </el-tag>
      <el-tag v-if="product.stock === 0" class="product-stock" size="small" type="danger">
        Out of Stock
      </el-tag>
    </div>
    
    <div class="product-content">
      <h3 class="product-name">{{ product.name }}</h3>
      <p class="product-description">{{ product.description || 'No description available' }}</p>
      
      <div class="product-footer">
        <div class="product-price">
          <span class="price-current">${{ product.price?.toFixed(2) || '0.00' }}</span>
          <span v-if="product.originalPrice" class="price-original">${{ product.originalPrice.toFixed(2) }}</span>
          <span v-if="product.discount" class="price-discount">{{ product.discount }}% OFF</span>
        </div>
        
        <div class="product-actions">
          <el-button 
            type="primary" 
            size="small" 
            :loading="addingToCart" 
            :disabled="product.stock === 0"
            @click="handleAddToCart"
          >
            <el-icon v-if="!addingToCart"><ShoppingCart /></el-icon>
            {{ product.stock === 0 ? 'Out of Stock' : 'Add to Cart' }}
          </el-button>
          <el-button 
            v-if="showWishlist" 
            type="text" 
            size="small" 
            class="wishlist-btn"
            @click="handleWishlist"
          >
            <el-icon :color="isInWishlist ? '#ff4d4f' : '#999'"><Star /></el-icon>
          </el-button>
        </div>
      </div>
      
      <div v-if="showRating" class="product-rating">
        <el-rate 
          v-model="product.rating" 
          disabled 
          show-score 
          text-color="#ff9900" 
          score-template="{value} stars"
        />
        <span class="rating-count">({{ product.reviewCount || 0 }})</span>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { ShoppingCart, Star } from '@element-plus/icons-vue'
import { useCartStore } from '../../stores/cart'

const props = defineProps({
  product: {
    type: Object,
    required: true,
    default: () => ({})
  },
  featured: {
    type: Boolean,
    default: false
  },
  showWishlist: {
    type: Boolean,
    default: false
  },
  showRating: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['add-to-cart', 'add-to-wishlist'])

const cartStore = useCartStore()
const addingToCart = ref(false)
const defaultImage = 'https://via.placeholder.com/300x200/CCCCCC/FFFFFF?text=Product'
const isInWishlist = ref(false)

const handleImageError = (event) => {
  event.target.src = defaultImage
}

const handleAddToCart = async () => {
  if (props.product.stock === 0) {
    ElMessage.warning('This product is out of stock')
    return
  }
  
  addingToCart.value = true
  try {
    await cartStore.addItem(props.product, 1)
    emit('add-to-cart', props.product)
    ElMessage.success(`${props.product.name} added to cart!`)
  } catch (error) {
    ElMessage.error('Failed to add item to cart')
  } finally {
    addingToCart.value = false
  }
}

const handleWishlist = () => {
  isInWishlist.value = !isInWishlist.value
  emit('add-to-wishlist', { product: props.product, added: isInWishlist.value })
  
  if (isInWishlist.value) {
    ElMessage.success(`${props.product.name} added to wishlist`)
  } else {
    ElMessage.info(`${props.product.name} removed from wishlist`)
  }
}
</script>

<style scoped>
.product-card {
  height: 100%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid #f0f0f0;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.product-card--featured {
  border: 2px solid #409EFF;
}

.product-image-container {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  border-radius: 4px 4px 0 0;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.product-category {
  position: absolute;
  top: 8px;
  left: 8px;
}

.product-stock {
  position: absolute;
  top: 8px;
  right: 8px;
}

.product-content {
  padding: 16px;
}

.product-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.product-description {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  height: 42px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-current {
  font-size: 20px;
  font-weight: bold;
  color: #e4393c;
}

.price-original {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}

.price-discount {
  font-size: 12px;
  color: #fff;
  background-color: #e4393c;
  padding: 2px 6px;
  border-radius: 10px;
}

.product-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wishlist-btn {
  padding: 6px;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.rating-count {
  font-size: 12px;
  color: #999;
}
</style>