<template>
  <div class="profile-page">
    <el-container>
      <el-header style="margin-bottom: 24px;">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">Home</el-breadcrumb-item>
          <el-breadcrumb-item>My Profile</el-breadcrumb-item>
        </el-breadcrumb>
      </el-header>
      <el-main>
        <div v-if="!userStore.isAuthenticated" class="not-authenticated">
          <el-empty description="Please login to view your profile">
            <router-link to="/login">
              <el-button type="primary">Go to Login</el-button>
            </router-link>
          </el-empty>
        </div>
        
        <div v-else class="profile-container">
          <el-row :gutter="32">
            <!-- Left Column: Profile Info -->
            <el-col :span="8">
              <el-card class="profile-card">
                <template #header>
                  <div class="profile-header">
                    <h3>Profile Information</h3>
                    <p>Manage your personal details</p>
                  </div>
                </template>
                
                <div class="profile-avatar-section">
                  <div class="avatar-container">
                    <el-avatar :size="120" :src="userStore.user?.avatar" class="profile-avatar">
                      {{ userInitials }}
                    </el-avatar>
                    <div class="avatar-actions">
                      <el-button type="primary" text size="small" @click="showAvatarUpload = true">
                        <el-icon><Camera /></el-icon>
                        Change Photo
                      </el-button>
                      <el-button type="text" size="small" @click="removeAvatar">
                        <el-icon><Delete /></el-icon>
                        Remove
                      </el-button>
                    </div>
                  </div>
                  
                  <div class="profile-summary">
                    <h3>{{ userStore.user?.full_name || userStore.user?.username || 'User' }}</h3>
                    <p>{{ userStore.user?.email || 'No email provided' }}</p>
                    <el-tag type="success" size="small" v-if="userStore.user?.verified">
                      <el-icon><Check /></el-icon>
                      Verified Account
                    </el-tag>
                    <el-tag type="info" size="small" v-else>
                      <el-icon><Warning /></el-icon>
                      Not Verified
                    </el-tag>
                  </div>
                </div>
                
                <div class="profile-stats">
                  <div class="stat-item">
                    <div class="stat-value">{{ userStore.user?.order_count || 0 }}</div>
                    <div class="stat-label">Total Orders</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ memberSince }}</div>
                    <div class="stat-label">Member Since</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ userStore.user?.reward_points || 0 }}</div>
                    <div class="stat-label">Reward Points</div>
                  </div>
                </div>
                
                <div class="profile-quick-actions">
                  <h4>Quick Actions</h4>
                  <el-button type="primary" plain @click="goToOrders">
                    <el-icon><Document /></el-icon>
                    View Orders
                  </el-button>
                  <el-button type="default" plain @click="goToSettings">
                    <el-icon><Setting /></el-icon>
                    Account Settings
                  </el-button>
                  <el-button type="default" plain @click="showChangePassword = true">
                    <el-icon><Lock /></el-icon>
                    Change Password
                  </el-button>
                </div>
              </el-card>
              
              <el-card class="address-card" style="margin-top: 24px;">
                <template #header>
                  <div class="address-header">
                    <h3>Default Address</h3>
                    <el-button type="text" @click="editAddress">
                      <el-icon><Edit /></el-icon>
                      Edit
                    </el-button>
                  </div>
                </template>
                
                <div v-if="userStore.user?.shipping_address" class="address-details">
                  <p><strong>{{ userStore.user?.full_name || userStore.user?.username }}</strong></p>
                  <p>{{ userStore.user?.shipping_address }}</p>
                  <p v-if="userStore.user?.shipping_city">{{ userStore.user?.shipping_city }}</p>
                  <p v-if="userStore.user?.shipping_state">{{ userStore.user?.shipping_state }}, {{ userStore.user?.shipping_postal_code }}</p>
                  <p v-if="userStore.user?.shipping_country">{{ userStore.user?.shipping_country }}</p>
                  <p v-if="userStore.user?.phone">Phone: {{ userStore.user?.phone }}</p>
                </div>
                <div v-else class="no-address">
                  <el-empty description="No address saved" :image-size="80">
                    <el-button type="primary" @click="addAddress">Add Address</el-button>
                  </el-empty>
                </div>
              </el-card>
            </el-col>

            <!-- Right Column: Profile Form -->
            <el-col :span="16">
              <el-card class="profile-form-card">
                <template #header>
                  <div class="form-header">
                    <h3>Edit Profile</h3>
                    <p>Update your personal information</p>
                  </div>
                </template>
                
                <el-form
                  ref="profileFormRef"
                  :model="profileForm"
                  :rules="profileRules"
                  label-width="120px"
                  size="large"
                  @submit.prevent="updateProfile"
                >
                  <h4 class="form-section-title">Basic Information</h4>
                  
                  <el-row :gutter="24">
                    <el-col :span="12">
                      <el-form-item label="First Name" prop="first_name">
                        <el-input
                          v-model="profileForm.first_name"
                          placeholder="Enter your first name"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="Last Name" prop="last_name">
                        <el-input
                          v-model="profileForm.last_name"
                          placeholder="Enter your last name"
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  
                  <el-form-item label="Username" prop="username">
                    <el-input
                      v-model="profileForm.username"
                      placeholder="Choose a username"
                      disabled
                    />
                    <p class="form-hint">Username cannot be changed</p>
                  </el-form-item>
                  
                  <el-form-item label="Email" prop="email">
                    <el-input
                      v-model="profileForm.email"
                      type="email"
                      placeholder="Enter your email"
                      :prefix-icon="Message"
                    />
                    <p class="form-hint" v-if="!userStore.user?.verified">
                      Your email is not verified. <el-link type="primary" @click="verifyEmail">Verify now</el-link>
                    </p>
                  </el-form-item>
                  
                  <el-form-item label="Phone" prop="phone">
                    <el-input
                      v-model="profileForm.phone"
                      placeholder="Enter your phone number"
                      :prefix-icon="Phone"
                    />
                  </el-form-item>
                  
                  <el-form-item label="Date of Birth" prop="date_of_birth">
                    <el-date-picker
                      v-model="profileForm.date_of_birth"
                      type="date"
                      placeholder="Select your date of birth"
                      style="width: 100%;"
                      :disabled-date="disableFutureDates"
                    />
                  </el-form-item>
                  
                  <h4 class="form-section-title">Preferences</h4>
                  
                  <el-form-item label="Language" prop="language">
                    <el-select
                      v-model="profileForm.language"
                      placeholder="Select language"
                      style="width: 100%;"
                    >
                      <el-option label="English" value="en" />
                      <el-option label="Chinese" value="zh" />
                      <el-option label="Spanish" value="es" />
                      <el-option label="French" value="fr" />
                      <el-option label="German" value="de" />
                    </el-select>
                  </el-form-item>
                  
                  <el-form-item label="Currency" prop="currency">
                    <el-select
                      v-model="profileForm.currency"
                      placeholder="Select currency"
                      style="width: 100%;"
                    >
                      <el-option label="US Dollar ($)" value="USD" />
                      <el-option label="Euro (€)" value="EUR" />
                      <el-option label="British Pound (£)" value="GBP" />
                      <el-option label="Chinese Yuan (¥)" value="CNY" />
                    </el-select>
                  </el-form-item>
                  
                  <el-form-item label="Newsletter" prop="newsletter_subscription">
                    <el-switch
                      v-model="profileForm.newsletter_subscription"
                      active-text="Subscribed"
                      inactive-text="Not Subscribed"
                    />
                    <p class="form-hint">Receive updates, promotions, and news via email</p>
                  </el-form-item>
                  
                  <el-form-item label="Marketing Emails" prop="marketing_emails">
                    <el-switch
                      v-model="profileForm.marketing_emails"
                      active-text="Enabled"
                      inactive-text="Disabled"
                    />
                    <p class="form-hint">Receive personalized product recommendations</p>
                  </el-form-item>
                  
                  <el-form-item>
                    <el-button
                      type="primary"
                      size="large"
                      :loading="saving"
                      @click="updateProfile"
                      class="save-btn"
                    >
                      {{ saving ? 'Saving...' : 'Save Changes' }}
                    </el-button>
                    <el-button
                      type="default"
                      size="large"
                      @click="resetForm"
                    >
                      Reset
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-card>
              
              <el-card class="account-actions-card" style="margin-top: 24px;">
                <template #header>
                  <h3>Account Actions</h3>
                </template>
                
                <div class="danger-zone">
                  <h4 class="danger-title">Danger Zone</h4>
                  <p class="danger-description">These actions are irreversible. Please proceed with caution.</p>
                  
                  <div class="danger-actions">
                    <el-button type="danger" plain @click="showDeleteDialog = true">
                      <el-icon><Delete /></el-icon>
                      Delete Account
                    </el-button>
                    <el-button type="warning" plain @click="showDeactivateDialog = true">
                      <el-icon><Warning /></el-icon>
                      Deactivate Account
                    </el-button>
                    <el-button type="default" plain @click="logout">
                      <el-icon><SwitchButton /></el-icon>
                      Logout
                    </el-button>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-main>
    </el-container>

    <!-- Avatar Upload Dialog -->
    <el-dialog
      v-model="showAvatarUpload"
      title="Upload Profile Picture"
      width="400px"
    >
      <div class="avatar-upload-dialog">
        <el-upload
          class="avatar-uploader"
          action="#"
          :show-file-list="false"
          :before-upload="beforeAvatarUpload"
          :http-request="uploadAvatar"
        >
          <img v-if="avatarPreview" :src="avatarPreview" class="avatar-preview" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
        <p class="upload-hint">Click to upload (JPG, PNG, GIF up to 2MB)</p>
      </div>
      <template #footer>
        <el-button @click="showAvatarUpload = false">Cancel</el-button>
        <el-button type="primary" @click="saveAvatar" :loading="uploadingAvatar">
          Upload
        </el-button>
      </template>
    </el-dialog>

    <!-- Change Password Dialog -->
    <el-dialog
      v-model="showChangePassword"
      title="Change Password"
      width="400px"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="120px"
      >
        <el-form-item label="Current Password" prop="currentPassword">
          <el-input
            v-model="passwordForm.currentPassword"
            type="password"
            show-password
          />
        </el-form-item>
        <el-form-item label="New Password" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password
          />
        </el-form-item>
        <el-form-item label="Confirm Password" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showChangePassword = false">Cancel</el-button>
        <el-button type="primary" @click="changePassword" :loading="changingPassword">
          Change Password
        </el-button>
      </template>
    </el-dialog>

    <!-- Delete Account Dialog -->
    <el-dialog
      v-model="showDeleteDialog"
      title="Delete Account"
      width="500px"
    >
      <div class="delete-dialog">
        <el-alert
          title="Warning: This action cannot be undone!"
          type="error"
          :closable="false"
          show-icon
        />
        <div class="delete-content">
          <p>Deleting your account will:</p>
          <ul>
            <li>Permanently delete all your personal information</li>
            <li>Remove your order history</li>
            <li>Cancel any pending orders</li>
            <li>Delete your saved addresses and payment methods</li>
            <li>Remove you from our mailing lists</li>
          </ul>
          <p>Are you sure you want to delete your account?</p>
          <el-input
            v-model="deleteConfirmation"
            placeholder="Type 'DELETE' to confirm"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="showDeleteDialog = false">Cancel</el-button>
        <el-button
          type="danger"
          @click="deleteAccount"
          :disabled="deleteConfirmation !== 'DELETE'"
          :loading="deletingAccount"
        >
          Delete Account
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Camera,
  Delete,
  Check,
  Warning,
  Document,
  Setting,
  Lock,
  Edit,
  Message,
  Phone,
  Plus,
  SwitchButton
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

// 用户初始化
const userInitials = computed(() => {
  if (!userStore.user) return 'U'
  const name = userStore.user.full_name || userStore.user.username || ''
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const memberSince = computed(() => {
  if (!userStore.user?.created_at) return 'N/A'
  const date = new Date(userStore.user.created_at)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
})

// 表单
const profileFormRef = ref()
const passwordFormRef = ref()
const saving = ref(false)
const changingPassword = ref(false)
const deletingAccount = ref(false)
const uploadingAvatar = ref(false)

const profileForm = reactive({
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  phone: '',
  date_of_birth: '',
  language: 'en',
  currency: 'USD',
  newsletter_subscription: true,
  marketing_emails: false
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 对话框状态
const showAvatarUpload = ref(false)
const showChangePassword = ref(false)
const showDeleteDialog = ref(false)
const showDeactivateDialog = ref(false)
const deleteConfirmation = ref('')

// 头像上传
const avatarPreview = ref(null)
const avatarFile = ref(null)

// 表单验证规则
const profileRules = {
  first_name: [
    { required: true, message: 'Please enter your first name', trigger: 'blur' },
    { min: 2, message: 'First name must be at least 2 characters', trigger: 'blur' }
  ],
  last_name: [
    { required: true, message: 'Please enter your last name', trigger: 'blur' },
    { min: 2, message: 'Last name must be at least 2 characters', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^[+]?[0-9\s\-()]{10,}$/, message: 'Please enter a valid phone number', trigger: 'blur' }
  ]
}

const passwordRules = {
  currentPassword: [
    { required: true, message: 'Please enter your current password', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: 'Please enter a new password', trigger: 'blur' },
    { min: 8, message: 'Password must be at least 8 characters', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: 'Please confirm your password', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('Passwords do not match'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 初始化表单数据
const initForm = () => {
  if (userStore.user) {
    profileForm.first_name = userStore.user.first_name || ''
    profileForm.last_name = userStore.user.last_name || ''
    profileForm.username = userStore.user.username || ''
    profileForm.email = userStore.user.email || ''
    profileForm.phone = userStore.user.phone || ''
    profileForm.date_of_birth = userStore.user.date_of_birth || ''
    profileForm.language = userStore.user.language || 'en'
    profileForm.currency = userStore.user.currency || 'USD'
    profileForm.newsletter_subscription = userStore.user.newsletter_subscription !== false
    profileForm.marketing_emails = userStore.user.marketing_emails || false
  }
}

// 更新个人资料
const updateProfile = async () => {
  try {
    await profileFormRef.value.validate()
    saving.value = true
    
    const result = await userStore.updateProfile(profileForm)
    
    if (result.success) {
      ElMessage.success('Profile updated successfully')
    }
  } catch (error) {
    ElMessage.error('Failed to update profile')
  } finally {
    saving.value = false
  }
}

// 修改密码
const changePassword = async () => {
  try {
    await passwordFormRef.value.validate()
    changingPassword.value = true
    
    const result = await userStore.changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    )
    
    if (result.success) {
      ElMessage.success('Password changed successfully')
      showChangePassword.value = false
      passwordForm.currentPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    }
  } catch (error) {
    ElMessage.error('Failed to change password')
  } finally {
    changingPassword.value = false
  }
}

// 删除账户
const deleteAccount = async () => {
  try {
    deletingAccount.value = true
    
    // 这里应该调用API删除账户
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用
    
    ElMessage.success('Account deleted successfully')
    userStore.logout()
    router.push('/')
  } catch (error) {
    ElMessage.error('Failed to delete account')
  } finally {
    deletingAccount.value = false
    showDeleteDialog.value = false
  }
}

// 头像上传
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('Avatar must be an image file!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('Avatar size cannot exceed 2MB!')
    return false
  }
  
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
  return false // 阻止自动上传
}

const uploadAvatar = async () => {
  if (!avatarFile.value) return
  
  uploadingAvatar.value = true
  try {
    // 这里应该调用API上传头像
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用
    
    ElMessage.success('Avatar uploaded successfully')
    showAvatarUpload.value = false
    avatarFile.value = null
    avatarPreview.value = null
    
    // 刷新用户信息
    await userStore.refreshUser()
  } catch (error) {
    ElMessage.error('Failed to upload avatar')
  } finally {
    uploadingAvatar.value = false
  }
}

const saveAvatar = () => {
  uploadAvatar()
}

const removeAvatar = () => {
  ElMessageBox.confirm(
    'Are you sure you want to remove your profile picture?',
    'Remove Avatar',
    {
      confirmButtonText: 'Remove',
      cancelButtonText: 'Cancel',
      type: 'warning'
    }
  ).then(async () => {
    // 这里应该调用API删除头像
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('Avatar removed successfully')
    await userStore.refreshUser()
  })
}

// 其他功能
const resetForm = () => {
  initForm()
}

const goToOrders = () => {
  router.push('/orders')
}

const goToSettings = () => {
  router.push('/settings')
}

const editAddress = () => {
  ElMessage.info('Address editing feature coming soon')
}

const addAddress = () => {
  ElMessage.info('Address adding feature coming soon')
}

const verifyEmail = () => {
  ElMessage.info('Email verification feature coming soon')
}

const logout = () => {
  userStore.logout()
  router.push('/')
}

const disableFutureDates = (date) => {
  return date > new Date()
}

onMounted(() => {
  if (userStore.isAuthenticated) {
    initForm()
  }
})
</script>

<style scoped>
.profile-page {
  padding: 20px;
}

.profile-container {
  max-width: 1200px;
  margin: 0 auto;
}

.profile-card,
.profile-form-card,
.address-card,
.account-actions-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.profile-header,
.form-header,
.address-header {
  padding: 8px 0;
}

.profile-header h3,
.form-header h3,
.address-header h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #333;
}

.profile-header p,
.form-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-avatar-section {
  text-align: center;
  margin-bottom: 24px;
}

.avatar-container {
  margin-bottom: 16px;
}

.profile-avatar {
  margin-bottom: 12px;
  border: 4px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.profile-summary h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: #333;
}

.profile-summary p {
  margin: 0 0 8px 0;
  color: #666;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 24px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.profile-quick-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.profile-quick-actions h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.profile-quick-actions .el-button {
  margin-right: 8px;
  margin-bottom: 8px;
}

.address-details {
  color: #666;
  line-height: 1.6;
}

.address-details p {
  margin: 0 0 4px 0;
}

.no-address {
  padding: 20px 0;
}

.form-section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.form-hint {
  margin: 4px 0 0 0;
  color: #909399;
  font-size: 12px;
}

.save-btn {
  margin-right: 12px;
}

.danger-zone {
  padding: 16px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
}

.danger-title {
  margin: 0 0 8px 0;
  color: #f5222d;
  font-size: 16px;
}

.danger-description {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.danger-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 头像上传对话框 */
.avatar-upload-dialog {
  text-align: center;
}

.avatar-uploader {
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 178px;
  height: 178px;
  margin: 0 auto 16px;
  transition: border-color 0.3s ease;
}

.avatar-uploader:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-hint {
  margin: 0;
  color: #666;
  font-size: 12px;
  text-align: center;
}

/* 删除对话框 */
.delete-dialog {
  padding: 8px 0;
}

.delete-content {
  margin-top: 16px;
  color: #666;
}

.delete-content p {
  margin: 12px 0;
}

.delete-content ul {
  margin: 12px 0;
  padding-left: 20px;
}

.delete-content li {
  margin-bottom: 8px;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .profile-container .el-col {
    span: 24 !important;
    margin-bottom: 24px;
  }
  
  .profile-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .profile-page {
    padding: 12px;
  }
  
  .profile-stats {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .danger-actions {
    flex-direction: column;
  }
  
  .danger-actions .el-button {
    width: 100%;
  }
  
  .el-form-item {
    margin-bottom: 16px;
  }
  
  .el-row .el-col {
    span: 24 !important;
  }
}
</style>