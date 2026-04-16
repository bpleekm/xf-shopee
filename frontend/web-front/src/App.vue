<template>
  <div id="app">
    <el-container>
      <el-header style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0 20px;">
        <el-row align="middle" style="height: 100%;">
          <el-col :span="4">
            <h1 style="margin: 0; font-size: 24px;">XF Shopee</h1>
          </el-col>
          <el-col :span="16">
            <el-menu
              :default-active="activeMenu"
              mode="horizontal"
              background-color="transparent"
              text-color="rgba(255,255,255,0.8)"
              active-text-color="#ffffff"
              @select="handleMenuSelect"
              style="border-bottom: none; justify-content: center;"
            >
              <el-menu-item index="/">Home</el-menu-item>
              <el-menu-item index="/products">Products</el-menu-item>
              <el-menu-item index="/cart">
                Cart
                <el-badge v-if="cartStore.totalItems > 0" :value="cartStore.totalItems" style="margin-left: 8px;" />
              </el-menu-item>
              <el-menu-item index="/orders">Orders</el-menu-item>
            </el-menu>
          </el-col>
          <el-col :span="4" style="text-align: right;">
            <el-button type="text" style="color: white;" @click="handleLogin">
              <el-icon><User /></el-icon>
              Login
            </el-button>
          </el-col>
        </el-row>
      </el-header>

      <el-main style="min-height: calc(100vh - 120px); padding: 20px;">
        <router-view />
      </el-main>

      <el-footer style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #e8e8e8;">
        <p style="margin: 0; color: #666;">
          &copy; 2023 XF Shopee Department Store ERP System. All rights reserved.
        </p>
        <p style="margin: 10px 0 0; color: #999; font-size: 14px;">
          This is a demo application for educational purposes.
        </p>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from './stores/cart'
import { User } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const activeMenu = computed(() => route.path)

const handleMenuSelect = (index) => {
  router.push(index)
}

const handleLogin = () => {
  // TODO: Implement login functionality
  console.log('Login clicked')
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.el-header {
  padding: 0 !important;
}

.el-menu--horizontal {
  height: 60px;
  line-height: 60px;
}
</style>