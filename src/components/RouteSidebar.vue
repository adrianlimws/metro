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
  <div class="sidebar-container h-screen bg-white/80 backdrop-blur-xl border-l border-gray-200/50 overflow-y-auto
              w-80 lg:w-80 md:w-72 sm:w-64
              transform transition-all duration-300 ease-in-out" :class="isOpen ? 'block' : 'hidden lg:block'"
    style="min-height: 100vh; box-shadow: -8px 0 32px rgba(0,0,0,0.04);">

    <!-- Header -->
    <div
      class="sticky top-0 z-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-5">
        <div class="absolute inset-0"
          style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0); background-size: 20px 20px;">
        </div>
      </div>

      <div class="relative z-10">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div
              class="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold tracking-tight">Bus Routes</h1>
              <p class="text-slate-300 text-sm font-medium">Metro Transit</p>
            </div>
          </div>
          <button
            class="hidden lg:hidden md:block sm:block p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20"
            @click="toggleSidebar">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
            <p class="text-sm text-slate-300 font-medium">{{ routes.length }} routes available</p>
          </div>
          <div class="text-xs text-slate-400 font-mono">Live</div>
        </div>
      </div>
    </div>

    <!-- Search/Filter -->
    <div class="sticky top-[88px] z-10 p-6 bg-white/60 backdrop-blur-xl border-b border-gray-200/50">
      <div class="relative group">
        <input v-model="searchQuery" type="text" placeholder="Search routes..." class="w-full pl-12 pr-12 py-4 border border-gray-200/60 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm 
                      focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 focus:shadow-lg focus:bg-white
                      transition-all duration-300 placeholder-gray-400 text-gray-700 font-medium
                      group-hover:border-gray-300/60 group-hover:shadow-md">

        <!-- Search Icon -->
        <div class="absolute left-4 top-1/2 -translate-y-1/2">
          <svg class="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none"
            stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        <!-- Clear Button -->
        <div v-if="searchQuery" class="absolute right-4 top-1/2 -translate-y-1/2">
          <button @click="clearSearch"
            class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            aria-label="Clear search">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Routes List -->
    <div class="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white/50 custom-scrollbar">
      <!-- Empty State -->
      <div v-if="filteredRoutes.length === 0 && searchQuery" class="p-12 text-center">
        <div
          class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center shadow-inner">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">No routes found</h3>
        <p class="text-sm text-gray-500">Try adjusting your search terms</p>
      </div>

      <!-- Routes Grid -->
      <div v-else class="p-6 space-y-4">
        <div v-for="route in filteredRoutes" :key="route.id" class="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-200/50 
                    hover:shadow-xl hover:border-gray-300/60 hover:bg-white/90
                    transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:scale-[1.02]
                    focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2" tabindex="0"
          role="button" :aria-label="`Route ${route.id}: ${route.name}`" @keydown.enter="$emit('route-selected', route)"
          @keydown.space.prevent="$emit('route-selected', route)">

          <!-- Route Color Accent -->
          <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" :style="{ backgroundColor: route.color }"></div>

          <div class="flex items-start space-x-4">
            <!-- Route Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-3">
                  <span class="px-3 py-1.5 rounded-lg text-white font-bold text-sm shadow-md
                             transform group-hover:scale-105 transition-all duration-300"
                    :style="{ backgroundColor: route.color }">
                    Route {{ route.id }}
                  </span>
                </div>
                <div
                  class="w-2 h-2 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                </div>
              </div>
              <p class="text-sm text-gray-600 leading-relaxed font-medium">{{ route.name }}</p>

              <!-- Route Status -->
              <div class="flex items-center space-x-2 mt-3">
                <div class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <span class="text-xs text-gray-500 font-medium">{{ getRouteStatus() }}</span>
              </div>
            </div>

            <!-- Arrow Icon -->
            <div class="flex-shrink-0">
              <div class="w-10 h-10 rounded-xl bg-gray-100/80 group-hover:bg-blue-100/80 
                         flex items-center justify-center transition-all duration-300
                         group-hover:shadow-md group-hover:scale-110">
                <ChevronRightIcon class="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="border-t border-gray-200/50 p-6 bg-white/60 backdrop-blur-xl">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/50"></div>
          <p class="text-sm text-gray-600 font-medium">
            Data by <span class="text-blue-600 font-semibold">MetroInfo</span>
          </p>
        </div>
        <div class="text-xs text-gray-400 font-mono">v2.1</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar-container {
  /* Desktop: relative positioning for flex layout */
  position: relative;
}

/* Mobile/Tablet: fixed positioning for overlay */
@media (max-width: 1023px) {
  .sidebar-container {
    position: fixed;
    right: 0;
    top: 0;
    z-index: 50;
  }
}

/* Enhanced scrollbars moved to global styles */

/* Smooth entrance animations */
.sidebar-container {
  animation: slideIn 0.3s ease-out;
}

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

/* Enhanced focus states */
input:focus {
  outline: none;
}

/* Backdrop blur styles moved to global styles */
</style>