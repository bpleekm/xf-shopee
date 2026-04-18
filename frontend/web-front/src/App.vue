<template>
  <div id="app">
    <AppHeader />
    <main class="app-main">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  padding: 24px;
  background: #f8f9fa;
}

/* Responsive Design */
@media (max-width: 768px) {
  .app-main {
    padding: 16px;
  }
}
</style>