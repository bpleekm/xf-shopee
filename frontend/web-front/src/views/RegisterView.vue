<template>
  <div class="register-page">
    <el-container>
      <el-header style="margin-bottom: 24px;">
        <router-link to="/" class="back-link">
          <el-icon><ArrowLeft /></el-icon>
          Back to Home
        </router-link>
      </el-header>
      <el-main>
        <div class="register-container">
          <el-row justify="center" align="middle">
            <el-col :span="8">
              <el-card class="register-card">
                <template #header>
                  <div class="register-header">
                    <h2>Create Your Account</h2>
                    <p>Join XF Shopee to start shopping</p>
                  </div>
                </template>
                
                <el-form
                  ref="registerFormRef"
                  :model="registerForm"
                  :rules="registerRules"
                  label-width="0"
                  size="large"
                  @submit.prevent="handleRegister"
                >
                  <el-row :gutter="16">
                    <el-col :span="12">
                      <el-form-item prop="firstName">
                        <el-input
                          v-model="registerForm.firstName"
                          placeholder="First Name"
                          :prefix-icon="User"
                          clearable
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item prop="lastName">
                        <el-input
                          v-model="registerForm.lastName"
                          placeholder="Last Name"
                          clearable
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  
                  <el-form-item prop="email">
                    <el-input
                      v-model="registerForm.email"
                      type="email"
                      placeholder="Email Address"
                      :prefix-icon="Message"
                      clearable
                    />
                  </el-form-item>
                  
                  <el-form-item prop="username">
                    <el-input
                      v-model="registerForm.username"
                      placeholder="Username"
                      :prefix-icon="User"
                      clearable
                    />
                  </el-form-item>
                  
                  <el-form-item prop="password">
                    <el-input
                      v-model="registerForm.password"
                      type="password"
                      placeholder="Password"
                      :prefix-icon="Lock"
                      show-password
                      clearable
                    />
                    <div class="password-hints">
                      <p class="hint-title">Password must contain:</p>
                      <ul class="hint-list">
                        <li :class="{ 'valid': hasMinLength }">At least 8 characters</li>
                        <li :class="{ 'valid': hasUpperCase }">One uppercase letter</li>
                        <li :class="{ 'valid': hasLowerCase }">One lowercase letter</li>
                        <li :class="{ 'valid': hasNumber }">One number</li>
                        <li :class="{ 'valid': hasSpecialChar }">One special character</li>
                      </ul>
                    </div>
                  </el-form-item>
                  
                  <el-form-item prop="confirmPassword">
                    <el-input
                      v-model="registerForm.confirmPassword"
                      type="password"
                      placeholder="Confirm Password"
                      :prefix-icon="Lock"
                      show-password
                      clearable
                    />
                  </el-form-item>
                  
                  <el-form-item prop="phone">
                    <el-input
                      v-model="registerForm.phone"
                      placeholder="Phone Number (Optional)"
                      :prefix-icon="Phone"
                      clearable
                    />
                  </el-form-item>
                  
                  <el-form-item prop="acceptTerms">
                    <el-checkbox v-model="registerForm.acceptTerms">
                      I agree to the <el-link type="primary">Terms of Service</el-link> and <el-link type="primary">Privacy Policy</el-link>
                    </el-checkbox>
                  </el-form-item>
                  
                  <el-form-item prop="subscribeNewsletter">
                    <el-checkbox v-model="registerForm.subscribeNewsletter">
                      Subscribe to newsletter for updates and offers
                    </el-checkbox>
                  </el-form-item>
                  
                  <el-form-item>
                    <el-button
                      type="primary"
                      size="large"
                      :loading="loading"
                      @click="handleRegister"
                      class="register-btn"
                    >
                      {{ loading ? 'Creating Account...' : 'Create Account' }}
                    </el-button>
                  </el-form-item>
                  
                  <div class="login-link">
                    <p>Already have an account? <router-link to="/login">Sign in</router-link></p>
                  </div>
                </el-form>
              </el-card>
              
              <el-card class="info-card" style="margin-top: 24px;">
                <h4>Benefits of Registration</h4>
                <div class="benefits-grid">
                  <div class="benefit-item">
                    <el-icon size="24" color="#409EFF"><ShoppingCart /></el-icon>
                    <h5>Faster Checkout</h5>
                    <p>Save your shipping and payment details for quick purchases</p>
                  </div>
                  <div class="benefit-item">
                    <el-icon size="24" color="#67C23A"><Document /></el-icon>
                    <h5>Order Tracking</h5>
                    <p>Track all your orders in one place</p>
                  </div>
                  <div class="benefit-item">
                    <el-icon size="24" color="#E6A23C"><Star /></el-icon>
                    <h5>Exclusive Offers</h5>
                    <p>Get access to member-only deals and promotions</p>
                  </div>
                  <div class="benefit-item">
                    <el-icon size="24" color="#F56C6C"><Star /></el-icon>
                    <h5>Wishlist</h5>
                    <p>Save items for later and get restock notifications</p>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message, Phone, ArrowLeft, ShoppingCart, Document, Star } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const registerFormRef = ref()
const loading = ref(false)

const registerForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  acceptTerms: false,
  subscribeNewsletter: true
})

// 密码强度检查
const hasMinLength = computed(() => registerForm.password.length >= 8)
const hasUpperCase = computed(() => /[A-Z]/.test(registerForm.password))
const hasLowerCase = computed(() => /[a-z]/.test(registerForm.password))
const hasNumber = computed(() => /[0-9]/.test(registerForm.password))
const hasSpecialChar = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(registerForm.password))

const validatePassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('Please enter a password'))
  } else if (value.length < 8) {
    callback(new Error('Password must be at least 8 characters'))
  } else if (!/[A-Z]/.test(value)) {
    callback(new Error('Password must contain at least one uppercase letter'))
  } else if (!/[a-z]/.test(value)) {
    callback(new Error('Password must contain at least one lowercase letter'))
  } else if (!/[0-9]/.test(value)) {
    callback(new Error('Password must contain at least one number'))
  } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
    callback(new Error('Password must contain at least one special character'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('Please confirm your password'))
  } else if (value !== registerForm.password) {
    callback(new Error('Passwords do not match'))
  } else {
    callback()
  }
}

const registerRules = {
  firstName: [
    { required: true, message: 'Please enter your first name', trigger: 'blur' },
    { min: 2, message: 'First name must be at least 2 characters', trigger: 'blur' }
  ],
  lastName: [
    { required: true, message: 'Please enter your last name', trigger: 'blur' },
    { min: 2, message: 'Last name must be at least 2 characters', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
  ],
  username: [
    { required: true, message: 'Please choose a username', trigger: 'blur' },
    { min: 3, message: 'Username must be at least 3 characters', trigger: 'blur' },
    { max: 20, message: 'Username cannot exceed 20 characters', trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  phone: [
    { pattern: /^[+]?[0-9\s\-()]{10,}$/, message: 'Please enter a valid phone number', trigger: 'blur' }
  ],
  acceptTerms: [
    { required: true, message: 'You must accept the terms and conditions', trigger: 'change' }
  ]
}

const handleRegister = async () => {
  try {
    await registerFormRef.value.validate()
    loading.value = true
    
    // 准备注册数据
    const userData = {
      first_name: registerForm.firstName,
      last_name: registerForm.lastName,
      email: registerForm.email,
      username: registerForm.username,
      password: registerForm.password,
      phone: registerForm.phone,
      subscribe_newsletter: registerForm.subscribeNewsletter
    }
    
    const result = await userStore.register(userData)
    
    if (result.success) {
      ElMessage.success('Account created successfully!')
      router.push('/')
    }
  } catch (error) {
    if (error.errors) {
      ElMessage.warning('Please fill in all required fields correctly')
    } else {
      ElMessage.error(error.message || 'Registration failed')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #36d1dc 0%, #5b86e5 100%);
  padding: 20px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: white;
  text-decoration: none;
  font-size: 16px;
  transition: opacity 0.3s ease;
}

.back-link:hover {
  opacity: 0.8;
}

.register-container {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
}

.register-card {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: none;
}

.register-header {
  text-align: center;
  padding: 8px 0;
}

.register-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.register-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.el-form-item {
  margin-bottom: 20px;
}

.password-hints {
  margin-top: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.hint-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.hint-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.hint-list li {
  font-size: 12px;
  color: #909399;
  position: relative;
  padding-left: 20px;
}

.hint-list li::before {
  content: '○';
  position: absolute;
  left: 0;
  color: #dcdfe6;
}

.hint-list li.valid {
  color: #67c23a;
}

.hint-list li.valid::before {
  content: '✓';
  color: #67c23a;
}

.register-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

.login-link {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.login-link p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.login-link a {
  color: #409EFF;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}

.info-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.info-card h4 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
  text-align: center;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.benefit-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.benefit-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.benefit-item h5 {
  margin: 12px 0 8px 0;
  font-size: 16px;
  color: #333;
}

.benefit-item p {
  margin: 0;
  color: #606266;
  font-size: 12px;
  line-height: 1.4;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .register-page .el-col {
    span: 10 !important;
  }
}

@media (max-width: 992px) {
  .register-page .el-col {
    span: 12 !important;
  }
  
  .hint-list {
    grid-template-columns: 1fr;
  }
  
  .benefits-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .register-page .el-col {
    span: 24 !important;
  }
  
  .register-page {
    padding: 12px;
  }
  
  .register-header h2 {
    font-size: 20px;
  }
  
  .register-btn {
    height: 44px;
    font-size: 15px;
  }
  
  .el-row .el-col {
    span: 24 !important;
  }
}
</style>