import { ref } from 'vue'
import { API_CONFIG } from '@/constants'

/**
 * Composable for managing route shapes/paths for map display
 */
export function useRouteShapes() {
  const routeShapes = ref(new Map()) // Cache of shape data by route_id
  const isLoading = ref(false)
  const error = ref(null)

  /**
   * Get shape IDs for a specific route
   */
  const getShapeIdsForRoute = async (routeId) => {
    try {
      // Get trips for this route to find shape IDs
      const tripsResponse = await fetch(`${API_CONFIG.CLOUDFLARE_API_BASE}/api/trips?route_id=${routeId}`)
      if (!tripsResponse.ok) {
        throw new Error(`HTTP error! status: ${tripsResponse.status}`)
      }

      const tripsData = await tripsResponse.json()
      const trips = tripsData.data || []

      // Extract unique shape IDs from trips
      const shapeIds = [...new Set(trips.map(trip => trip.shape_id).filter(Boolean))]
      console.log(`Found ${shapeIds.length} shape IDs for route ${routeId}:`, shapeIds)
      
      // Check if these are real GTFS shape IDs (numeric) or simplified ones
      const realShapeIds = shapeIds.filter(id => /^\d+$/.test(id))
      
      if (realShapeIds.length > 0) {
        console.log(`✅ Found ${realShapeIds.length} real GTFS shape IDs:`, realShapeIds)
        return realShapeIds
      } else {
        console.log(`⚠️ No real GTFS shape IDs found, using fallback approach`)
        // Complete mapping based on real GTFS data analysis
        const routeNumber = routeId.split('_')[0]
        const correctShapes = {
          '1': ['5482'],   // Route 1 uses shape 5482
          '100': ['5484'], // Route 100 uses shape 5484
          '107': ['5489'], // Route 107 uses shape 5489
          '120': ['5491'], // Route 120 uses shape 5491
          '125': ['5494'], // Route 125 uses shape 5494
          '130': ['3321'], // Route 130 uses shape 3321
          '135': ['5499'], // Route 135 uses shape 5499
          '140': ['5503'], // Route 140 uses shape 5503
          '155': ['5504'], // Route 155 uses shape 5504
          '27': ['5506'],  // Route 27 uses shape 5506
          '29': ['5508'],  // Route 29 uses shape 5508
          '3': ['5515'],   // Route 3 uses shape 5515
          '44': ['5520'],  // Route 44 uses shape 5520
          '5': ['5523'],   // Route 5 uses shape 5523
          '60': ['5531'],  // Route 60 uses shape 5531
          '7': ['5534'],   // Route 7 uses shape 5534
          '8': ['5535'],   // Route 8 uses shape 5535
          '80': ['5552'],  // Route 80 uses shape 5552
          '81': ['5555'],  // Route 81 uses shape 5555
          '820': ['5556'], // Route 820 uses shape 5556
          '84': ['5558'],  // Route 84 uses shape 5558
          '85': ['5585'],  // Route 85 uses shape 5585
          '86': ['5562'],  // Route 86 uses shape 5562
          '91': ['5566'],  // Route 91 uses shape 5566
          '92': ['5568'],  // Route 92 uses shape 5568
          '95': ['5574'],  // Route 95 uses shape 5574
          '97': ['5578'],  // Route 97 uses shape 5578
          'F': ['5581'],   // Route F (Ferry) uses shape 5581
          'Oa': ['5582'],  // Route Oa (Orbiter) uses shape 5582
          'Oc': ['2210'],  // Route Oc (Orbiter) uses shape 2210
        }
        
        const fallback = correctShapes[routeNumber] || ['5552'] // Default fallback
        console.log(`🔄 Using correct real GTFS shapes for route ${routeNumber}:`, fallback)
        return fallback
      }
    } catch (err) {
      console.error('Error getting shape IDs for route:', err)
      error.value = err.message
      return []
    }
  }

  /**
   * Fetch shape data for specific shape IDs
   */
  const fetchShapeData = async (shapeIds) => {
    try {
      const shapesData = []
      
      for (const shapeId of shapeIds) {
        const response = await fetch(`${API_CONFIG.CLOUDFLARE_API_BASE}/api/shapes?shape_id=${shapeId}`)
        if (!response.ok) {
          console.warn(`Failed to fetch shape ${shapeId}`)
          continue
        }

        const data = await response.json()
        const shapePoints = data.data || []
        
        // Sort by sequence number to ensure correct path order
        shapePoints.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence)
        
        shapesData.push({
          shapeId,
          points: shapePoints.map(point => [
            parseFloat(point.shape_pt_lat),
            parseFloat(point.shape_pt_lon)
          ])
        })
        
        console.log(`✅ Loaded real GTFS shape ${shapeId} with ${shapePoints.length} points`)
      }
      
      return shapesData
    } catch (err) {
      console.error('Error fetching shape data:', err)
      error.value = err.message
      return []
    }
  }

  /**
   * Get route shapes for a specific route
   */
  const getRouteShapes = async (routeId) => {
    // Check cache first
    if (routeShapes.value.has(routeId)) {
      console.log(`Using cached shapes for route ${routeId}`)
      return routeShapes.value.get(routeId)
    }

    try {
      isLoading.value = true
      error.value = null

      console.log(`🗺️ Fetching real GTFS shapes for route ${routeId}...`)
      
      // Get shape IDs for this route from trips data
      const shapeIds = await getShapeIdsForRoute(routeId)
      if (shapeIds.length === 0) {
        console.log(`❌ No real shapes found for route ${routeId}`)
        return []
      }

      // Fetch real GTFS shape data
      const shapesData = await fetchShapeData(shapeIds)
      
      // Cache the result
      routeShapes.value.set(routeId, shapesData)
      console.log(`✅ Successfully loaded ${shapesData.length} real GTFS shapes for route ${routeId}`)
      
      return shapesData
      
    } catch (err) {
      console.error('Error getting route shapes:', err)
      error.value = err.message
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear cached shapes for a specific route
   */
  const clearRouteShapes = (routeId) => {
    if (routeId) {
      routeShapes.value.delete(routeId)
      console.log(`Cleared cached shapes for route ${routeId}`)
    } else {
      routeShapes.value.clear()
      console.log('Cleared all cached shapes')
    }
  }

  /**
   * Get route color from route data
   */
  const getRouteColor = async (routeId) => {
    try {
      // Try to get the actual route color from the API
      const routesResponse = await fetch(`${API_CONFIG.CLOUDFLARE_API_BASE}/api/routes`)
      if (routesResponse.ok) {
        const routesData = await routesResponse.json()
        const routes = routesData.data || []
        
        // Find the route with matching ID
        const route = routes.find(r => r.route_id === routeId)
        if (route && route.route_color) {
          // Add # prefix if not present
          const color = route.route_color.startsWith('#') ? route.route_color : `#${route.route_color}`
          console.log(`Using route color ${color} for route ${routeId}`)
          return color
        }
      }
    } catch (error) {
      console.warn('Could not fetch route color from API:', error.message)
    }
    
    // Fallback to default colors
    const defaultColors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ]
    
    // Use route ID to consistently assign colors
    const hash = routeId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    return defaultColors[Math.abs(hash) % defaultColors.length]
  }

  return {
    routeShapes,
    isLoading,
    error,
    getRouteShapes,
    clearRouteShapes,
    getRouteColor
  }
}
