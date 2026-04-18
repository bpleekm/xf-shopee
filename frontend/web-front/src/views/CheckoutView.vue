<template>
  <div class="checkout">
    <el-container>
      <el-header style="margin-bottom: 24px;">
        <h1>Checkout</h1>
        <p>Complete your order</p>
      </el-header>
      <el-main>
        <el-row :gutter="24">
          <!-- 左侧：表单区域 -->
          <el-col :span="16">
            <el-steps :active="activeStep" finish-status="success" align-center style="margin-bottom: 32px;">
              <el-step title="Shipping" />
              <el-step title="Payment" />
              <el-step title="Confirmation" />
            </el-steps>

            <!-- Step 1: Shipping Information -->
            <el-card v-if="activeStep === 0" class="step-card">
              <template #header>
                <span style="font-size: 18px; font-weight: bold;">Shipping Information</span>
              </template>
              <el-form :model="shippingForm" :rules="shippingRules" ref="shippingFormRef" label-width="120px">
                <el-form-item label="Full Name" prop="fullName">
                  <el-input v-model="shippingForm.fullName" placeholder="Enter your full name" />
                </el-form-item>
                <el-form-item label="Email" prop="email">
                  <el-input v-model="shippingForm.email" placeholder="Enter your email" />
                </el-form-item>
                <el-form-item label="Phone" prop="phone">
                  <el-input v-model="shippingForm.phone" placeholder="Enter your phone number" />
                </el-form-item>
                <el-form-item label="Address" prop="address">
                  <el-input v-model="shippingForm.address" placeholder="Street address" />
                </el-form-item>
                <el-form-item label="City" prop="city">
                  <el-input v-model="shippingForm.city" placeholder="City" />
                </el-form-item>
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item label="State/Province" prop="state">
                      <el-input v-model="shippingForm.state" placeholder="State or province" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="Postal Code" prop="postalCode">
                      <el-input v-model="shippingForm.postalCode" placeholder="Postal code" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="Country" prop="country">
                  <el-select v-model="shippingForm.country" placeholder="Select country" style="width: 100%;">
                    <el-option label="United States" value="US" />
                    <el-option label="Canada" value="CA" />
                    <el-option label="United Kingdom" value="UK" />
                    <el-option label="Australia" value="AU" />
                    <el-option label="Other" value="other" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-checkbox v-model="shippingForm.saveAddress">
                    Save this address for future orders
                  </el-checkbox>
                </el-form-item>
              </el-form>
              <div style="text-align: right; margin-top: 24px;">
                <el-button @click="$router.push('/cart')">Back to Cart</el-button>
                <el-button type="primary" @click="nextStep">Continue to Payment</el-button>
              </div>
            </el-card>

            <!-- Step 2: Payment Information -->
            <el-card v-if="activeStep === 1" class="step-card">
              <template #header>
                <span style="font-size: 18px; font-weight: bold;">Payment Information</span>
              </template>
              <el-form :model="paymentForm" :rules="paymentRules" ref="paymentFormRef" label-width="120px">
                <el-form-item label="Card Number" prop="cardNumber">
                  <el-input v-model="paymentForm.cardNumber" placeholder="1234 5678 9012 3456">
                    <template #prefix>
                      <el-icon><CreditCard /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item label="Expiry Date" prop="expiryDate">
                      <el-input v-model="paymentForm.expiryDate" placeholder="MM/YY" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="CVV" prop="cvv">
                      <el-input v-model="paymentForm.cvv" placeholder="123" type="password" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="Name on Card" prop="cardName">
                  <el-input v-model="paymentForm.cardName" placeholder="Name as shown on card" />
                </el-form-item>
                <el-form-item>
                  <el-checkbox v-model="paymentForm.saveCard">
                    Save this card for future purchases
                  </el-checkbox>
                </el-form-item>
              </el-form>
              <div style="text-align: right; margin-top: 24px;">
                <el-button @click="prevStep">Back to Shipping</el-button>
                <el-button type="primary" @click="nextStep">Review Order</el-button>
              </div>
            </el-card>

            <!-- Step 3: Order Confirmation -->
            <el-card v-if="activeStep === 2" class="step-card">
              <template #header>
                <span style="font-size: 18px; font-weight: bold;">Order Confirmation</span>
              </template>
              <div style="padding: 20px;">
                <h3 style="margin-bottom: 16px;">Order Summary</h3>
                
                <!-- 订单商品列表 -->
                <div v-for="item in cartStore.items" :key="item.id" class="order-item">
                  <el-row align="middle" :gutter="16" style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;">
                    <el-col :span="4">
                      <img :src="item.image" :alt="item.name" style="width:60px;height:60px;object-fit:cover;border-radius:4px" />
                    </el-col>
                    <el-col :span="12">
                      <h4 style="margin: 0 0 4px 0;">{{ item.name }}</h4>
                      <p style="color:#666;font-size:12px;margin:0;">Quantity: {{ item.quantity }}</p>
                    </el-col>
                    <el-col :span="8" style="text-align: right;">
                      <span style="font-weight:bold;">${{ (item.price * item.quantity).toFixed(2) }}</span>
                    </el-col>
                  </el-row>
                </div>

                <!-- 价格汇总 -->
                <div style="margin-top: 24px;">
                  <el-row style="margin-bottom: 8px;">
                    <el-col :span="12">Subtotal</el-col>
                    <el-col :span="12" style="text-align: right;">${{ cartStore.totalPrice.toFixed(2) }}</el-col>
                  </el-row>
                  <el-row style="margin-bottom: 8px;">
                    <el-col :span="12">Shipping</el-col>
                    <el-col :span="12" style="text-align: right;">$5.99</el-col>
                  </el-row>
                  <el-row style="margin-bottom: 8px;">
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

                <!-- 收货地址 -->
                <h3 style="margin: 24px 0 16px 0;">Shipping Address</h3>
                <el-card style="background:#f9f9f9;margin-bottom:24px;">
                  <p><strong>{{ shippingForm.fullName }}</strong></p>
                  <p>{{ shippingForm.address }}</p>
                  <p>{{ shippingForm.city }}, {{ shippingForm.state }} {{ shippingForm.postalCode }}</p>
                  <p>{{ shippingForm.country }}</p>
                  <p>Phone: {{ shippingForm.phone }}</p>
                  <p>Email: {{ shippingForm.email }}</p>
                </el-card>

                <!-- 支付信息 -->
                <h3 style="margin: 24px 0 16px 0;">Payment Method</h3>
                <el-card style="background:#f9f9f9;">
                  <p><strong>Card ending in {{ paymentForm.cardNumber.slice(-4) }}</strong></p>
                  <p>Expires: {{ paymentForm.expiryDate }}</p>
                  <p>Name on card: {{ paymentForm.cardName }}</p>
                </el-card>

                <!-- 条款确认 -->
                <div style="margin: 24px 0;">
                  <el-checkbox v-model="acceptTerms">
                    I agree to the <el-link type="primary">Terms and Conditions</el-link> and <el-link type="primary">Privacy Policy</el-link>
                  </el-checkbox>
                </div>
              </div>
              <div style="text-align: right; margin-top: 24px;">
                <el-button @click="prevStep">Back to Payment</el-button>
                <el-button 
                  type="primary" 
                  size="large" 
                  :loading="loading"
                  :disabled="!acceptTerms || cartStore.items.length === 0"
                  @click="placeOrder"
                >
                  Place Order
                </el-button>
              </div>
            </el-card>
          </el-col>

          <!-- 右侧：订单摘要 -->
          <el-col :span="8">
            <el-card style="position: sticky; top: 20px;">
              <template #header>
                <span style="font-size: 18px; font-weight: bold;">Order Summary</span>
              </template>
              <div style="padding: 16px 0;">
                <div v-for="item in cartStore.items.slice(0, 3)" :key="item.id" style="margin-bottom: 12px;">
                  <el-row align="middle">
                    <el-col :span="4">
                      <img :src="item.image" :alt="item.name" style="width:40px;height:40px;object-fit:cover;border-radius:4px" />
                    </el-col>
                    <el-col :span="14">
                      <p style="margin:0;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                        {{ item.name }}
                      </p>
                      <p style="margin:0;color:#999;font-size:12px;">Qty: {{ item.quantity }}</p>
                    </el-col>
                    <el-col :span="6" style="text-align: right;">
                      <span style="font-size:14px;">${{ (item.price * item.quantity).toFixed(2) }}</span>
                    </el-col>
                  </el-row>
                </div>
                <el-divider v-if="cartStore.items.length > 3" />
                <p v-if="cartStore.items.length > 3" style="text-align: center; color: #666; font-size: 14px;">
                  And {{ cartStore.items.length - 3 }} more items
                </p>
                
                <el-divider />
                <el-row style="margin-bottom: 8px;">
                  <el-col :span="12">Subtotal</el-col>
                  <el-col :span="12" style="text-align: right;">${{ cartStore.totalPrice.toFixed(2) }}</el-col>
                </el-row>
                <el-row style="margin-bottom: 8px;">
                  <el-col :span="12">Shipping</el-col>
                  <el-col :span="12" style="text-align: right;">$5.99</el-col>
                </el-row>
                <el-row style="margin-bottom: 8px;">
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
              
              <!-- 安全提示 -->
              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
                <el-row align="middle">
                  <el-col :span="4">
                    <el-icon size="24" color="#52c41a"><Lock /></el-icon>
                  </el-col>
                  <el-col :span="20">
                    <p style="margin:0;font-size:12px;color:#666;">
                      <strong>Secure checkout</strong><br>
                      Your payment information is encrypted and secure
                    </p>
                  </el-col>
                </el-row>
              </div>
            </el-card>

            <!-- 支持信息 -->
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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CreditCard, Lock } from '@element-plus/icons-vue'
import { useCartStore } from '../stores/cart'
import { useUserStore } from '../stores/user'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const activeStep = ref(0)
const loading = ref(false)
const acceptTerms = ref(false)

const shippingFormRef = ref()
const paymentFormRef = ref()

const shippingForm = reactive({
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  saveAddress: false
})

const paymentForm = reactive({
  cardNumber: '',
  expiryDate: '',
  cvv: '',
  cardName: '',
  saveCard: false
})

// 表单验证规则
const shippingRules = {
  fullName: [{ required: true, message: 'Please enter your full name', trigger: 'blur' }],
  email: [
    { required: true, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
  ],
  phone: [{ required: true, message: 'Please enter your phone number', trigger: 'blur' }],
  address: [{ required: true, message: 'Please enter your address', trigger: 'blur' }],
  city: [{ required: true, message: 'Please enter your city', trigger: 'blur' }],
  state: [{ required: true, message: 'Please enter your state/province', trigger: 'blur' }],
  postalCode: [{ required: true, message: 'Please enter your postal code', trigger: 'blur' }],
  country: [{ required: true, message: 'Please select your country', trigger: 'change' }]
}

const paymentRules = {
  cardNumber: [
    { required: true, message: 'Please enter your card number', trigger: 'blur' },
    { min: 16, max: 19, message: 'Card number should be 16-19 digits', trigger: 'blur' }
  ],
  expiryDate: [
    { required: true, message: 'Please enter expiry date', trigger: 'blur' },
    { pattern: /^(0[1-9]|1[0-2])\/?([0-9]{2})$/, message: 'Format: MM/YY', trigger: 'blur' }
  ],
  cvv: [
    { required: true, message: 'Please enter CVV', trigger: 'blur' },
    { min: 3, max: 4, message: 'CVV should be 3-4 digits', trigger: 'blur' }
  ],
  cardName: [{ required: true, message: 'Please enter name on card', trigger: 'blur' }]
}

// 如果用户已登录，预填充信息
const initForm = () => {
  if (userStore.user) {
    shippingForm.fullName = userStore.user.full_name || ''
    shippingForm.email = userStore.user.email || ''
    shippingForm.phone = userStore.user.phone || ''
  }
}

// 下一步
const nextStep = async () => {
  if (activeStep.value === 0) {
    try {
      await shippingFormRef.value.validate()
      activeStep.value = 1
    } catch (error) {
      ElMessage.warning('Please fill in all required fields')
    }
  } else if (activeStep.value === 1) {
    try {
      await paymentFormRef.value.validate()
      activeStep.value = 2
    } catch (error) {
      ElMessage.warning('Please fill in all payment details')
    }
  }
}

// 上一步
const prevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--
  }
}

// 提交订单
const placeOrder = async () => {
  if (!acceptTerms.value) {
    ElMessage.warning('Please accept the terms and conditions')
    return
  }

  if (cartStore.items.length === 0) {
    ElMessage.warning('Your cart is empty')
    return
  }

  loading.value = true
  
  try {
    // 准备订单数据
    const orderData = {
      shipping: { ...shippingForm },
      payment: { ...paymentForm },
      items: cartStore.items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      })),
      total: cartStore.totalPrice + 5.99 + (cartStore.totalPrice * 0.085)
    }

    // 调用购物车store的checkout方法
    const result = await cartStore.checkout(orderData)
    
    if (result.success) {
      ElMessage.success('Order placed successfully!')
      
      // 保存收货地址（如果用户选择）
      if (shippingForm.saveAddress && userStore.isAuthenticated) {
        await userStore.updateProfile({
          shipping_address: shippingForm.address,
          shipping_city: shippingForm.city,
          shipping_state: shippingForm.state,
          shipping_postal_code: shippingForm.postalCode,
          shipping_country: shippingForm.country,
          phone: shippingForm.phone
        })
      }
      
      // 跳转到订单详情页或订单列表
      router.push('/orders')
    }
  } catch (error) {
    console.error('Checkout error:', error)
    ElMessage.error('Failed to place order. Please try again.')
  } finally {
    loading.value = false
  }
}

// 初始化
initForm()
</script>

<style scoped>
.checkout {
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

.step-card {
  margin-bottom: 24px;
}

.order-item:last-child {
  border-bottom: none !important;
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}
</style>