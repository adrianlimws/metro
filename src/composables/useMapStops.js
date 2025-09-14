import { ref, computed } from 'vue'
import { API_CONFIG } from '@/constants'

/**
 * Composable for managing map stops and their route connections
 */
export function useMapStops() {
  const stops = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const stopRouteConnections = ref(new Map())

  /**
   * Fetch all stops for map display with pagination for performance
   */
  const fetchAllStops = async () => {
    try {
      isLoading.value = true
      error.value = null

      // For map display, we'll fetch a reasonable number of stops initially
      // and implement viewport-based loading for better performance
      const response = await fetch(`${API_CONFIG.CLOUDFLARE_API_BASE}/api/stops?limit=500`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      stops.value = data.data || []
      
      console.log(`Fetched ${stops.value.length} stops for map (${data.pagination.total} total available)`)
      console.log('Sample stops:', stops.value.slice(0, 3))
    } catch (err) {
      console.error('Error fetching stops:', err)
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch route connections for each stop
   */
  const fetchStopRouteConnections = async () => {
    try {
      // Get all stop-times to build connections
      const stopTimesResponse = await fetch(`${API_CONFIG.CLOUDFLARE_API_BASE}/api/stop-times?limit=1000`)
      if (!stopTimesResponse.ok) {
        throw new Error(`HTTP error! status: ${stopTimesResponse.status}`)
      }

      const stopTimesData = await stopTimesResponse.json()
      const stopTimes = stopTimesData.data || []

      // Get all trips to map trip_id to route_id
      const tripsResponse = await fetch(`${API_CONFIG.CLOUDFLARE_API_BASE}/api/trips`)
      if (!tripsResponse.ok) {
        throw new Error(`HTTP error! status: ${tripsResponse.status}`)
      }

      const tripsData = await tripsResponse.json()
      const trips = tripsData.data || []

      // Create trip_id to route_id mapping
      const tripToRouteMap = new Map()
      trips.forEach(trip => {
        tripToRouteMap.set(trip.trip_id, {
          route_id: trip.route_id,
          route_short_name: trip.trip_short_name,
          route_headsign: trip.trip_headsign
        })
      })

      // Build stop to routes mapping
      const connections = new Map()
      stopTimes.forEach(stopTime => {
        const stopId = stopTime.stop_id
        const tripInfo = tripToRouteMap.get(stopTime.trip_id)
        
        if (tripInfo) {
          if (!connections.has(stopId)) {
            connections.set(stopId, new Set())
          }
          connections.get(stopId).add(tripInfo)
        }
      })

      // Convert Set to Array for easier use
      const stopRouteMap = new Map()
      connections.forEach((routeSet, stopId) => {
        stopRouteMap.set(stopId, Array.from(routeSet))
      })

      stopRouteConnections.value = stopRouteMap
      console.log(`Built route connections for ${stopRouteMap.size} stops`)
      console.log('Sample connections:', Array.from(stopRouteMap.entries()).slice(0, 3))
    } catch (err) {
      console.error('Error fetching stop route connections:', err)
      error.value = err.message
    }
  }

  /**
   * Get routes that serve a specific stop
   */
  const getRoutesForStop = (stopId) => {
    return stopRouteConnections.value.get(stopId) || []
  }

  /**
   * Get stops that are served by a specific route
   */
  const getStopsForRoute = async (routeId) => {
    if (!stops.value.length) return []
    
    try {
      // Use route_id directly in stop-times (if the API supports it)
      const stopTimesResponse = await fetch(`${API_CONFIG.CLOUDFLARE_API_BASE}/api/stop-times?route_id=${routeId}`)
      const stopTimes = await stopTimesResponse.json()
      
      if (!stopTimes.data || stopTimes.data.length === 0) {
        console.log(`No stop-times found for route ${routeId}`)
        return []
      }
      
      // Get unique stop IDs
      const stopIds = [...new Set(stopTimes.data.map(st => st.stop_id))]
      console.log(`Found ${stopIds.length} unique stops for route ${routeId}`)
      
      // Filter stops
      const routeStops = stops.value.filter(stop => stopIds.includes(stop.stop_id))
      console.log(`Filtered to ${routeStops.length} stops for route ${routeId}`)
      
      return routeStops
    } catch (error) {
      console.error('Error getting stops for route:', error)
      return []
    }
  }

  /**
   * Get stops with their route information for map display
   */
  const stopsWithRoutes = computed(() => {
    return stops.value.map(stop => ({
      ...stop,
      routes: getRoutesForStop(stop.stop_id),
      routeCount: getRoutesForStop(stop.stop_id).length
    }))
  })

  /**
   * Get stops without route connections (for debugging)
   */
  const stopsWithoutRoutes = computed(() => {
    return stops.value.map(stop => ({
      ...stop,
      routes: [],
      routeCount: 0
    }))
  })

  /**
   * Get stops filtered by route
   */
  const getStopsByRoute = (routeId) => {
    return stopsWithRoutes.value.filter(stop => 
      stop.routes.some(route => route.route_id === routeId)
    )
  }

  /**
   * Get stops within a geographic bounds
   */
  const getStopsInBounds = (bounds) => {
    return stopsWithRoutes.value.filter(stop => {
      const lat = parseFloat(stop.stop_lat)
      const lon = parseFloat(stop.stop_lon)
      return lat >= bounds.south && lat <= bounds.north && 
             lon >= bounds.west && lon <= bounds.east
    })
  }

  /**
   * Load more stops for the current viewport
   */
  const loadMoreStops = async (bounds) => {
    try {
      const response = await fetch(`${API_CONFIG.CLOUDFLARE_API_BASE}/api/stops?limit=1000&min_lat=${bounds.south}&max_lat=${bounds.north}&min_lon=${bounds.west}&max_lon=${bounds.east}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const newStops = data.data || []
      
      // Merge with existing stops, avoiding duplicates
      const existingStopIds = new Set(stops.value.map(s => s.stop_id))
      const uniqueNewStops = newStops.filter(stop => !existingStopIds.has(stop.stop_id))
      
      stops.value = [...stops.value, ...uniqueNewStops]
      
      console.log(`Loaded ${uniqueNewStops.length} additional stops for viewport`)
    } catch (err) {
      console.error('Error loading more stops:', err)
    }
  }

  /**
   * Initialize stops and route connections
   */
  const initialize = async () => {
    await Promise.all([
      fetchAllStops(),
      fetchStopRouteConnections()
    ])
  }

  return {
    stops,
    stopsWithRoutes,
    stopsWithoutRoutes,
    isLoading,
    error,
    stopRouteConnections,
    fetchAllStops,
    fetchStopRouteConnections,
    getRoutesForStop,
    getStopsForRoute,
    getStopsByRoute,
    getStopsInBounds,
    loadMoreStops,
    initialize
  }
}
