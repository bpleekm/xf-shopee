<template>
  <div class="cart">
    <el-container>
      <el-header style="margin-bottom: 24px;">
        <h1>Shopping Cart</h1>
        <p>Review your items and proceed to checkout</p>
      </el-header>
      <el-main>
        <el-row :gutter="24">
          <el-col :span="16">
            <el-card v-if="cartStore.items.length > 0">
              <template #header>
                <span style="font-size: 18px; font-weight: bold;">Cart Items ({{ cartStore.items.length }})</span>
              </template>
              <div v-for="item in cartStore.items" :key="item.id" class="cart-item">
                <el-row align="middle" :gutter="16" style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
                  <el-col :span="4">
                    <img :src="item.image" :alt="item.name" style="width:100%;height:100px;object-fit:cover;border-radius:4px" />
                  </el-col>
                  <el-col :span="10">
                    <h3 style="margin: 0 0 8px 0;">{{ item.name }}</h3>
                    <p style="color:#666;font-size:14px;margin:0;">{{ item.description }}</p>
                  </el-col>
                  <el-col :span="4">
                    <el-input-number
                      v-model="item.quantity"
                      :min="1"
                      :max="99"
                      size="small"
                      @change="(val) => updateQuantity(item.id, val)"
                      style="width: 100px;"
                    />
                  </el-col>
                  <el-col :span="4">
                    <span style="font-weight:bold;font-size:18px;">${{ (item.price * item.quantity).toFixed(2) }}</span>
                    <p style="color:#999;font-size:14px;margin:4px 0 0;">${{ item.price }} each</p>
                  </el-col>
                  <el-col :span="2" style="text-align: right;">
                    <el-button type="danger" text circle size="small" @click="removeItem(item.id)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-col>
                </el-row>
              </div>
              <div v-if="cartStore.items.length === 0" style="text-align: center; padding: 40px;">
                <el-empty description="Your cart is empty" />
                <el-button type="primary" @click="$router.push('/products')" style="margin-top: 20px;">
                  Browse Products
                </el-button>
              </div>
            </el-card>
            <el-card v-else style="text-align: center; padding: 40px;">
              <el-empty description="Your cart is empty" />
              <el-button type="primary" @click="$router.push('/products')" style="margin-top: 20px;">
                Browse Products
              </el-button>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card>
              <template #header>
                <span style="font-size: 18px; font-weight: bold;">Order Summary</span>
              </template>
              <div style="padding: 16px 0;">
                <el-row style="margin-bottom: 12px;">
                  <el-col :span="12">Subtotal ({{ cartStore.totalItems }} items)</el-col>
                  <el-col :span="12" style="text-align: right;">${{ cartStore.totalPrice.toFixed(2) }}</el-col>
                </el-row>
                <el-row style="margin-bottom: 12px;">
                  <el-col :span="12">Shipping</el-col>
                  <el-col :span="12" style="text-align: right;">$5.99</el-col>
                </el-row>
                <el-row style="margin-bottom: 12px;">
                  <el-col :span="12">Tax (8.5%)</el-col>
                  <el-col :span="12" style="text-align: right;">${{ (cartStore.totalPrice * 0.085).toFixed(2) }}</el-col>
                </el-row>
                <el-divider />
                <el-row style="font-size: 18px; font-weight: bold;">
                  <el-col :span="12">Total</el-col>
                  <el-col :span="12" style="text-align: right;">
                    ${{ (cartStore.totalPrice + 5.99 + (cartStore.totalPrice * 0.085)).toFixed(2) }}
                  </el-col>
                </el-row>
              </div>
              <div style="margin-top: 24px;">
                <el-button 
                  type="primary" 
                  size="large" 
                  style="width:100%;height:48px;font-size:16px;"
                  :disabled="cartStore.items.length === 0"
                  @click="checkout"
                >
                  Proceed to Checkout
                </el-button>
                <el-button 
                  type="default" 
                  size="large" 
                  style="width:100%;height:48px;font-size:16px;margin-top:12px;"
                  @click="continueShopping"
                >
                  Continue Shopping
                </el-button>
                <el-button 
                  type="danger" 
                  text 
                  style="width:100%;margin-top:12px;"
                  :disabled="cartStore.items.length === 0"
                  @click="clearCart"
                >
                  Clear Cart
                </el-button>
              </div>
            </el-card>

            <el-card style="margin-top: 24px;">
              <template #header>
                <span style="font-size: 16px; font-weight: bold;">Need Help?</span>
              </template>
              <p style="color:#666;font-size:14px;">If you have any questions about your order, please contact our customer service.</p>
              <el-button type="text" style="color:#409EFF;">Contact Support</el-button>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { Delete } from '@element-plus/icons-vue'
import { useCartStore } from '../stores/cart'
import { useUserStore } from '../stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

const cartStore = useCartStore()
const router = useRouter()

const updateQuantity = (productId, quantity) => {
  cartStore.updateQuantity(productId, quantity)
}

const removeItem = (productId) => {
  cartStore.removeItem(productId)
  ElMessage.success('Item removed from cart')
}

const clearCart = () => {
  ElMessageBox.confirm(
    'Are you sure you want to clear your cart? This action cannot be undone.',
    'Clear Cart',
    {
      confirmButtonText: 'Clear',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  ).then(() => {
    cartStore.clearCart()
    ElMessage.success('Cart cleared')
  }).catch(() => {
    // cancelled
  })
}

  const checkout = () => {
    if (cartStore.items.length === 0) {
      ElMessage.warning('Your cart is empty')
      return
    }
    
    // 检查用户是否已登录
    const userStore = useUserStore()
    if (!userStore.isAuthenticated) {
      ElMessageBox.confirm(
        'You need to login to proceed with checkout. Would you like to login now?',
        'Login Required',
        {
          confirmButtonText: 'Login',
          cancelButtonText: 'Continue as Guest',
          type: 'warning',
        }
      ).then(() => {
        // 跳转到登录页面
        ElMessage.info('Login feature coming soon')
        // TODO: 实现登录功能后重定向到登录页面
      }).catch(() => {
        // 继续作为游客结账
        router.push('/checkout')
      })
    } else {
      router.push('/checkout')
    }
  }

const continueShopping = () => {
  router.push('/products')
}
</script>

<style scoped>
.cart {
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

.cart-item:last-child {
  border-bottom: none !important;
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}
</style>