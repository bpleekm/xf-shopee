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
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const activeTab = ref('all')

const orders = ref([
  { orderId: 'ORD-001', date: '2023-10-15', items: 3, total: 89.97, status: 'Completed', estimatedDelivery: '2023-10-18', deliveredDate: '2023-10-17' },
  { orderId: 'ORD-002', date: '2023-10-20', items: 1, total: 24.99, status: 'Processing', estimatedDelivery: '2023-10-25', deliveredDate: '' },
  { orderId: 'ORD-003', date: '2023-10-22', items: 5, total: 156.45, status: 'Processing', estimatedDelivery: '2023-10-27', deliveredDate: '' },
  { orderId: 'ORD-004', date: '2023-10-05', items: 2, total: 45.98, status: 'Completed', estimatedDelivery: '2023-10-08', deliveredDate: '2023-10-07' },
  { orderId: 'ORD-005', date: '2023-09-28', items: 4, total: 112.96, status: 'Completed', estimatedDelivery: '2023-10-01', deliveredDate: '2023-09-30' },
])

const processingOrders = computed(() => orders.value.filter(o => o.status === 'Processing'))
const completedOrders = computed(() => orders.value.filter(o => o.status === 'Completed'))

const getStatusType = (status) => {
  const types = {
    'Processing': 'warning',
    'Completed': 'success',
    'Cancelled': 'danger',
    'Shipped': 'primary'
  }
  return types[status] || 'info'
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