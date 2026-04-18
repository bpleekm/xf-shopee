<template>
  <el-footer class="app-footer">
    <div class="footer-container">
      <!-- Main Footer Content -->
      <div class="footer-main">
        <div class="footer-section">
          <h3 class="footer-title">XF Shopee</h3>
          <p class="footer-description">
            Your one-stop shop for all your needs. We provide high-quality products with competitive prices and excellent customer service.
          </p>
          <div class="social-links">
            <a href="#" class="social-link" title="Facebook">
              <el-icon size="20"><Share /></el-icon>
            </a>
            <a href="#" class="social-link" title="Twitter">
              <el-icon size="20"><ChatDotRound /></el-icon>
            </a>
            <a href="#" class="social-link" title="Instagram">
              <el-icon size="20"><Picture /></el-icon>
            </a>
            <a href="#" class="social-link" title="LinkedIn">
              <el-icon size="20"><Link /></el-icon>
            </a>
          </div>
        </div>

        <div class="footer-section">
          <h4 class="footer-subtitle">Quick Links</h4>
          <ul class="footer-links">
            <li><router-link to="/">Home</router-link></li>
            <li><router-link to="/products">All Products</router-link></li>
            <li><router-link to="/products?category=electronics">Electronics</router-link></li>
            <li><router-link to="/products?category=food">Food & Grocery</router-link></li>
            <li><router-link to="/products?category=home">Home & Kitchen</router-link></li>
          </ul>
        </div>

        <div class="footer-section">
          <h4 class="footer-subtitle">Customer Service</h4>
          <ul class="footer-links">
            <li><router-link to="/help">Help Center</router-link></li>
            <li><router-link to="/shipping">Shipping Info</router-link></li>
            <li><router-link to="/returns">Returns & Exchanges</router-link></li>
            <li><router-link to="/privacy">Privacy Policy</router-link></li>
            <li><router-link to="/terms">Terms of Service</router-link></li>
          </ul>
        </div>

        <div class="footer-section">
          <h4 class="footer-subtitle">Contact Us</h4>
          <ul class="footer-contact">
            <li>
              <el-icon><Location /></el-icon>
              <span>123 Commerce Street, Business City, BC 12345</span>
            </li>
            <li>
              <el-icon><Phone /></el-icon>
              <span>(555) 123-4567</span>
            </li>
            <li>
              <el-icon><Message /></el-icon>
              <span>support@xfshopee.com</span>
            </li>
            <li>
              <el-icon><Clock /></el-icon>
              <span>Mon-Fri: 9am-6pm EST</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Newsletter Subscription -->
      <div class="newsletter-section">
        <h4 class="newsletter-title">Stay Updated</h4>
        <p class="newsletter-description">Subscribe to our newsletter for the latest deals and updates.</p>
        <div class="newsletter-form">
          <el-input
            v-model="email"
            placeholder="Enter your email"
            size="large"
            style="max-width: 300px; margin-right: 12px;"
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" size="large" @click="subscribeNewsletter">
            Subscribe
          </el-button>
        </div>
      </div>

      <!-- Footer Bottom -->
      <div class="footer-bottom">
        <div class="payment-methods">
          <span class="payment-label">We accept:</span>
          <div class="payment-icons">
            <el-icon size="24" class="payment-icon"><CreditCard /></el-icon>
            <el-icon size="24" class="payment-icon"><Postcard /></el-icon>
            <el-icon size="24" class="payment-icon"><Money /></el-icon>
            <el-icon size="24" class="payment-icon"><Wallet /></el-icon>
          </div>
        </div>
        <div class="copyright">
          <p>&copy; {{ currentYear }} XF Shopee Department Store ERP System. All rights reserved.</p>
          <p class="copyright-note">This is a demo application for educational purposes.</p>
        </div>
      </div>
    </div>
  </el-footer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Share,
  ChatDotRound,
  Picture,
  Link,
  Location,
  Phone,
  Message,
  Clock,
  CreditCard,
  Postcard,
  Money,
  Wallet
} from '@element-plus/icons-vue'

const email = ref('')

const currentYear = computed(() => new Date().getFullYear())

const subscribeNewsletter = () => {
  if (!email.value.trim()) {
    ElMessage.warning('Please enter your email address')
    return
  }
  
  if (!isValidEmail(email.value)) {
    ElMessage.warning('Please enter a valid email address')
    return
  }
  
  // Simulate subscription
  ElMessage.success(`Thank you for subscribing with ${email.value}!`)
  email.value = ''
}

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
</script>

<style scoped>
.app-footer {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 48px 0 24px 0 !important;
  border-top: 1px solid #34495e;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.footer-main {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
  margin-bottom: 48px;
}

.footer-section {
  display: flex;
  flex-direction: column;
}

.footer-title {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: bold;
  color: #ffffff;
  background: linear-gradient(90deg, #36d1dc, #5b86e5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer-description {
  margin: 0 0 20px 0;
  color: #bdc3c7;
  font-size: 14px;
  line-height: 1.6;
}

.social-links {
  display: flex;
  gap: 16px;
  margin-top: auto;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #ecf0f1;
  transition: all 0.3s ease;
  text-decoration: none;
}

.social-link:hover {
  background: #3498db;
  color: white;
  transform: translateY(-2px);
}

.footer-subtitle {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  position: relative;
  padding-bottom: 8px;
}

.footer-subtitle::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 2px;
  background: #3498db;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 12px;
}

.footer-links a {
  color: #bdc3c7;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
  display: block;
}

.footer-links a:hover {
  color: #3498db;
  padding-left: 4px;
}

.footer-contact {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-contact li {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  color: #bdc3c7;
  font-size: 14px;
  line-height: 1.5;
}

.footer-contact .el-icon {
  margin-right: 12px;
  margin-top: 2px;
  color: #3498db;
  flex-shrink: 0;
}

.newsletter-section {
  text-align: center;
  padding: 40px 0;
  border-top: 1px solid #34495e;
  border-bottom: 1px solid #34495e;
  margin-bottom: 40px;
}

.newsletter-title {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: bold;
  color: #ffffff;
}

.newsletter-description {
  margin: 0 0 24px 0;
  color: #bdc3c7;
  font-size: 16px;
}

.newsletter-form {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid #34495e;
}

.payment-methods {
  display: flex;
  align-items: center;
  gap: 16px;
}

.payment-label {
  color: #bdc3c7;
  font-size: 14px;
}

.payment-icons {
  display: flex;
  gap: 12px;
}

.payment-icon {
  color: #95a5a6;
  transition: color 0.3s ease;
}

.payment-icon:hover {
  color: #3498db;
}

.copyright {
  text-align: right;
}

.copyright p {
  margin: 4px 0;
  color: #95a5a6;
  font-size: 14px;
}

.copyright-note {
  font-size: 12px !important;
  color: #7f8c8d !important;
}

/* Responsive Design */
@media (max-width: 992px) {
  .footer-main {
    grid-template-columns: repeat(2, 1fr);
    gap: 32px;
  }
}

@media (max-width: 768px) {
  .footer-main {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  
  .footer-bottom {
    flex-direction: column;
    gap: 24px;
    text-align: center;
  }
  
  .payment-methods {
    flex-direction: column;
    gap: 12px;
  }
  
  .copyright {
    text-align: center;
  }
  
  .newsletter-form {
    flex-direction: column;
  }
  
  .newsletter-form .el-input {
    max-width: 100% !important;
    margin-right: 0 !important;
    margin-bottom: 12px;
  }
}
</style>