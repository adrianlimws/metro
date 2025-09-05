import { ref, onMounted, onUnmounted } from 'vue'
import { API_CONFIG, MAP_CONFIG, ERROR_MESSAGES } from '../constants'

/**
 * Composable for managing vehicle data and API calls
 * @returns {Object} Vehicle data and management functions
 */
export function useVehicles() {
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

  onMounted(() => {
    fetchVehicles()
    startAutoRefresh()
  })

  onUnmounted(() => {
    stopAutoRefresh()
  })

  return {
    vehicles,
    isLoading,
    error,
    fetchVehicles,
    startAutoRefresh,
    stopAutoRefresh,
    getVehicleMarkers
  }
}
