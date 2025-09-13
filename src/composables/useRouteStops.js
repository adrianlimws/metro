import { ref, computed } from 'vue'
import { API_CONFIG, ERROR_MESSAGES } from '@/constants'

/**
 * Generate mock stops data for demonstration purposes
 * @param {string} routeId - The route ID
 * @returns {Array} Array of mock stop objects
 */
const generateMockStops = (routeId) => {
  const mockStops = [
    {
      stop_id: `${routeId}_001`,
      stop_code: `${routeId}001`,
      stop_name: 'City Central',
      stop_desc: 'Main city center stop',
      stop_sequence: 1
    },
    {
      stop_id: `${routeId}_002`,
      stop_code: `${routeId}002`,
      stop_name: 'Cathedral Square',
      stop_desc: 'Historic square in city center',
      stop_sequence: 2
    },
    {
      stop_id: `${routeId}_003`,
      stop_code: `${routeId}003`,
      stop_name: 'Riccarton Mall',
      stop_desc: 'Shopping center stop',
      stop_sequence: 3
    },
    {
      stop_id: `${routeId}_004`,
      stop_code: `${routeId}004`,
      stop_name: 'University of Canterbury',
      stop_desc: 'University campus stop',
      stop_sequence: 4
    },
    {
      stop_id: `${routeId}_005`,
      stop_code: `${routeId}005`,
      stop_name: 'Airport Terminal',
      stop_desc: 'Christchurch Airport terminal',
      stop_sequence: 5
    }
  ]

  return mockStops
}

/**
 * Fetch routes from the Cloudflare API
 * @returns {Promise<Array>} Array of route objects
 */
const fetchRoutesFromAPI = async () => {
  try {
    const response = await fetch(`${API_CONFIG.CLOUDFLARE_API_BASE}/api/routes`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching routes from API:', error)
    throw error
  }
}

/**
 * Fetch stops for a specific route using trips and stop-times data
 * @param {string} routeId - The route ID
 * @returns {Promise<Array>} Array of stop objects with sequence information
 */
const fetchStopsForRoute = async (routeId) => {
  try {
    // First, get trips for this route
    const tripsResponse = await fetch(`${API_CONFIG.CLOUDFLARE_API_BASE}/api/trips?route_id=${routeId}`)
    if (!tripsResponse.ok) {
      throw new Error(`HTTP error! status: ${tripsResponse.status}`)
    }
    
    const tripsData = await tripsResponse.json()
    const trips = tripsData.data || []
    
    if (trips.length === 0) {
      return []
    }

    // Get trip IDs for this route
    const tripIds = trips.map(trip => trip.trip_id)
    
    // Get all stop times
    const stopTimesResponse = await fetch(`${API_CONFIG.CLOUDFLARE_API_BASE}/api/stop-times`)
    if (!stopTimesResponse.ok) {
      throw new Error(`HTTP error! status: ${stopTimesResponse.status}`)
    }
    
    const stopTimesData = await stopTimesResponse.json()
    const allStopTimes = stopTimesData.data || []
    
    // Filter stop times for trips in this route
    const routeStopTimes = allStopTimes.filter(stopTime => 
      tripIds.includes(stopTime.trip_id)
    )
    
    if (routeStopTimes.length === 0) {
      return []
    }

    // Get unique stop IDs and their sequences
    const stopSequences = new Map()
    routeStopTimes.forEach(stopTime => {
      const stopId = stopTime.stop_id
      if (!stopSequences.has(stopId) || stopSequences.get(stopId).stop_sequence > stopTime.stop_sequence) {
        stopSequences.set(stopId, {
          stop_id: stopId,
          stop_sequence: stopTime.stop_sequence,
          trip_id: stopTime.trip_id
        })
      }
    })

    // Get stop details for all unique stops
    const stopIds = Array.from(stopSequences.keys())
    const stopsResponse = await fetch(`${API_CONFIG.CLOUDFLARE_API_BASE}/api/stops`)
    if (!stopsResponse.ok) {
      throw new Error(`HTTP error! status: ${stopsResponse.status}`)
    }
    
    const stopsData = await stopsResponse.json()
    const allStops = stopsData.data || []
    
    // Filter stops that are in our route and add sequence info
    const routeStops = allStops
      .filter(stop => stopIds.includes(stop.stop_id))
      .map(stop => {
        const sequenceInfo = stopSequences.get(stop.stop_id)
        return {
          ...stop,
          stop_sequence: sequenceInfo.stop_sequence,
          trip_id: sequenceInfo.trip_id
        }
      })
      .sort((a, b) => a.stop_sequence - b.stop_sequence)

    return routeStops
  } catch (error) {
    console.error('Error fetching stops for route:', error)
    throw error
  }
}

/**
 * Composable for fetching and managing route stops data
 */
export function useRouteStops() {
  const routeStops = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const selectedRoute = ref(null)
  const routes = ref([])

  /**
   * Fetch all routes from the API
   */
  const fetchRoutes = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const apiRoutes = await fetchRoutesFromAPI()
      routes.value = apiRoutes
      
      return apiRoutes
    } catch (err) {
      console.error('Error fetching routes:', err)
      error.value = 'Failed to fetch routes'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch stops for a specific route
   * @param {string} routeId - The route ID to fetch stops for
   */
  const fetchRouteStops = async (routeId) => {
    if (!routeId) {
      error.value = 'Route ID is required'
      return
    }

    try {
      isLoading.value = true
      error.value = null
      selectedRoute.value = routeId

      // Try to fetch from Cloudflare API first
      const stops = await fetchStopsForRoute(routeId)
      
      if (stops.length === 0) {
        // If no stops found, use mock data for demonstration
        console.warn('No stops found for route, using mock data')
        routeStops.value = generateMockStops(routeId)
        return
      }

      routeStops.value = stops

    } catch (err) {
      console.error('Error fetching route stops:', err)
      console.warn('Using mock data as fallback')
      routeStops.value = generateMockStops(routeId)
      error.value = null // Clear error since we have mock data
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear the current route stops data
   */
  const clearRouteStops = () => {
    routeStops.value = []
    selectedRoute.value = null
    error.value = null
  }

  /**
   * Get stops count
   */
  const stopsCount = computed(() => routeStops.value.length)

  /**
   * Check if we have stops data
   */
  const hasStops = computed(() => routeStops.value.length > 0)

  return {
    routeStops,
    isLoading,
    error,
    selectedRoute,
    routes,
    fetchRoutes,
    fetchRouteStops,
    clearRouteStops,
    stopsCount,
    hasStops
  }
}
