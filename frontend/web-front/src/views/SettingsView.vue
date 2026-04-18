<template>
  <div class="settings-page">
    <el-container>
      <el-header style="margin-bottom: 24px;">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">Home</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/profile' }">Profile</el-breadcrumb-item>
          <el-breadcrumb-item>Settings</el-breadcrumb-item>
        </el-breadcrumb>
      </el-header>
      <el-main>
        <div v-if="!userStore.isAuthenticated" class="not-authenticated">
          <el-empty description="Please login to access settings">
            <router-link to="/login">
              <el-button type="primary">Go to Login</el-button>
            </router-link>
          </el-empty>
        </div>
        
        <div v-else class="settings-container">
          <el-row :gutter="32">
            <!-- Left Column: Settings Navigation -->
            <el-col :span="6">
              <el-card class="settings-nav-card">
                <template #header>
                  <h3>Settings</h3>
                </template>
                
                <el-menu
                  :default-active="activeTab"
                  class="settings-menu"
                  @select="handleMenuSelect"
                >
                  <el-menu-item index="account">
                    <el-icon><User /></el-icon>
                    <span>Account</span>
                  </el-menu-item>
                  <el-menu-item index="privacy">
                    <el-icon><Lock /></el-icon>
                    <span>Privacy & Security</span>
                  </el-menu-item>
                  <el-menu-item index="notifications">
                    <el-icon><Bell /></el-icon>
                    <span>Notifications</span>
                  </el-menu-item>
                  <el-menu-item index="preferences">
                    <el-icon><Setting /></el-icon>
                    <span>Preferences</span>
                  </el-menu-item>
                  <el-menu-item index="payment">
                    <el-icon><CreditCard /></el-icon>
                    <span>Payment Methods</span>
                  </el-menu-item>
                  <el-menu-item index="addresses">
                    <el-icon><Location /></el-icon>
                    <span>Addresses</span>
                  </el-menu-item>
                  <el-menu-item index="social">
                    <el-icon><Connection /></el-icon>
                    <span>Social Connections</span>
                  </el-menu-item>
                </el-menu>
                
                <div class="settings-help">
                  <h4>Need Help?</h4>
                  <p>Check our help center for more information.</p>
                  <el-button type="text">Visit Help Center</el-button>
                </div>
              </el-card>
            </el-col>

            <!-- Right Column: Settings Content -->
            <el-col :span="18">
              <!-- Account Settings -->
              <el-card v-if="activeTab === 'account'" class="settings-content-card">
                <template #header>
                  <h3>Account Settings</h3>
                  <p>Manage your account information</p>
                </template>
                
                <el-form
                  ref="accountFormRef"
                  :model="accountForm"
                  :rules="accountRules"
                  label-width="180px"
                  size="large"
                >
                  <el-form-item label="Account Status" prop="status">
                    <el-tag :type="userStore.user?.status === 'active' ? 'success' : 'warning'" size="large">
                      {{ userStore.user?.status || 'active' | capitalize }}
                    </el-tag>
                    <p class="form-hint">
                      Your account is currently active. 
                      <el-link type="primary" @click="showDeactivateDialog = true">Deactivate account</el-link>
                    </p>
                  </el-form-item>
                  
                  <el-form-item label="Account Type" prop="type">
                    <el-radio-group v-model="accountForm.type">
                      <el-radio label="personal">Personal Account</el-radio>
                      <el-radio label="business">Business Account</el-radio>
                    </el-radio-group>
                    <p class="form-hint">Select the type of account you have</p>
                  </el-form-item>
                  
                  <el-form-item label="Two-Factor Authentication" prop="twoFactor">
                    <el-switch
                      v-model="accountForm.twoFactor"
                      active-text="Enabled"
                      inactive-text="Disabled"
                    />
                    <p class="form-hint">Add an extra layer of security to your account</p>
                    <el-button type="text" v-if="accountForm.twoFactor" @click="configureTwoFactor">
                      Configure
                    </el-button>
                  </el-form-item>
                  
                  <el-form-item label="Account Visibility" prop="visibility">
                    <el-select v-model="accountForm.visibility" style="width: 200px;">
                      <el-option label="Public" value="public" />
                      <el-option label="Private" value="private" />
                      <el-option label="Friends Only" value="friends" />
                    </el-select>
                    <p class="form-hint">Control who can see your profile and activity</p>
                  </el-form-item>
                  
                  <el-form-item label="Data Export" prop="dataExport">
                    <el-button type="default" @click="exportData">
                      <el-icon><Download /></el-icon>
                      Export Account Data
                    </el-button>
                    <p class="form-hint">Download a copy of your personal data</p>
                  </el-form-item>
                  
                  <el-form-item>
                    <el-button type="primary" :loading="savingAccount" @click="saveAccountSettings">
                      Save Account Settings
                    </el-button>
                    <el-button type="default" @click="resetAccountForm">
                      Reset
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-card>

              <!-- Privacy & Security Settings -->
              <el-card v-else-if="activeTab === 'privacy'" class="settings-content-card">
                <template #header>
                  <h3>Privacy & Security</h3>
                  <p>Control your privacy and security settings</p>
                </template>
                
                <el-form
                  ref="privacyFormRef"
                  :model="privacyForm"
                  label-width="180px"
                  size="large"
                >
                  <h4 class="section-title">Privacy Settings</h4>
                  
                  <el-form-item label="Profile Visibility" prop="profileVisibility">
                    <el-select v-model="privacyForm.profileVisibility" style="width: 200px;">
                      <el-option label="Everyone" value="everyone" />
                      <el-option label="Logged-in Users" value="loggedin" />
                      <el-option label="Only Me" value="onlyme" />
                    </el-select>
                    <p class="form-hint">Who can see your profile information</p>
                  </el-form-item>
                  
                  <el-form-item label="Order History" prop="orderHistory">
                    <el-select v-model="privacyForm.orderHistory" style="width: 200px;">
                      <el-option label="Visible" value="visible" />
                      <el-option label="Hidden" value="hidden" />
                    </el-select>
                    <p class="form-hint">Show or hide your order history</p>
                  </el-form-item>
                  
                  <el-form-item label="Wishlist Visibility" prop="wishlistVisibility">
                    <el-select v-model="privacyForm.wishlistVisibility" style="width: 200px;">
                      <el-option label="Public" value="public" />
                      <el-option label="Private" value="private" />
                      <el-option label="Friends Only" value="friends" />
                    </el-select>
                    <p class="form-hint">Control who can see your wishlist</p>
                  </el-form-item>
                  
                  <el-form-item label="Search Engine Indexing" prop="searchIndexing">
                    <el-switch
                      v-model="privacyForm.searchIndexing"
                      active-text="Allow"
                      inactive-text="Block"
                    />
                    <p class="form-hint">Allow search engines to index your public profile</p>
                  </el-form-item>
                  
                  <h4 class="section-title">Security Settings</h4>
                  
                  <el-form-item label="Session Management" prop="sessionManagement">
                    <el-button type="default" @click="showSessionsDialog = true">
                      <el-icon><Monitor /></el-icon>
                      Manage Active Sessions
                    </el-button>
                    <p class="form-hint">View and manage your active login sessions</p>
                  </el-form-item>
                  
                  <el-form-item label="Login History" prop="loginHistory">
                    <el-button type="default" @click="showLoginHistory = true">
                      <el-icon><Histogram /></el-icon>
                      View Login History
                    </el-button>
                    <p class="form-hint">Review your account login activity</p>
                  </el-form-item>
                  
                  <el-form-item label="Trusted Devices" prop="trustedDevices">
                    <el-button type="default" @click="showTrustedDevices = true">
                      <el-icon><Monitor /></el-icon>
                      Manage Trusted Devices
                    </el-button>
                    <p class="form-hint">Add or remove trusted devices for easier login</p>
                  </el-form-item>
                  
                  <h4 class="section-title">Data Privacy</h4>
                  
                  <el-form-item label="Data Retention" prop="dataRetention">
                    <el-select v-model="privacyForm.dataRetention" style="width: 200px;">
                      <el-option label="3 Months" value="3months" />
                      <el-option label="6 Months" value="6months" />
                      <el-option label="1 Year" value="1year" />
                      <el-option label="Indefinite" value="indefinite" />
                    </el-select>
                    <p class="form-hint">How long we keep your data after account deletion</p>
                  </el-form-item>
                  
                  <el-form-item label="Third-Party Sharing" prop="thirdPartySharing">
                    <el-switch
                      v-model="privacyForm.thirdPartySharing"
                      active-text="Allow"
                      inactive-text="Disallow"
                    />
                    <p class="form-hint">Allow sharing of anonymized data with trusted partners</p>
                  </el-form-item>
                  
                  <el-form-item>
                    <el-button type="primary" :loading="savingPrivacy" @click="savePrivacySettings">
                      Save Privacy Settings
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-card>

              <!-- Notification Settings -->
              <el-card v-else-if="activeTab === 'notifications'" class="settings-content-card">
                <template #header>
                  <h3>Notification Settings</h3>
                  <p>Manage how and when you receive notifications</p>
                </template>
                
                <el-form
                  ref="notificationFormRef"
                  :model="notificationForm"
                  label-width="180px"
                  size="large"
                >
                  <h4 class="section-title">Email Notifications</h4>
                  
                  <el-form-item label="Order Updates" prop="emailOrderUpdates">
                    <el-switch v-model="notificationForm.emailOrderUpdates" />
                    <span class="notification-label">Receive email notifications for order status changes</span>
                  </el-form-item>
                  
                  <el-form-item label="Promotional Offers" prop="emailPromotions">
                    <el-switch v-model="notificationForm.emailPromotions" />
                    <span class="notification-label">Receive promotional offers and discounts</span>
                  </el-form-item>
                  
                  <el-form-item label="Newsletter" prop="emailNewsletter">
                    <el-switch v-model="notificationForm.emailNewsletter" />
                    <span class="notification-label">Receive our weekly newsletter</span>
                  </el-form-item>
                  
                  <el-form-item label="Product Recommendations" prop="emailRecommendations">
                    <el-switch v-model="notificationForm.emailRecommendations" />
                    <span class="notification-label">Receive personalized product recommendations</span>
                  </el-form-item>
                  
                  <h4 class="section-title">Push Notifications</h4>
                  
                  <el-form-item label="Order Alerts" prop="pushOrderAlerts">
                    <el-switch v-model="notificationForm.pushOrderAlerts" />
                    <span class="notification-label">Receive push notifications for order updates</span>
                  </el-form-item>
                  
                  <el-form-item label="Price Drops" prop="pushPriceDrops">
                    <el-switch v-model="notificationForm.pushPriceDrops" />
                    <span class="notification-label">Get notified when items in your wishlist drop in price</span>
                  </el-form-item>
                  
                  <el-form-item label="Restock Alerts" prop="pushRestockAlerts">
                    <el-switch v-model="notificationForm.pushRestockAlerts" />
                    <span class="notification-label">Receive alerts when out-of-stock items are restocked</span>
                  </el-form-item>
                  
                  <el-form-item label="Cart Reminders" prop="pushCartReminders">
                    <el-switch v-model="notificationForm.pushCartReminders" />
                    <span class="notification-label">Get reminders about items left in your cart</span>
                  </el-form-item>
                  
                  <h4 class="section-title">SMS Notifications</h4>
                  
                  <el-form-item label="Order Updates" prop="smsOrderUpdates">
                    <el-switch v-model="notificationForm.smsOrderUpdates" />
                    <span class="notification-label">Receive SMS for important order updates</span>
                    <p class="form-hint">Standard messaging rates may apply</p>
                  </el-form-item>
                  
                  <el-form-item label="Delivery Alerts" prop="smsDeliveryAlerts">
                    <el-switch v-model="notificationForm.smsDeliveryAlerts" />
                    <span class="notification-label">Get SMS alerts for delivery status</span>
                  </el-form-item>
                  
                  <el-form-item>
                    <el-button type="primary" :loading="savingNotifications" @click="saveNotificationSettings">
                      Save Notification Settings
                    </el-button>
                    <el-button type="default" @click="resetNotificationForm">
                      Reset to Defaults
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-card>

              <!-- Preferences Settings -->
              <el-card v-else-if="activeTab === 'preferences'" class="settings-content-card">
                <template #header>
                  <h3>Preferences</h3>
                  <p>Customize your shopping experience</p>
                </template>
                
                <el-form
                  ref="preferenceFormRef"
                  :model="preferenceForm"
                  label-width="180px"
                  size="large"
                >
                  <h4 class="section-title">Display & Language</h4>
                  
                  <el-form-item label="Language" prop="language">
                    <el-select v-model="preferenceForm.language" style="width: 200px;">
                      <el-option label="English" value="en" />
                      <el-option label="Chinese (简体中文)" value="zh-CN" />
                      <el-option label="Spanish (Español)" value="es" />
                      <el-option label="French (Français)" value="fr" />
                      <el-option label="German (Deutsch)" value="de" />
                    </el-select>
                  </el-form-item>
                  
                  <el-form-item label="Currency" prop="currency">
                    <el-select v-model="preferenceForm.currency" style="width: 200px;">
                      <el-option label="US Dollar (USD)" value="USD" />
                      <el-option label="Euro (EUR)" value="EUR" />
                      <el-option label="British Pound (GBP)" value="GBP" />
                      <el-option label="Chinese Yuan (CNY)" value="CNY" />
                      <el-option label="Japanese Yen (JPY)" value="JPY" />
                    </el-select>
                  </el-form-item>
                  
                  <el-form-item label="Timezone" prop="timezone">
                    <el-select v-model="preferenceForm.timezone" style="width: 300px;">
                      <el-option label="UTC-08:00 Pacific Time (US & Canada)" value="America/Los_Angeles" />
                      <el-option label="UTC-05:00 Eastern Time (US & Canada)" value="America/New_York" />
                      <el-option label="UTC+00:00 London" value="Europe/London" />
                      <el-option label="UTC+01:00 Berlin" value="Europe/Berlin" />
                      <el-option label="UTC+08:00 Beijing" value="Asia/Shanghai" />
                    </el-select>
                  </el-form-item>
                  
                  <el-form-item label="Theme" prop="theme">
                    <el-radio-group v-model="preferenceForm.theme">
                      <el-radio label="light">Light</el-radio>
                      <el-radio label="dark">Dark</el-radio>
                      <el-radio label="auto">Auto (System)</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  
                  <h4 class="section-title">Shopping Preferences</h4>
                  
                  <el-form-item label="Default Sort" prop="defaultSort">
                    <el-select v-model="preferenceForm.defaultSort" style="width: 200px;">
                      <el-option label="Relevance" value="relevance" />
                      <el-option label="Price: Low to High" value="price_asc" />
                      <el-option label="Price: High to Low" value="price_desc" />
                      <el-option label="Newest First" value="newest" />
                      <el-option label="Best Selling" value="bestselling" />
                    </el-select>
                    <p class="form-hint">Default sorting for product listings</p>
                  </el-form-item>
                  
                  <el-form-item label="Items Per Page" prop="itemsPerPage">
                    <el-select v-model="preferenceForm.itemsPerPage" style="width: 100px;">
                      <el-option label="12" :value="12" />
                      <el-option label="24" :value="24" />
                      <el-option label="48" :value="48" />
                      <el-option label="96" :value="96" />
                    </el-select>
                    <p class="form-hint">Number of products to show per page</p>
                  </el-form-item>
                  
                  <el-form-item label="Show Prices" prop="showPrices">
                    <el-switch
                      v-model="preferenceForm.showPrices"
                      active-text="With Tax"
                      inactive-text="Without Tax"
                    />
                    <p class="form-hint">Show prices with or without tax included</p>
                  </el-form-item>
                  
                  <el-form-item label="Quick View" prop="quickView">
                    <el-switch v-model="preferenceForm.quickView" />
                    <span class="notification-label">Enable quick view for products</span>
                  </el-form-item>
                  
                  <el-form-item label="Auto-Add to Cart" prop="autoAddToCart">
                    <el-switch v-model="preferenceForm.autoAddToCart" />
                    <span class="notification-label">Automatically add items to cart from wishlist when in stock</span>
                  </el-form-item>
                  
                  <h4 class="section-title">Accessibility</h4>
                  
                  <el-form-item label="High Contrast Mode" prop="highContrast">
                    <el-switch v-model="preferenceForm.highContrast" />
                    <span class="notification-label">Enable high contrast mode for better visibility</span>
                  </el-form-item>
                  
                  <el-form-item label="Font Size" prop="fontSize">
                    <el-slider
                      v-model="preferenceForm.fontSize"
                      :min="12"
                      :max="24"
                      :step="2"
                      show-stops
                      style="width: 300px;"
                    />
                    <p class="form-hint">Adjust the font size for better readability</p>
                  </el-form-item>
                  
                  <el-form-item label="Reduced Motion" prop="reducedMotion">
                    <el-switch v-model="preferenceForm.reducedMotion" />
                    <span class="notification-label">Reduce animations and motion effects</span>
                  </el-form-item>
                  
                  <el-form-item>
                    <el-button type="primary" :loading="savingPreferences" @click="savePreferenceSettings">
                      Save Preferences
                    </el-button>
                    <el-button type="default" @click="resetPreferenceForm">
                      Reset to Defaults
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-card>

              <!-- Other Settings Tabs (Placeholders) -->
              <el-card v-else class="settings-content-card">
                <template #header>
                  <h3>{{ tabTitles[activeTab] || activeTab | capitalize }} Settings</h3>
                  <p>Manage your {{ activeTab }} settings</p>
                </template>
                
                <div class="coming-soon">
                  <el-empty description="This feature is coming soon">
                    <p>We're working hard to bring you this feature. Check back soon!</p>
                  </el-empty>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-main>
    </el-container>

    <!-- Deactivate Account Dialog -->
    <el-dialog
      v-model="showDeactivateDialog"
      title="Deactivate Account"
      width="500px"
    >
      <div class="deactivate-dialog">
        <el-alert
          title="Note: Your account will be temporarily disabled"
          type="warning"
          :closable="false"
          show-icon
        />
        <div class="deactivate-content">
          <p>When you deactivate your account:</p>
          <ul>
            <li>Your profile will be hidden from other users</li>
            <li>You will not receive any emails or notifications</li>
            <li>Your data will be preserved for 30 days</li>
            <li>You can reactivate your account at any time by logging in</li>
          </ul>
          <p>Are you sure you want to deactivate your account?</p>
          <el-input
            v-model="deactivateConfirmation"
            placeholder="Type 'DEACTIVATE' to confirm"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="showDeactivateDialog = false">Cancel</el-button>
        <el-button
          type="warning"
          @click="deactivateAccount"
          :disabled="deactivateConfirmation !== 'DEACTIVATE'"
          :loading="deactivatingAccount"
        >
          Deactivate Account
        </el-button>
      </template>
    </el-dialog>

    <!-- Active Sessions Dialog -->
    <el-dialog
      v-model="showSessionsDialog"
      title="Active Sessions"
      width="600px"
    >
      <div class="sessions-dialog">
        <el-table :data="activeSessions" style="width: 100%">
          <el-table-column prop="device" label="Device" width="180" />
          <el-table-column prop="location" label="Location" width="120" />
          <el-table-column prop="lastActive" label="Last Active" width="140" />
          <el-table-column label="Actions" width="100">
            <template #default="{ row }">
              <el-button
                v-if="!row.current"
                type="text"
                size="small"
                @click="revokeSession(row.id)"
              >
                Revoke
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="sessions-actions">
          <el-button type="primary" plain @click="revokeAllSessions">
            Revoke All Other Sessions
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User,
  Lock,
  Bell,
  Setting,
  CreditCard,
  Location,
  Connection,
  Download,
  Monitor,
  Histogram
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

// 活动标签页
const activeTab = ref('account')

// 标签页标题
const tabTitles = {
  account: 'Account',
  privacy: 'Privacy & Security',
  notifications: 'Notifications',
  preferences: 'Preferences',
  payment: 'Payment Methods',
  addresses: 'Addresses',
  social: 'Social Connections'
}

// 对话框状态
const showDeactivateDialog = ref(false)
const showSessionsDialog = ref(false)
const showLoginHistory = ref(false)
const showTrustedDevices = ref(false)

const deactivateConfirmation = ref('')
const deactivatingAccount = ref(false)

// 加载状态
const savingAccount = ref(false)
const savingPrivacy = ref(false)
const savingNotifications = ref(false)
const savingPreferences = ref(false)

// 账户设置表单
const accountFormRef = ref()
const accountForm = reactive({
  type: 'personal',
  twoFactor: false,
  visibility: 'private',
  dataExport: false
})

const accountRules = {
  type: [{ required: true }]
}

// 隐私设置表单
const privacyFormRef = ref()
const privacyForm = reactive({
  profileVisibility: 'loggedin',
  orderHistory: 'visible',
  wishlistVisibility: 'private',
  searchIndexing: true,
  dataRetention: '6months',
  thirdPartySharing: false
})

// 通知设置表单
const notificationFormRef = ref()
const notificationForm = reactive({
  emailOrderUpdates: true,
  emailPromotions: true,
  emailNewsletter: true,
  emailRecommendations: true,
  pushOrderAlerts: true,
  pushPriceDrops: true,
  pushRestockAlerts: true,
  pushCartReminders: false,
  smsOrderUpdates: false,
  smsDeliveryAlerts: false
})

// 偏好设置表单
const preferenceFormRef = ref()
const preferenceForm = reactive({
  language: 'en',
  currency: 'USD',
  timezone: 'America/New_York',
  theme: 'light',
  defaultSort: 'relevance',
  itemsPerPage: 24,
  showPrices: true,
  quickView: true,
  autoAddToCart: false,
  highContrast: false,
  fontSize: 16,
  reducedMotion: false
})

// 活动会话数据（模拟）
const activeSessions = ref([
  {
    id: 1,
    device: 'Chrome on Windows 10',
    location: 'New York, USA',
    lastActive: 'Just now',
    current: true
  },
  {
    id: 2,
    device: 'Safari on iPhone',
    location: 'San Francisco, USA',
    lastActive: '2 hours ago',
    current: false
  },
  {
    id: 3,
    device: 'Firefox on MacOS',
    location: 'London, UK',
    lastActive: '1 day ago',
    current: false
  }
])

// 菜单选择处理
const handleMenuSelect = (index) => {
  activeTab.value = index
}

// 保存账户设置
const saveAccountSettings = async () => {
  savingAccount.value = true
  try {
    // 这里应该调用API保存设置
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('Account settings saved successfully')
  } catch (error) {
    ElMessage.error('Failed to save account settings')
  } finally {
    savingAccount.value = false
  }
}

// 保存隐私设置
const savePrivacySettings = async () => {
  savingPrivacy.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('Privacy settings saved successfully')
  } catch (error) {
    ElMessage.error('Failed to save privacy settings')
  } finally {
    savingPrivacy.value = false
  }
}

// 保存通知设置
const saveNotificationSettings = async () => {
  savingNotifications.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('Notification settings saved successfully')
  } catch (error) {
    ElMessage.error('Failed to save notification settings')
  } finally {
    savingNotifications.value = false
  }
}

// 保存偏好设置
const savePreferenceSettings = async () => {
  savingPreferences.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('Preferences saved successfully')
  } catch (error) {
    ElMessage.error('Failed to save preferences')
  } finally {
    savingPreferences.value = false
  }
}

// 重置表单
const resetAccountForm = () => {
  accountForm.type = 'personal'
  accountForm.twoFactor = false
  accountForm.visibility = 'private'
}

const resetNotificationForm = () => {
  notificationForm.emailOrderUpdates = true
  notificationForm.emailPromotions = true
  notificationForm.emailNewsletter = true
  notificationForm.emailRecommendations = true
  notificationForm.pushOrderAlerts = true
  notificationForm.pushPriceDrops = true
  notificationForm.pushRestockAlerts = true
  notificationForm.pushCartReminders = false
  notificationForm.smsOrderUpdates = false
  notificationForm.smsDeliveryAlerts = false
}

const resetPreferenceForm = () => {
  preferenceForm.language = 'en'
  preferenceForm.currency = 'USD'
  preferenceForm.timezone = 'America/New_York'
  preferenceForm.theme = 'light'
  preferenceForm.defaultSort = 'relevance'
  preferenceForm.itemsPerPage = 24
  preferenceForm.showPrices = true
  preferenceForm.quickView = true
  preferenceForm.autoAddToCart = false
  preferenceForm.highContrast = false
  preferenceForm.fontSize = 16
  preferenceForm.reducedMotion = false
}

// 其他功能
const configureTwoFactor = () => {
  ElMessage.info('Two-factor authentication configuration coming soon')
}

const exportData = async () => {
  ElMessage.info('Data export feature coming soon')
}

const deactivateAccount = async () => {
  deactivatingAccount.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('Account deactivated successfully')
    showDeactivateDialog.value = false
    deactivateConfirmation.value = ''
  } catch (error) {
    ElMessage.error('Failed to deactivate account')
  } finally {
    deactivatingAccount.value = false
  }
}

const revokeSession = (sessionId) => {
  activeSessions.value = activeSessions.value.filter(s => s.id !== sessionId)
  ElMessage.success('Session revoked successfully')
}

const revokeAllSessions = () => {
  activeSessions.value = activeSessions.value.filter(s => s.current)
  ElMessage.success('All other sessions revoked successfully')
}

// 初始化表单数据
const initForms = () => {
  if (userStore.user) {
    // 可以根据用户数据初始化表单
    accountForm.type = userStore.user.account_type || 'personal'
    accountForm.twoFactor = userStore.user.two_factor_enabled || false
    accountForm.visibility = userStore.user.account_visibility || 'private'
    
    preferenceForm.language = userStore.user.language || 'en'
    preferenceForm.currency = userStore.user.currency || 'USD'
    preferenceForm.timezone = userStore.user.timezone || 'America/New_York'
  }
}

onMounted(() => {
  if (userStore.isAuthenticated) {
    initForms()
  }
})
</script>

<style scoped>
.settings-page {
  padding: 20px;
}

.settings-container {
  max-width: 1200px;
  margin: 0 auto;
}

.settings-nav-card,
.settings-content-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.settings-nav-card .el-card__header {
  padding: 20px 24px;
}

.settings-nav-card h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.settings-menu {
  border-right: none;
}

.settings-menu .el-menu-item {
  height: 48px;
  line-height: 48px;
  margin: 4px 0;
  border-radius: 6px;
}

.settings-menu .el-menu-item.is-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.settings-menu .el-menu-item.is-active .el-icon {
  color: white;
}

.settings-menu .el-icon {
  margin-right: 12px;
}

.settings-help {
  margin-top: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.settings-help h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.settings-help p {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.settings-content-card .el-card__header {
  padding: 24px;
}

.settings-content-card h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #333;
}

.settings-content-card p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.el-form-item {
  margin-bottom: 24px;
}

.form-hint {
  margin: 4px 0 0 0;
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}

.notification-label {
  margin-left: 12px;
  color: #606266;
  font-size: 14px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.coming-soon {
  padding: 40px 0;
  text-align: center;
}

.coming-soon p {
  margin-top: 12px;
  color: #666;
  font-size: 14px;
}

/* 对话框样式 */
.deactivate-dialog,
.sessions-dialog {
  padding: 8px 0;
}

.deactivate-content {
  margin-top: 16px;
  color: #666;
}

.deactivate-content p {
  margin: 12px 0;
}

.deactivate-content ul {
  margin: 12px 0;
  padding-left: 20px;
}

.deactivate-content li {
  margin-bottom: 8px;
  line-height: 1.4;
}

.sessions-dialog {
  max-height: 400px;
  overflow-y: auto;
}

.sessions-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .settings-container .el-col {
    span: 24 !important;
    margin-bottom: 24px;
  }
  
  .settings-content-card .el-form-item {
    label-width: 120px !important;
  }
}

@media (max-width: 768px) {
  .settings-page {
    padding: 12px;
  }
  
  .settings-content-card .el-form-item {
    label-width: 100px !important;
  }
  
  .section-title {
    font-size: 14px;
  }
  
  .notification-label {
    display: block;
    margin-left: 0;
    margin-top: 8px;
  }
}
</style>