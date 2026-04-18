<template>
  <div class="login-page">
    <el-container>
      <el-header style="margin-bottom: 24px;">
        <router-link to="/" class="back-link">
          <el-icon><ArrowLeft /></el-icon>
          Back to Home
        </router-link>
      </el-header>
      <el-main>
        <div class="login-container">
          <el-row justify="center" align="middle">
            <el-col :span="8">
              <el-card class="login-card">
                <template #header>
                  <div class="login-header">
                    <h2>Login to XF Shopee</h2>
                    <p>Access your account to continue shopping</p>
                  </div>
                </template>
                
                <el-form
                  ref="loginFormRef"
                  :model="loginForm"
                  :rules="loginRules"
                  label-width="0"
                  size="large"
                  @submit.prevent="handleLogin"
                >
                  <el-form-item prop="username">
                    <el-input
                      v-model="loginForm.username"
                      placeholder="Username or Email"
                      :prefix-icon="User"
                      clearable
                    />
                  </el-form-item>
                  
                  <el-form-item prop="password">
                    <el-input
                      v-model="loginForm.password"
                      type="password"
                      placeholder="Password"
                      :prefix-icon="Lock"
                      show-password
                      clearable
                    />
                  </el-form-item>
                  
                  <el-form-item>
                    <div class="login-options">
                      <el-checkbox v-model="rememberMe">Remember me</el-checkbox>
                      <router-link to="/forgot-password" class="forgot-link">
                        Forgot password?
                      </router-link>
                    </div>
                  </el-form-item>
                  
                  <el-form-item>
                    <el-button
                      type="primary"
                      size="large"
                      :loading="loading"
                      @click="handleLogin"
                      class="login-btn"
                    >
                      {{ loading ? 'Logging in...' : 'Login' }}
                    </el-button>
                  </el-form-item>
                  
                  <div class="login-divider">
                    <span>or</span>
                  </div>
                  
                  <div class="social-login">
                    <el-button type="default" size="large" class="social-btn google-btn">
                      <el-icon><Message /></el-icon>
                      Continue with Google
                    </el-button>
                    <el-button type="default" size="large" class="social-btn github-btn">
                      <el-icon><ChatDotRound /></el-icon>
                      Continue with GitHub
                    </el-button>
                  </div>
                  
                  <div class="register-link">
                    <p>Don't have an account? <router-link to="/register">Sign up</router-link></p>
                  </div>
                </el-form>
              </el-card>
              
              <el-card class="info-card" style="margin-top: 24px;">
                <h4>Why create an account?</h4>
                <ul class="benefits-list">
                  <li>Save your shipping addresses</li>
                  <li>Track your order history</li>
                  <li>Get personalized recommendations</li>
                  <li>Access exclusive deals and offers</li>
                </ul>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, ArrowLeft, Message, ChatDotRound } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref()
const loading = ref(false)
const rememberMe = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: 'Please enter your username or email', trigger: 'blur' },
    { min: 3, message: 'Username must be at least 3 characters', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Please enter your password', trigger: 'blur' },
    { min: 6, message: 'Password must be at least 6 characters', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    const result = await userStore.login(loginForm.username, loginForm.password)
    
    if (result.success) {
      ElMessage.success('Login successful!')
      router.push('/')
    }
  } catch (error) {
    if (error.errors) {
      // Validation errors
      ElMessage.warning('Please fill in all required fields')
    } else {
      // API errors
      ElMessage.error(error.message || 'Login failed')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.login-container {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
}

.login-card {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: none;
}

.login-header {
  text-align: center;
  padding: 8px 0;
}

.login-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.login-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.el-form-item {
  margin-bottom: 24px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.forgot-link {
  color: #409EFF;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.forgot-link:hover {
  color: #337ecc;
  text-decoration: underline;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

.login-divider {
  position: relative;
  text-align: center;
  margin: 24px 0;
}

.login-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e4e7ed;
}

.login-divider span {
  position: relative;
  display: inline-block;
  padding: 0 16px;
  background: white;
  color: #909399;
  font-size: 14px;
}

.social-login {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.social-btn {
  width: 100%;
  height: 48px;
  justify-content: center;
  gap: 12px;
  font-weight: 500;
  border: 1px solid #dcdfe6;
}

.social-btn:hover {
  background: #f5f7fa;
}

.google-btn {
  color: #db4437;
}

.google-btn:hover {
  border-color: #db4437;
  background: rgba(219, 68, 55, 0.05);
}

.github-btn {
  color: #24292e;
}

.github-btn:hover {
  border-color: #24292e;
  background: rgba(36, 41, 46, 0.05);
}

.register-link {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.register-link p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.register-link a {
  color: #409EFF;
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}

.info-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.info-card h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.benefits-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.benefits-list li {
  position: relative;
  padding-left: 24px;
  margin-bottom: 12px;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.benefits-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #67c23a;
  font-weight: bold;
}

/* Responsive Design */
@media (max-width: 992px) {
  .login-page .el-col {
    span: 12 !important;
  }
}

@media (max-width: 768px) {
  .login-page .el-col {
    span: 24 !important;
  }
  
  .login-page {
    padding: 12px;
  }
  
  .login-header h2 {
    font-size: 20px;
  }
  
  .login-btn, .social-btn {
    height: 44px;
    font-size: 15px;
  }
}
</style>