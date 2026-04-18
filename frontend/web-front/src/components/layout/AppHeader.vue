<template>
  <el-header class="app-header">
    <el-row align="middle" class="header-container">
      <!-- Logo -->
      <el-col :span="4" class="logo-col">
        <router-link to="/" class="logo-link">
          <h1 class="logo-text">XF Shopee</h1>
        </router-link>
      </el-col>

      <!-- Navigation Menu -->
      <el-col :span="16" class="nav-col">
        <el-menu
          :default-active="activeMenu"
          mode="horizontal"
          class="nav-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>Home</span>
          </el-menu-item>
          <el-menu-item index="/products">
            <el-icon><ShoppingBag /></el-icon>
            <span>Products</span>
          </el-menu-item>
          <el-menu-item index="/cart" class="cart-menu-item">
            <el-icon><ShoppingCart /></el-icon>
            <span>Cart</span>
            <el-badge 
              v-if="cartStore.totalItems > 0" 
              :value="cartStore.totalItems" 
              :max="99" 
              class="cart-badge"
            />
          </el-menu-item>
          <el-menu-item index="/orders">
            <el-icon><Document /></el-icon>
            <span>Orders</span>
          </el-menu-item>
        </el-menu>
      </el-col>

      <!-- User Actions -->
      <el-col :span="4" class="actions-col">
        <div class="user-actions">
          <!-- Search (Desktop) -->
          <el-popover
            placement="bottom"
            :width="300"
            trigger="click"
            v-model:visible="searchVisible"
          >
            <template #reference>
              <el-button type="text" class="action-btn">
                <el-icon size="20"><Search /></el-icon>
              </el-button>
            </template>
            <div class="search-popover">
              <el-input
                v-model="searchQuery"
                placeholder="Search products..."
                @keyup.enter="handleSearch"
                clearable
              >
                <template #suffix>
                  <el-icon @click="handleSearch"><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </el-popover>

          <!-- User Dropdown -->
          <el-dropdown v-if="userStore.isAuthenticated" @command="handleUserCommand">
            <div class="user-dropdown-trigger">
              <el-avatar :size="32" :src="userStore.user?.avatar" class="user-avatar">
                {{ userStore.user?.username?.charAt(0).toUpperCase() || 'U' }}
              </el-avatar>
              <span class="user-name">{{ userStore.user?.username || 'User' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  <span>Profile</span>
                </el-dropdown-item>
                <el-dropdown-item command="orders">
                  <el-icon><Document /></el-icon>
                  <span>My Orders</span>
                </el-dropdown-item>
                <el-dropdown-item command="settings" divided>
                  <el-icon><Setting /></el-icon>
                  <span>Settings</span>
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  <span>Logout</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- Login Button (if not authenticated) -->
          <template v-else>
            <el-button type="text" class="login-btn" @click="handleLogin">
              <el-icon><User /></el-icon>
              <span>Login</span>
            </el-button>
          </template>
        </div>
      </el-col>
    </el-row>

    <!-- Mobile Search Bar -->
    <div v-if="showMobileSearch" class="mobile-search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="Search products..."
        @keyup.enter="handleSearch"
        size="large"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>
  </el-header>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  HomeFilled,
  ShoppingBag,
  ShoppingCart,
  Document,
  User,
  Setting,
  SwitchButton,
  Search,
  ArrowDown
} from '@element-plus/icons-vue'
import { useCartStore } from '../../stores/cart'
import { useUserStore } from '../../stores/user'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const searchVisible = ref(false)
const searchQuery = ref('')
const showMobileSearch = ref(false)

const activeMenu = computed(() => route.path)

const handleMenuSelect = (index) => {
  router.push(index)
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push(`/products?search=${encodeURIComponent(searchQuery.value)}`)
    searchVisible.value = false
    searchQuery.value = ''
  }
}

const handleUserCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'orders':
      router.push('/orders')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      userStore.logout()
      router.push('/')
      break
  }
}

const handleLogin = () => {
  // TODO: Implement login modal or page
  ElMessage.info('Login feature coming soon')
  // router.push('/login')
}
</script>

<style scoped>
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0 !important;
  height: 64px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-container {
  height: 100%;
  padding: 0 24px;
}

.logo-col {
  display: flex;
  align-items: center;
}

.logo-link {
  text-decoration: none;
  color: white;
}

.logo-text {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(90deg, #ffffff, #e6fffb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-col {
  display: flex;
  justify-content: center;
}

.nav-menu {
  background: transparent;
  border-bottom: none;
  height: 64px;
}

.nav-menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 16px;
  height: 64px;
  line-height: 64px;
  margin: 0 4px;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.nav-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  border-bottom-color: rgba(255, 255, 255, 0.3);
}

.nav-menu :deep(.el-menu-item.is-active) {
  color: white !important;
  border-bottom-color: white !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

.nav-menu :deep(.el-icon) {
  margin-right: 6px;
}

.cart-menu-item {
  position: relative;
}

.cart-badge {
  position: absolute;
  top: 12px;
  right: 8px;
}

.actions-col {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-btn {
  color: white !important;
  padding: 8px;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

.user-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 20px;
  transition: background 0.3s ease;
}

.user-dropdown-trigger:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-avatar {
  background: linear-gradient(135deg, #36d1dc, #5b86e5);
}

.user-name {
  color: white;
  font-size: 14px;
  font-weight: 500;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.login-btn {
  color: white !important;
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}

.login-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

.search-popover {
  padding: 8px;
}

.mobile-search-bar {
  display: none;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
}

/* Responsive Design */
@media (max-width: 992px) {
  .nav-col {
    display: none;
  }
  
  .logo-col {
    span: 12;
  }
  
  .actions-col {
    span: 12;
    justify-content: flex-end;
  }
  
  .mobile-search-bar {
    display: block;
  }
}

@media (max-width: 768px) {
  .header-container {
    padding: 0 16px;
  }
  
  .user-name {
    display: none;
  }
  
  .logo-text {
    font-size: 20px;
  }
}
</style>