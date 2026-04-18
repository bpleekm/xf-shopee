<template>
  <div class="product-detail">
    <el-container>
      <el-header style="margin-bottom: 24px;">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">Home</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/products' }">Products</el-breadcrumb-item>
          <el-breadcrumb-item>{{ product?.name || 'Product Details' }}</el-breadcrumb-item>
        </el-breadcrumb>
      </el-header>
      <el-main>
        <div v-if="loading" style="text-align: center; padding: 40px;">
          <el-skeleton :rows="8" animated />
        </div>
        
        <div v-else-if="product" class="product-container">
          <el-row :gutter="32">
            <!-- Product Images -->
            <el-col :span="12">
              <el-card class="product-images">
                <div class="main-image">
                  <img 
                    :src="currentImage || product.image || defaultImage" 
                    :alt="product.name" 
                    class="product-main-image"
                    @error="handleImageError"
                  />
                </div>
                <div v-if="productImages.length > 1" class="thumbnail-list">
                  <div 
                    v-for="(img, index) in productImages" 
                    :key="index"
                    :class="['thumbnail', { active: currentImageIndex === index }]"
                    @click="selectImage(index)"
                  >
                    <img :src="img" :alt="`${product.name} image ${index + 1}`" />
                  </div>
                </div>
                
                <div class="product-badges">
                  <el-tag v-if="product.category" type="info" size="large">
                    {{ product.category }}
                  </el-tag>
                  <el-tag v-if="product.stock <= 5 && product.stock > 0" type="warning" size="large">
                    Low Stock ({{ product.stock }} left)
                  </el-tag>
                  <el-tag v-if="product.stock === 0" type="danger" size="large">
                    Out of Stock
                  </el-tag>
                  <el-tag v-if="product.discount" type="danger" size="large">
                    {{ product.discount }}% OFF
                  </el-tag>
                </div>
              </el-card>
            </el-col>

            <!-- Product Info -->
            <el-col :span="12">
              <el-card class="product-info">
                <h1 class="product-name">{{ product.name }}</h1>
                
                <div class="product-meta">
                  <div class="product-rating" v-if="product.rating">
                    <el-rate 
                      v-model="product.rating" 
                      disabled 
                      show-score 
                      text-color="#ff9900" 
                      score-template="{value}"
                      class="rating-stars"
                    />
                    <span class="rating-count">({{ product.reviewCount || 0 }} reviews)</span>
                    <el-link type="primary" style="margin-left: 16px;">Write a review</el-link>
                  </div>
                  
                  <div class="product-sku">
                    <span class="sku-label">SKU:</span>
                    <span class="sku-value">{{ product.sku || product.id }}</span>
                  </div>
                </div>
                
                <div class="product-price-section">
                  <div class="price-current">${{ product.price?.toFixed(2) || '0.00' }}</div>
                  <div v-if="product.originalPrice" class="price-original">
                    <span class="original-price">${{ product.originalPrice.toFixed(2) }}</span>
                    <span class="price-save">Save ${{ (product.originalPrice - product.price).toFixed(2) }}</span>
                  </div>
                </div>
                
                <div class="product-description">
                  <h3>Description</h3>
                  <p>{{ product.description || 'No description available for this product.' }}</p>
                  
                  <div v-if="product.specifications && Object.keys(product.specifications).length > 0" class="product-specs">
                    <h4>Specifications</h4>
                    <el-table :data="specificationsTable" border size="small">
                      <el-table-column prop="key" label="Specification" width="200" />
                      <el-table-column prop="value" label="Value" />
                    </el-table>
                  </div>
                </div>
                
                <div class="product-actions">
                  <div class="quantity-selector">
                    <span class="quantity-label">Quantity:</span>
                    <el-input-number 
                      v-model="quantity" 
                      :min="1" 
                      :max="product.stock || 99" 
                      size="large"
                      :disabled="product.stock === 0"
                    />
                    <span v-if="product.stock > 0" class="stock-info">
                      {{ product.stock }} available
                    </span>
                  </div>
                  
                  <div class="action-buttons">
                    <el-button 
                      type="primary" 
                      size="large" 
                      :loading="addingToCart"
                      :disabled="product.stock === 0"
                      @click="addToCart"
                      class="add-to-cart-btn"
                    >
                      <el-icon><ShoppingCart /></el-icon>
                      {{ product.stock === 0 ? 'Out of Stock' : 'Add to Cart' }}
                    </el-button>
                    
                    <el-button 
                      type="default" 
                      size="large"
                      @click="toggleWishlist"
                      :class="{ 'in-wishlist': isInWishlist }"
                    >
                      <el-icon><Star /></el-icon>
                      {{ isInWishlist ? 'In Wishlist' : 'Add to Wishlist' }}
                    </el-button>
                    
                    <el-button type="text" size="large" @click="shareProduct">
                      <el-icon><Share /></el-icon>
                      Share
                    </el-button>
                  </div>
                </div>
                
                <div class="product-shipping">
                  <h4>Shipping & Returns</h4>
                  <ul>
                    <li>Free shipping on orders over $50</li>
                    <li>Estimated delivery: 3-7 business days</li>
                    <li>30-day return policy</li>
                    <li>Free returns for damaged or defective items</li>
                  </ul>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <!-- Related Products -->
          <div v-if="relatedProducts.length > 0" class="related-products">
            <h2>Related Products</h2>
            <el-row :gutter="24">
              <el-col :span="6" v-for="related in relatedProducts" :key="related.id">
                <product-card :product="related" />
              </el-col>
            </el-row>
          </div>
        </div>
        
        <el-empty v-else description="Product not found" />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart, Star, Share } from '@element-plus/icons-vue'
import ProductCard from '../components/product/ProductCard.vue'
import { useProductStore } from '../stores/product'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const cartStore = useCartStore()

const product = ref(null)
const loading = ref(true)
const quantity = ref(1)
const addingToCart = ref(false)
const isInWishlist = ref(false)
const currentImageIndex = ref(0)
const defaultImage = 'https://via.placeholder.com/600x400/CCCCCC/FFFFFF?text=Product'

// 从路由参数获取产品ID
const productId = computed(() => route.params.id)

// 产品图片
const productImages = computed(() => {
  if (!product.value) return []
  const images = []
  if (product.value.image) images.push(product.value.image)
  // 如果有更多图片，可以添加
  if (product.value.images && Array.isArray(product.value.images)) {
    images.push(...product.value.images)
  }
  return images.length > 0 ? images : [defaultImage]
})

const currentImage = computed(() => productImages.value[currentImageIndex.value])

// 规格表格
const specificationsTable = computed(() => {
  if (!product.value || !product.value.specifications) return []
  return Object.entries(product.value.specifications).map(([key, value]) => ({
    key,
    value: String(value)
  }))
})

// 相关产品
const relatedProducts = computed(() => {
  if (!product.value) return []
  return productStore.getRelatedProducts(product.value.id, 4)
})

// 加载产品详情
const loadProduct = async () => {
  loading.value = true
  try {
    const fetchedProduct = await productStore.fetchProductById(productId.value)
    if (fetchedProduct) {
      product.value = fetchedProduct
    } else {
      ElMessage.error('Product not found')
      router.push('/products')
    }
  } catch (error) {
    ElMessage.error('Failed to load product details')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 添加到购物车
const addToCart = async () => {
  if (!product.value || product.value.stock === 0) return
  
  addingToCart.value = true
  try {
    await cartStore.addItem(product.value, quantity.value)
    ElMessage.success(`${quantity.value} × ${product.value.name} added to cart!`)
  } catch (error) {
    ElMessage.error('Failed to add item to cart')
  } finally {
    addingToCart.value = false
  }
}

// 切换收藏
const toggleWishlist = () => {
  isInWishlist.value = !isInWishlist.value
  ElMessage.success(isInWishlist.value ? 
    'Added to wishlist' : 
    'Removed from wishlist'
  )
}

// 分享产品
const shareProduct = () => {
  if (navigator.share) {
    navigator.share({
      title: product.value.name,
      text: product.value.description,
      url: window.location.href,
    })
  } else {
    // 复制链接到剪贴板
    navigator.clipboard.writeText(window.location.href)
    ElMessage.success('Product link copied to clipboard')
  }
}

// 选择图片
const selectImage = (index) => {
  currentImageIndex.value = index
}

// 图片加载错误处理
const handleImageError = (event) => {
  event.target.src = defaultImage
}

onMounted(() => {
  if (productId.value) {
    loadProduct()
  } else {
    ElMessage.error('Product ID not specified')
    router.push('/products')
  }
})
</script>

<style scoped>
.product-detail {
  padding: 20px;
}

.product-container {
  max-width: 1200px;
  margin: 0 auto;
}

.product-images {
  margin-bottom: 24px;
}

.main-image {
  width: 100%;
  height: 400px;
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f9fa;
}

.product-main-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.product-main-image:hover {
  transform: scale(1.05);
}

.thumbnail-list {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.thumbnail {
  width: 60px;
  height: 60px;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.thumbnail:hover {
  border-color: #409EFF;
}

.thumbnail.active {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.product-info {
  height: 100%;
}

.product-name {
  margin: 0 0 16px 0;
  font-size: 28px;
  font-weight: bold;
  color: #333;
  line-height: 1.3;
}

.product-meta {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.rating-stars {
  margin-right: 8px;
}

.rating-count {
  color: #666;
  font-size: 14px;
}

.product-sku {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.sku-label {
  font-weight: 500;
}

.sku-value {
  font-family: monospace;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.product-price-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.price-current {
  font-size: 36px;
  font-weight: bold;
  color: #e4393c;
  margin-bottom: 8px;
}

.price-original {
  display: flex;
  align-items: center;
  gap: 12px;
}

.original-price {
  font-size: 18px;
  color: #999;
  text-decoration: line-through;
}

.price-save {
  font-size: 14px;
  color: #fff;
  background-color: #e4393c;
  padding: 4px 12px;
  border-radius: 20px;
}

.product-description {
  margin-bottom: 32px;
}

.product-description h3 {
  margin-bottom: 12px;
  font-size: 20px;
  color: #333;
}

.product-description p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
}

.product-specs {
  margin-top: 20px;
}

.product-specs h4 {
  margin-bottom: 12px;
  font-size: 16px;
  color: #333;
}

.product-actions {
  margin-bottom: 32px;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 8px;
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.quantity-label {
  font-weight: 500;
  color: #333;
}

.stock-info {
  color: #666;
  font-size: 14px;
  margin-left: 12px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.add-to-cart-btn {
  flex: 1;
  min-width: 200px;
}

.in-wishlist {
  border-color: #ff4d4f !important;
  color: #ff4d4f !important;
}

.in-wishlist:hover {
  background: rgba(255, 77, 79, 0.1) !important;
}

.product-shipping {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.product-shipping h4 {
  margin-bottom: 12px;
  font-size: 18px;
  color: #333;
}

.product-shipping ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.product-shipping li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.related-products {
  margin-top: 48px;
}

.related-products h2 {
  margin-bottom: 24px;
  font-size: 24px;
  color: #333;
  text-align: center;
}

/* Responsive Design */
@media (max-width: 992px) {
  .product-container .el-col {
    span: 24 !important;
    margin-bottom: 24px;
  }
  
  .main-image {
    height: 300px;
  }
  
  .product-name {
    font-size: 24px;
  }
  
  .price-current {
    font-size: 28px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .add-to-cart-btn {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .product-detail {
    padding: 12px;
  }
  
  .main-image {
    height: 250px;
  }
  
  .product-name {
    font-size: 20px;
  }
  
  .product-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>