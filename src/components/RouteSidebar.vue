<script>
import { ref, computed, watch } from 'vue'
import { busRoutes, searchRoutes } from '../data/busRoutes.js'
import { XMarkIcon, Bars3Icon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useScreenSize } from '../composables/useScreenSize'
import { useSearch } from '../composables/useSearch'
import { ROUTE_STATUS } from '../constants'

export default {
  name: 'RouteSidebar',
  components: {
    XMarkIcon,
    Bars3Icon,
    ChevronRightIcon
  },
  emits: ['sidebar-toggle', 'route-selected'],
  setup(props, { emit }) {
    const routes = ref(busRoutes || [])
    const { isDesktop } = useScreenSize()

    // Use search composable with debouncing
    const { searchQuery, filteredItems: filteredRoutes, clearSearch } = useSearch(
      routes,
      searchRoutes,
      300
    )

    const isOpen = computed(() => isDesktop.value)

    // Watch for screen size changes and emit sidebar state
    watch(isDesktop, (newIsDesktop) => {
      emit('sidebar-toggle', newIsDesktop)
    }, { immediate: true })

    // Methods
    const toggleSidebar = () => {
      // Only toggle on mobile/tablet screens
      if (!isDesktop.value) {
        emit('sidebar-toggle', !isOpen.value)
      }
    }

    const getRouteStatus = () => ROUTE_STATUS.ACTIVE

    return {
      routes,
      searchQuery,
      filteredRoutes,
      isOpen,
      toggleSidebar,
      clearSearch,
      getRouteStatus
    }
  }
}
</script>

<template>
  <div class="sidebar-container" :class="isOpen ? 'sidebar-open' : 'sidebar-closed'"
    style="min-height: 100vh; box-shadow: -8px 0 32px rgba(0,0,0,0.04);">

    <!-- Header -->
    <div class="sidebar-header">
      <!-- Background Pattern -->
      <div class="header-pattern">
        <div class="pattern-overlay"
          style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0); background-size: 20px 20px;">
        </div>
      </div>

      <div class="header-content">
        <div class="header-top">
          <div class="header-left">
            <div class="header-icon">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
              </svg>
            </div>
            <div class="header-text">
              <h1 class="header-title">Bus Routes</h1>
              <p class="header-subtitle">Metro Transit</p>
            </div>
          </div>
          <button class="close-button" @click="toggleSidebar">
            <XMarkIcon class="close-icon" />
          </button>
        </div>

        <div class="header-bottom">
          <div class="status-indicator">
            <div class="status-dot"></div>
            <p class="status-text">{{ routes.length }} routes available</p>
          </div>
          <div class="live-badge">Live</div>
        </div>
      </div>
    </div>

    <!-- Search/Filter -->
    <div class="search-section">
      <div class="search-container">
        <input v-model="searchQuery" type="text" placeholder="Search routes..." class="search-input">

        <!-- Search Icon -->
        <div class="search-icon">
          <svg class="search-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        <!-- Clear Button -->
        <div v-if="searchQuery" class="clear-button">
          <button @click="clearSearch" class="clear-btn" aria-label="Clear search">
            <svg class="clear-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Routes List -->
    <div class="routes-list">
      <!-- Empty State -->
      <div v-if="filteredRoutes.length === 0 && searchQuery" class="empty-state">
        <div class="empty-icon">
          <svg class="empty-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <h3 class="empty-title">No routes found</h3>
        <p class="empty-message">Try adjusting your search terms</p>
      </div>

      <!-- Routes Grid -->
      <div v-else class="routes-grid">
        <div v-for="route in filteredRoutes" :key="route.id" class="route-card" tabindex="0" role="button"
          :aria-label="`Route ${route.id}: ${route.name}`" @keydown.enter="$emit('route-selected', route)"
          @keydown.space.prevent="$emit('route-selected', route)">

          <!-- Route Color Accent -->
          <div class="route-accent" :style="{ backgroundColor: route.color }"></div>

          <div class="route-content">
            <!-- Route Info -->
            <div class="route-info">
              <div class="route-header">
                <div class="route-badge-container">
                  <span class="route-badge" :style="{ backgroundColor: route.color }">
                    Route {{ route.id }}
                  </span>
                </div>
                <div class="route-indicator"></div>
              </div>
              <p class="route-name">{{ route.name }}</p>

              <!-- Route Status -->
              <div class="route-status">
                <div class="status-dot-small"></div>
                <span class="status-text-small">{{ getRouteStatus() }}</span>
              </div>
            </div>

            <!-- Arrow Icon -->
            <div class="route-arrow">
              <div class="arrow-container">
                <ChevronRightIcon class="arrow-icon" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="sidebar-footer">
      <div class="footer-content">
        <div class="footer-left">
          <div class="footer-dot"></div>
          <p class="footer-text">
            Data by <span class="footer-highlight">MetroInfo</span>
          </p>
        </div>
        <div class="footer-version">v2.1</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar-container {
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(24px);
  border-left: 1px solid rgba(229, 231, 235, 0.5);
  overflow-y: auto;
  width: 20rem;
  transform: translateX(0);
  transition: all 0.3s ease-in-out;
  animation: slideIn 0.3s ease-out;
}

.sidebar-open {
  display: block;
}

.sidebar-closed {
  display: none;
}

@media (min-width: 1024px) {
  .sidebar-closed {
    display: block;
  }
}

@media (max-width: 1023px) {
  .sidebar-container {
    position: fixed;
    right: 0;
    top: 0;
    z-index: 50;
  }
}

@media (max-width: 768px) {
  .sidebar-container {
    width: 18rem;
  }
}

@media (max-width: 640px) {
  .sidebar-container {
    width: 16rem;
  }
}

/* Header Styles */
.sidebar-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a);
  color: white;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.header-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.05;
}

.pattern-overlay {
  position: absolute;
  inset: 0;
}

.header-content {
  position: relative;
  z-index: 10;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-icon {
  width: 3rem;
  height: 3rem;
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.icon {
  width: 1.75rem;
  height: 1.75rem;
  color: white;
}

.header-title {
  font-size: 1.5rem;
  font-weight: bold;
  letter-spacing: -0.025em;
  margin: 0;
}

.header-subtitle {
  color: #cbd5e1;
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0;
}

.close-button {
  padding: 0.625rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.close-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: white;
}

.header-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  background-color: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5);
}

.status-text {
  font-size: 0.875rem;
  color: #cbd5e1;
  font-weight: 500;
  margin: 0;
}

.live-badge {
  font-size: 0.75rem;
  color: #94a3b8;
  font-family: monospace;
}

/* Search Section */
.search-section {
  position: sticky;
  top: 5.5rem;
  z-index: 10;
  padding: 1.5rem;
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
}

.search-container {
  position: relative;
}

.search-input {
  width: 100%;
  padding-left: 3rem;
  padding-right: 3rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
  border: 1px solid rgba(229, 231, 235, 0.6);
  border-radius: 1rem;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.search-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  background-color: white;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.search-svg {
  width: 1.25rem;
  height: 1.25rem;
  color: #9ca3af;
  transition: color 0.3s;
}

.search-container:focus-within .search-svg {
  color: #3b82f6;
}

.clear-button {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.clear-btn {
  padding: 0.25rem;
  color: #9ca3af;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.clear-btn:hover {
  color: #4b5563;
  background-color: #f3f4f6;
}

.clear-svg {
  width: 1rem;
  height: 1rem;
}

/* Routes List */
.routes-list {
  flex: 1;
  overflow-y: auto;
  background: linear-gradient(to bottom, rgba(249, 250, 251, 0.5), rgba(255, 255, 255, 0.5));
}

.empty-state {
  padding: 3rem;
  text-align: center;
}

.empty-icon {
  width: 5rem;
  height: 5rem;
  margin: 0 auto 1.5rem;
  background: linear-gradient(to bottom right, #f3f4f6, #e5e7eb);
  border-radius: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}

.empty-svg {
  width: 2.5rem;
  height: 2.5rem;
  color: #9ca3af;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.empty-message {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.routes-grid {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.route-card {
  position: relative;
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(4px);
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(229, 231, 235, 0.5);
  transition: all 0.3s;
  cursor: pointer;
  transform: translateY(0) scale(1);
}

.route-card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border-color: rgba(209, 213, 219, 0.6);
  background-color: rgba(255, 255, 255, 0.9);
  transform: translateY(-0.25rem) scale(1.02);
}

.route-card:focus-within {
  box-shadow: 0 0 0 2px #3b82f6, 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.route-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0.25rem;
  border-radius: 1rem 0 0 1rem;
}

.route-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.route-info {
  flex: 1;
  min-width: 0;
}

.route-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.route-badge-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.route-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  color: white;
  font-weight: bold;
  font-size: 0.875rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  transform: scale(1);
  transition: all 0.3s;
}

.route-card:hover .route-badge {
  transform: scale(1.05);
}

.route-indicator {
  width: 0.5rem;
  height: 0.5rem;
  background-color: #10b981;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s;
}

.route-card:hover .route-indicator {
  opacity: 1;
}

.route-name {
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.6;
  font-weight: 500;
  margin: 0;
}

.route-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.status-dot-small {
  width: 0.375rem;
  height: 0.375rem;
  background-color: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-text-small {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.route-arrow {
  flex-shrink: 0;
}

.arrow-container {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background-color: rgba(243, 244, 246, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.route-card:hover .arrow-container {
  background-color: rgba(219, 234, 254, 0.8);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  transform: scale(1.1);
}

.arrow-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #9ca3af;
  transition: color 0.3s;
}

.route-card:hover .arrow-icon {
  color: #2563eb;
}

/* Footer */
.sidebar-footer {
  border-top: 1px solid rgba(229, 231, 235, 0.5);
  padding: 1.5rem;
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(24px);
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.footer-dot {
  width: 0.5rem;
  height: 0.5rem;
  background-color: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5);
}

.footer-text {
  font-size: 0.875rem;
  color: #4b5563;
  font-weight: 500;
  margin: 0;
}

.footer-highlight {
  color: #2563eb;
  font-weight: 600;
}

.footer-version {
  font-size: 0.75rem;
  color: #9ca3af;
  font-family: monospace;
}

/* Animations */
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

/* Focus states */
input:focus {
  outline: none;
}
</style>