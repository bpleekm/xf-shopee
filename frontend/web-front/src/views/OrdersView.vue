<template>
  <div class="orders">
    <el-container>
      <el-header style="margin-bottom: 24px;">
        <h1>My Orders</h1>
        <p>View your order history and track shipments</p>
      </el-header>
      <el-main>
        <el-tabs v-model="activeTab" type="card">
          <el-tab-pane label="All Orders" name="all">
            <el-card v-if="orders.length > 0">
              <el-table :data="orders" style="width: 100%">
                <el-table-column prop="orderId" label="Order ID" width="180" />
                <el-table-column prop="date" label="Date" width="120" />
                <el-table-column prop="items" label="Items" width="100">
                  <template #default="{ row }">
                    {{ row.items }} item{{ row.items !== 1 ? 's' : '' }}
                  </template>
                </el-table-column>
                <el-table-column prop="total" label="Total" width="120">
                  <template #default="{ row }">
                    ${{ row.total.toFixed(2) }}
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="Status" width="120">
                  <template #default="{ row }">
                    <el-tag :type="getStatusType(row.status)" size="small">
                      {{ row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Actions" width="200">
                  <template #default="{ row }">
                    <el-button type="primary" text size="small" @click="viewOrder(row.orderId)">
                      View Details
                    </el-button>
                    <el-button 
                      v-if="row.status === 'Processing'" 
                      type="success" 
                      text 
                      size="small"
                      @click="trackOrder(row.orderId)"
                    >
                      Track
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
            <el-empty v-else description="No orders yet" />
          </el-tab-pane>
          <el-tab-pane label="Processing" name="processing">
            <el-card v-if="processingOrders.length > 0">
              <el-table :data="processingOrders" style="width: 100%">
                <el-table-column prop="orderId" label="Order ID" width="180" />
                <el-table-column prop="date" label="Date" width="120" />
                <el-table-column prop="total" label="Total" width="120">
                  <template #default="{ row }">
                    ${{ row.total.toFixed(2) }}
                  </template>
                </el-table-column>
                <el-table-column label="Estimated Delivery" width="180">
                  <template #default="{ row }">
                    {{ row.estimatedDelivery }}
                  </template>
                </el-table-column>
                <el-table-column label="Actions" width="200">
                  <template #default="{ row }">
                    <el-button type="primary" text size="small" @click="viewOrder(row.orderId)">
                      View Details
                    </el-button>
                    <el-button type="success" text size="small" @click="trackOrder(row.orderId)">
                      Track
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
            <el-empty v-else description="No processing orders" />
          </el-tab-pane>
          <el-tab-pane label="Completed" name="completed">
            <el-card v-if="completedOrders.length > 0">
              <el-table :data="completedOrders" style="width: 100%">
                <el-table-column prop="orderId" label="Order ID" width="180" />
                <el-table-column prop="date" label="Date" width="120" />
                <el-table-column prop="total" label="Total" width="120">
                  <template #default="{ row }">
                    ${{ row.total.toFixed(2) }}
                  </template>
                </el-table-column>
                <el-table-column prop="deliveredDate" label="Delivered On" width="120" />
                <el-table-column label="Actions" width="200">
                  <template #default="{ row }">
                    <el-button type="primary" text size="small" @click="viewOrder(row.orderId)">
                      View Details
                    </el-button>
                    <el-button type="text" size="small" @click="reorder(row.orderId)">
                      Reorder
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
            <el-empty v-else description="No completed orders" />
          </el-tab-pane>
        </el-tabs>

        <el-card style="margin-top: 24px;">
          <template #header>
            <span style="font-size: 16px; font-weight: bold;">Order Support</span>
          </template>
          <p style="color:#666;">Need help with an order? Contact our customer support team.</p>
          <el-button type="primary">Contact Support</el-button>
          <el-button type="default" style="margin-left: 12px;">View FAQ</el-button>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import api from '../services/api'

const activeTab = ref('all')
const orders = ref([])
const loading = ref(false)
const userStore = useUserStore()

// 加载订单
const fetchOrders = async () => {
  if (!userStore.isAuthenticated) {
    ElMessage.warning('Please login to view your orders')
    return
  }
  
  loading.value = true
  try {
    const response = await api.orders.getAll({ limit: 50 })
    orders.value = response.data.orders || []
    
    // 转换数据格式以匹配前端
    orders.value = orders.value.map(order => ({
      orderId: order.order_number || `ORD-${order.id.toString().padStart(3, '0')}`,
      date: new Date(order.created_at).toISOString().split('T')[0],
      items: order.items?.length || order.item_count || 0,
      total: parseFloat(order.total_amount) || 0,
      status: order.status || 'pending',
      estimatedDelivery: calculateEstimatedDelivery(order.created_at),
      deliveredDate: order.status === 'delivered' ? new Date(order.updated_at).toISOString().split('T')[0] : ''
    }))
  } catch (error) {
    ElMessage.error('Failed to load orders')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 计算预计送达日期
const calculateEstimatedDelivery = (createdDate) => {
  const date = new Date(createdDate)
  date.setDate(date.getDate() + 7) // 默认7天后送达
  return date.toISOString().split('T')[0]
}

onMounted(() => {
  if (userStore.isAuthenticated) {
    fetchOrders()
  }
})

const processingOrders = computed(() => orders.value.filter(o => 
  ['pending', 'processing', 'shipped'].includes(o.status.toLowerCase())
))

const completedOrders = computed(() => orders.value.filter(o => 
  ['completed', 'delivered'].includes(o.status.toLowerCase())
))

const getStatusType = (status) => {
  const statusLower = status.toLowerCase()
  if (['pending', 'processing'].includes(statusLower)) return 'warning'
  if (['completed', 'delivered'].includes(statusLower)) return 'success'
  if (['cancelled', 'failed'].includes(statusLower)) return 'danger'
  if (['shipped'].includes(statusLower)) return 'primary'
  return 'info'
}

const viewOrder = (orderId) => {
  ElMessage.info(`Viewing order ${orderId} - Feature coming soon`)
}

const trackOrder = (orderId) => {
  ElMessage.info(`Tracking order ${orderId} - Feature coming soon`)
}

const reorder = (orderId) => {
  ElMessage.success(`Order ${orderId} added to cart for reorder - Feature coming soon`)
}
</script>

<style scoped>
.orders {
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
</style>