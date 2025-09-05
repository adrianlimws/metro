<template>
  <div id="app">
    <div class="app-container">
      <MetroMap :sidebar-open="sidebarOpen" />
      <RouteSidebar ref="sidebar" @sidebar-toggle="handleSidebarToggle" />
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
import { ref, watch } from 'vue'
import MetroMap from './components/MetroMap.vue'
import RouteSidebar from './components/RouteSidebar.vue'
import { Bars3Icon } from '@heroicons/vue/24/outline'
import { useScreenSize } from './composables/useScreenSize'

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

    return {
      sidebarOpen,
      isDesktop,
      toggleSidebar,
      handleSidebarToggle
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
