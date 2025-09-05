<template>
  <div id="app">
    <div class="app-container">
      <MetroMap ref="metroMap" :sidebar-open="sidebarOpen" @data-fetched="resetCountdown" />
      <RouteSidebar ref="sidebar" :countdown-seconds="countdownSeconds" :countdown-percentage="countdownPercentage"
        :is-loading="isLoading" :error="error" @sidebar-toggle="handleSidebarToggle" />
    </div>

    <!-- Mobile backdrop -->
    <div v-if="sidebarOpen && !isDesktop" class="mobile-backdrop" @click="toggleSidebar" aria-hidden="true">
    </div>

    <!-- Mobile menu button -->
    <button v-if="!isDesktop" class="mobile-menu-button" @click="toggleSidebar"
      :aria-label="sidebarOpen ? 'Close sidebar' : 'Open sidebar'">
      <Bars3Icon class="menu-icon" />
    </button>
  </div>
</template>

<script>
import { ref, watch, computed, onUnmounted } from 'vue'
import MetroMap from './components/MetroMap.vue'
import RouteSidebar from './components/RouteSidebar.vue'
import { Bars3Icon } from '@heroicons/vue/24/outline'
import { useScreenSize } from './composables/useScreenSize'
import { MAP_CONFIG } from './constants'

export default {
  name: 'App',
  components: {
    MetroMap,
    RouteSidebar,
    Bars3Icon
  },
  setup() {
    const sidebarOpen = ref(false)
    const { isDesktop } = useScreenSize()

    // Countdown timer data
    const countdownSeconds = ref(0)
    const isLoading = ref(false)
    const error = ref(null)
    const countdownInterval = ref(null)
    const metroMap = ref(null)

    // Watch for screen size changes and adjust sidebar state
    watch(isDesktop, (newIsDesktop) => {
      sidebarOpen.value = newIsDesktop
    }, { immediate: true })

    const toggleSidebar = () => {
      // Only toggle on mobile/tablet screens
      if (!isDesktop.value) {
        sidebarOpen.value = !sidebarOpen.value
      }
    }

    const handleSidebarToggle = (isOpen) => {
      sidebarOpen.value = isOpen
    }

    // Countdown functions
    const startCountdown = () => {
      if (countdownInterval.value) {
        clearInterval(countdownInterval.value)
      }

      countdownSeconds.value = MAP_CONFIG.REFRESH_INTERVAL / 1000

      countdownInterval.value = setInterval(() => {
        countdownSeconds.value -= 0.1
        if (countdownSeconds.value <= 0) {
          countdownSeconds.value = MAP_CONFIG.REFRESH_INTERVAL / 1000
        }
      }, 100)
    }

    const resetCountdown = () => {
      countdownSeconds.value = MAP_CONFIG.REFRESH_INTERVAL / 1000
      if (!countdownInterval.value) {
        startCountdown()
      }
    }

    const stopCountdown = () => {
      if (countdownInterval.value) {
        clearInterval(countdownInterval.value)
        countdownInterval.value = null
      }
    }

    // Computed properties
    const countdownPercentage = computed(() => {
      const totalSeconds = MAP_CONFIG.REFRESH_INTERVAL / 1000
      return ((totalSeconds - countdownSeconds.value) / totalSeconds) * 100
    })

    // Get loading and error states from MetroMap component
    const isLoadingFromMap = computed(() => metroMap.value?.isLoading || false)
    const errorFromMap = computed(() => metroMap.value?.error || null)

    // Start countdown on mount
    startCountdown()

    // Cleanup on unmount
    onUnmounted(() => {
      stopCountdown()
    })

    return {
      sidebarOpen,
      isDesktop,
      toggleSidebar,
      handleSidebarToggle,
      countdownSeconds,
      countdownPercentage,
      isLoading: isLoadingFromMap,
      error: errorFromMap,
      metroMap,
      resetCountdown,
      stopCountdown
    }
  }
}
</script>

<style>
#app {
  height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
}

body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, sans-serif;
}

.app-container {
  display: flex;
  height: 100%;
}

.mobile-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 40;
}

@media (min-width: 1024px) {
  .mobile-backdrop {
    display: none;
  }
}

.mobile-menu-button {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 60;
  background-color: white;
  padding: 0.75rem;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
  transform: scale(1);
}

.mobile-menu-button:hover {
  background-color: #f9fafb;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  transform: scale(1.05);
}

.mobile-menu-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px #3b82f6;
}

.menu-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #4b5563;
}

@media (min-width: 1024px) {
  .mobile-menu-button {
    display: none;
  }
}

@media (max-width: 640px) {
  .mobile-menu-button {
    display: block;
  }
}

@media (min-width: 641px) and (max-width: 1023px) {
  .mobile-menu-button {
    display: block;
  }
}
</style>
