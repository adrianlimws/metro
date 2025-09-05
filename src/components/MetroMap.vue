<template>
  <div id="map" :class="mapClasses" role="application" aria-label="Metro transit map">
    <!-- Loading indicator -->
    <div v-if="isLoading" class="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
      <div class="flex items-center space-x-2">
        <div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm font-medium text-gray-700">Loading vehicles...</span>
      </div>
    </div>

    <!-- Error indicator -->
    <div v-if="error"
      class="absolute top-4 left-4 z-10 bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg max-w-sm">
      <div class="flex items-start space-x-2">
        <div class="w-5 h-5 text-red-500 mt-0.5">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div>
          <p class="text-sm font-medium text-red-800">Error loading vehicles</p>
          <p class="text-xs text-red-600 mt-1">{{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import L from 'leaflet'
import { onMounted, onUnmounted, computed, ref, watch } from 'vue'
import { MAP_CONFIG, API_CONFIG, ERROR_MESSAGES } from '../constants'

export default {
  name: 'MetroMap',
  props: {
    sidebarOpen: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const map = ref(null)
    const vehicleLayer = ref(null)
    const vehicles = ref([])
    const isLoading = ref(false)
    const error = ref(null)
    const refreshInterval = ref(null)

    const fetchVehicles = async () => {
      try {
        isLoading.value = true
        error.value = null

        const response = await fetch(API_CONFIG.VEHICLES_ENDPOINT)

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const feed = await response.json()
        vehicles.value = feed.entity || []

      } catch (err) {
        console.error('Error loading vehicles:', err)
        error.value = err.message || ERROR_MESSAGES.VEHICLES_FETCH_FAILED
      } finally {
        isLoading.value = false
      }
    }

    const getVehicleMarkers = () => {
      return vehicles.value
        .filter(entity => entity.vehicle && entity.vehicle.position)
        .map(entity => {
          const { latitude, longitude } = entity.vehicle.position
          const vehicleId = entity.vehicle.vehicle?.id || 'Unknown'
          const routeId = entity.vehicle.trip?.routeId || 'Unknown'

          return {
            position: [latitude, longitude],
            vehicleId,
            routeId,
            popup: `<b>Vehicle:</b> ${vehicleId}<br><b>Route:</b> ${routeId}`
          }
        })
    }

    const initializeMap = () => {
      // Initialize map centered on Christchurch
      map.value = L.map('map').setView(MAP_CONFIG.DEFAULT_CENTER, MAP_CONFIG.DEFAULT_ZOOM)

      // Add tile layer
      L.tileLayer(MAP_CONFIG.TILE_LAYER_URL, {
        attribution: MAP_CONFIG.TILE_ATTRIBUTION
      }).addTo(map.value)
    }

    const updateVehicleMarkers = () => {
      if (!map.value) return

      // Clear old markers
      if (vehicleLayer.value) {
        map.value.removeLayer(vehicleLayer.value)
      }

      const markers = getVehicleMarkers().map(vehicle => {
        const marker = L.marker(vehicle.position).bindPopup(vehicle.popup)
        return marker
      })

      // Add all markers to the map
      vehicleLayer.value = L.layerGroup(markers).addTo(map.value)
    }

    const startAutoRefresh = () => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
      }

      refreshInterval.value = setInterval(fetchVehicles, MAP_CONFIG.REFRESH_INTERVAL)
    }

    const stopAutoRefresh = () => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
        refreshInterval.value = null
      }
    }

    // Watch for vehicle data changes and update markers
    watch(vehicles, updateVehicleMarkers, { deep: true })

    onMounted(async () => {
      // Initialize map first
      initializeMap()

      // Then fetch vehicles and start auto-refresh
      await fetchVehicles()
      startAutoRefresh()
    })

    onUnmounted(() => {
      stopAutoRefresh()
      if (map.value) {
        map.value.remove()
      }
    })

    const mapClasses = computed(() => {
      return 'flex-1'
    })

    return {
      mapClasses,
      isLoading,
      error
    }
  }
}
</script>

<style scoped>
#map {
  height: 100vh;
  flex: 1;
}
</style>
