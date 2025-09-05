<template>
  <div id="app">
    <div class="flex h-full">
      <MetroMap :sidebar-open="sidebarOpen" />
      <RouteSidebar ref="sidebar" @sidebar-toggle="handleSidebarToggle" />
    </div>

    <!-- Mobile backdrop -->
    <div v-if="sidebarOpen && !isDesktop" class="fixed inset-0 bg-black/30 z-40 lg:hidden" @click="toggleSidebar"
      aria-hidden="true">
    </div>

    <!-- Mobile menu button -->
    <button v-if="!isDesktop" class="fixed top-4 right-4 z-60 hidden lg:hidden md:block sm:block 
                   bg-white p-3 rounded-xl shadow-lg border border-gray-200
                   hover:bg-gray-50 hover:shadow-xl transition-all duration-200
                   transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
      @click="toggleSidebar" :aria-label="sidebarOpen ? 'Close sidebar' : 'Open sidebar'">
      <Bars3Icon class="w-6 h-6 text-gray-600" />
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
</style>
