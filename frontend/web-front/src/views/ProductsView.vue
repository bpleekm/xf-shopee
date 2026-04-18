<template>
  <div class="products">
    <el-container>
      <el-header style="margin-bottom: 24px;">
        <h1>Product Catalog</h1>
        <p>Browse our wide selection of products</p>
      </el-header>
      <el-main>
        <!-- Search and Filter Controls -->
        <el-row :gutter="24" style="margin-bottom: 24px;">
          <el-col :span="24">
            <div class="controls-container">
              <!-- Search Input -->
              <el-input
                v-model="searchQuery"
                placeholder="Search products..."
                style="max-width: 300px;"
                clearable
                class="control-item"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>

              <!-- Category Filter -->
              <el-select
                v-model="selectedCategory"
                placeholder="All Categories"
                clearable
                style="width: 200px;"
                class="control-item"
                @change="handleCategoryChange"
              >
                <el-option label="All Categories" value="" />
                <el-option
                  v-for="category in categories"
                  :key="category"
                  :label="category"
                  :value="category"
                />
              </el-select>

              <!-- Sort Options -->
              <el-select
                v-model="sortOption"
                placeholder="Sort by"
                style="width: 200px;"
                class="control-item"
              >
                <el-option label="Relevance" value="relevance" />
                <el-option label="Price: Low to High" value="price_asc" />
                <el-option label="Price: High to Low" value="price_desc" />
                <el-option label="Name: A to Z" value="name_asc" />
                <el-option label="Name: Z to A" value="name_desc" />
                <el-option label="Newest First" value="newest" />
                <el-option label="Best Selling" value="popular" />
              </el-select>

              <!-- View Toggle -->
              <div class="view-toggle control-item">
                <el-button-group>
                  <el-button
                    :type="viewMode === 'grid' ? 'primary' : 'default'"
                    @click="viewMode = 'grid'"
                    title="Grid View"
                  >
                    <el-icon><Grid /></el-icon>
                  </el-button>
                  <el-button
                    :type="viewMode === 'list' ? 'primary' : 'default'"
                    @click="viewMode = 'list'"
                    title="List View"
                  >
                    <el-icon><List /></el-icon>
                  </el-button>
                </el-button-group>
              </div>

              <!-- Filter Button (Mobile) -->
              <el-button
                type="default"
                class="mobile-filter-btn"
                @click="showMobileFilters = !showMobileFilters"
              >
                <el-icon><Filter /></el-icon>
                Filters
              </el-button>
            </div>

            <!-- Mobile Filters -->
            <div v-if="showMobileFilters" class="mobile-filters">
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-select
                    v-model="selectedCategory"
                    placeholder="Category"
                    clearable
                    style="width: 100%; margin-bottom: 12px;"
                    @change="handleCategoryChange"
                  >
                    <el-option label="All Categories" value="" />
                    <el-option
                      v-for="category in categories"
                      :key="category"
                      :label="category"
                      :value="category"
                    />
                  </el-select>
                </el-col>
                <el-col :span="12">
                  <el-select
                    v-model="sortOption"
                    placeholder="Sort by"
                    style="width: 100%;"
                  >
                    <el-option label="Relevance" value="relevance" />
                    <el-option label="Price: Low to High" value="price_asc" />
                    <el-option label="Price: High to Low" value="price_desc" />
                    <el-option label="Newest First" value="newest" />
                  </el-select>
                </el-col>
              </el-row>
            </div>
          </el-col>
        </el-row>

        <!-- Product Count and Results -->
        <div class="results-info" style="margin-bottom: 24px;">
          <span class="result-count">
            Showing {{ paginatedProducts.length }} of {{ filteredProducts.length }} products
          </span>
          <span v-if="selectedCategory" class="current-filter">
            <el-tag size="small" closable @close="clearCategory">
              Category: {{ selectedCategory }}
            </el-tag>
          </span>
        </div>

        <!-- Loading State -->
        <div v-if="productStore.loading && productStore.products.length === 0" style="text-align: center; padding: 40px;">
          <el-skeleton :rows="6" animated />
        </div>

        <!-- Products Grid/List View -->
        <template v-else>
          <!-- Grid View -->
          <div v-if="viewMode === 'grid'" class="products-grid">
            <el-row :gutter="24">
              <el-col
                :xs="24"
                :sm="12"
                :md="8"
                :lg="6"
                v-for="product in paginatedProducts"
                :key="product.id"
                style="margin-bottom: 24px;"
              >
                <product-card :product="product" @add-to-cart="addToCart" />
              </el-col>
            </el-row>
          </div>

          <!-- List View -->
          <div v-else class="products-list">
            <el-card
              v-for="product in paginatedProducts"
              :key="product.id"
              class="product-list-item"
              shadow="hover"
              style="margin-bottom: 16px;"
            >
              <el-row :gutter="24" align="middle">
                <el-col :span="4">
                  <img
                    :src="product.image || defaultImage"
                    :alt="product.name"
                    class="list-product-image"
                    @error="handleImageError"
                  />
                </el-col>
                <el-col :span="12">
                  <h3 style="margin: 0 0 8px 0;">{{ product.name }}</h3>
                  <p style="color:#666;font-size:14px;margin-bottom:8px;line-height:1.5;">
                    {{ product.description || 'No description available' }}
                  </p>
                  <div v-if="product.category" style="margin-bottom: 8px;">
                    <el-tag size="small" type="info">{{ product.category }}</el-tag>
                  </div>
                  <div v-if="product.stock <= 5 && product.stock > 0">
                    <el-tag size="small" type="warning">Only {{ product.stock }} left</el-tag>
                  </div>
                </el-col>
                <el-col :span="4" style="text-align: center;">
                  <div class="list-product-price">${{ product.price?.toFixed(2) || '0.00' }}</div>
                  <div v-if="product.originalPrice" class="list-original-price">
                    <s>${{ product.originalPrice.toFixed(2) }}</s>
                  </div>
                </el-col>
                <el-col :span="4" style="text-align: right;">
                  <el-button type="primary" @click="addToCart(product)">
                    Add to Cart
                  </el-button>
                  <el-button type="text" style="margin-left: 8px;" @click="viewProduct(product)">
                    <el-icon><View /></el-icon>
                  </el-button>
                </el-col>
              </el-row>
            </el-card>
          </div>

          <!-- No Results -->
          <el-empty 
            v-if="filteredProducts.length === 0" 
            description="No products found" 
            style="margin-top: 48px;"
          >
            <template #description>
              <p>No products match your search criteria.</p>
              <el-button type="primary" @click="clearFilters">Clear Filters</el-button>
            </template>
          </el-empty>

          <!-- Pagination -->
          <div v-if="filteredProducts.length > 0" class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[12, 24, 48, 96]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredProducts.length"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </template>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Grid, List, Filter, View } from '@element-plus/icons-vue'
import { useCartStore } from '../stores/cart'
import { useProductStore } from '../stores/product'
import { useRouter } from 'vue-router'
import ProductCard from '../components/product/ProductCard.vue'

const router = useRouter()
const cartStore = useCartStore()
const productStore = useProductStore()

// Reactive state
const searchQuery = ref('')
const selectedCategory = ref('')
const sortOption = ref('relevance')
const viewMode = ref('grid')
const showMobileFilters = ref(false)
const currentPage = ref(1)
const pageSize = ref(12)
const defaultImage = ref('https://via.placeholder.com/300x200/CCCCCC/FFFFFF?text=Product')

// Load products and categories
onMounted(async () => {
  await productStore.fetchProducts()
  await productStore.fetchCategories()
})

// Watch search query
watch(searchQuery, async (newQuery) => {
  currentPage.value = 1 // Reset to first page
  if (newQuery.trim()) {
    await productStore.searchProducts(newQuery)
  } else {
    await productStore.fetchProducts()
  }
})

// Watch category selection
watch(selectedCategory, async (newCategory) => {
  currentPage.value = 1 // Reset to first page
  if (newCategory) {
    await productStore.fetchProductsByCategory(newCategory)
  } else {
    await productStore.fetchProducts()
  }
})

// Watch sort option
watch(sortOption, () => {
  // Sorting is handled in computed property
})

// Categories from store
const categories = computed(() => productStore.categories)

// Filter products based on search query and category
const filteredProducts = computed(() => {
  let result = productStore.products

  // Apply search filter (already done by store, but double-check)
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(product =>
      product.name?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query)
    )
  }

  // Apply category filter (already done by store, but double-check)
  if (selectedCategory.value) {
    result = result.filter(product => product.category === selectedCategory.value)
  }

  // Apply sorting
  switch (sortOption.value) {
    case 'price_asc':
      result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0))
      break
    case 'price_desc':
      result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0))
      break
    case 'name_asc':
      result = [...result].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      break
    case 'name_desc':
      result = [...result].sort((a, b) => (b.name || '').localeCompare(a.name || ''))
      break
    case 'newest':
      result = [...result].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      break
    case 'popular':
      // Placeholder for popularity - sort by salesCount or views if available
      result = [...result].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      break
    case 'relevance':
    default:
      // Keep original order (already relevance from search)
      break
  }

  return result
})

// Paginated products
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredProducts.value.slice(start, end)
})

// Event handlers
const addToCart = (product) => {
  cartStore.addItem(product, 1)
  ElMessage.success(`${product.name} added to cart!`)
}

const handleImageError = (event) => {
  event.target.src = defaultImage.value
}

const handleCategoryChange = (category) => {
  selectedCategory.value = category
}

const clearCategory = () => {
  selectedCategory.value = ''
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  sortOption.value = 'relevance'
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

const viewProduct = (product) => {
  router.push(`/products/${product.id}`)
}

</script>

<style scoped>
.products {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
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

/* Controls */
.controls-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.control-item {
  flex-shrink: 0;
}

.view-toggle {
  margin-left: auto;
}

.mobile-filter-btn {
  display: none;
}

/* Mobile filters */
.mobile-filters {
  margin-top: 16px;
  padding: 16px;
  background: #f8f8f8;
  border-radius: 8px;
}

/* Results info */
.results-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.result-count {
  font-size: 14px;
  color: #666;
}

.current-filter {
  display: inline-flex;
  align-items: center;
}

/* List view */
.products-list {
  margin-bottom: 24px;
}

.product-list-item {
  cursor: pointer;
  transition: transform 0.2s;
}

.product-list-item:hover {
  transform: translateY(-2px);
}

.list-product-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
}

.list-product-price {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.list-original-price {
  font-size: 14px;
  color: #999;
}

/* Pagination */
.pagination-container {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

/* Responsive */
@media (max-width: 768px) {
  .controls-container {
    gap: 12px;
  }
  
  .control-item {
    flex: 1 1 calc(50% - 12px);
    min-width: 0;
  }
  
  .view-toggle {
    margin-left: 0;
    order: 1;
  }
  
  .mobile-filter-btn {
    display: inline-flex;
    order: 2;
    flex: 1 1 100%;
    margin-top: 12px;
    justify-content: center;
  }
  
  .product-list-item .el-col {
    margin-bottom: 12px;
  }
  
  .list-product-image {
    height: 100px;
  }
}

@media (max-width: 576px) {
  .products {
    padding: 12px;
  }
  
  .el-header h1 {
    font-size: 24px;
  }
  
  .el-header p {
    font-size: 14px;
  }
  
  .control-item {
    flex: 1 1 100%;
  }
  
  .products-grid .el-col {
    width: 100%;
  }
}
</style>