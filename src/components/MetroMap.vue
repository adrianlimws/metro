<template>
    <div id="map" :class="mapClasses" role="application" aria-label="Metro transit map">
        <!-- Loading indicator -->
        <div v-if="isLoading" class="loading-indicator">
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading vehicles...</span>
            </div>
        </div>

        <!-- Error indicator -->
        <div v-if="error" class="error-indicator">
            <div class="error-content">
                <div class="error-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div>
                    <p class="error-title">Error loading vehicles</p>
                    <p class="error-message">{{ error }}</p>
                </div>
            </div>
        </div>

        <!-- Location permission button -->
        <div v-if="locationError && !userLocation" class="location-permission-indicator">
            <div class="location-permission-content">
                <div class="location-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z">
                        </path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                </div>
                <div>
                    <p class="location-title">Enable Location</p>
                    <p class="location-message">{{ locationError }}</p>
                    <button @click="handleRequestLocation" :disabled="isLocating" class="location-button">
                        <span v-if="isLocating">Locating...</span>
                        <span v-else>Enable Location</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import L from 'leaflet'
import { onMounted, onUnmounted, computed, ref, watch } from 'vue'
import { MAP_CONFIG, API_CONFIG, ERROR_MESSAGES } from '../constants'
import { getRouteById } from '../data/busRoutes'
import { useGeolocation } from '../composables/useGeolocation'
import { useMapStops } from '../composables/useMapStops'

export default {
    name: 'MetroMap',
    props: {
        sidebarOpen: {
            type: Boolean,
            default: false
        },
        selectedRoute: {
            type: Object,
            default: null
        }
    },
    emits: ['data-fetched'],
    setup(props, { emit }) {
        const map = ref(null)
        const vehicleLayer = ref(null)
        const stopsLayer = ref(null)
        const userLocationLayer = ref(null)
        const vehicles = ref([])
        const isLoading = ref(false)
        const error = ref(null)
        const refreshInterval = ref(null)
        const showStops = ref(true)

        // GPS location functionality
        const { userLocation, isLocating, locationError, getCurrentLocation, startWatchingLocation, stopWatchingLocation } = useGeolocation()

        // Stops functionality
        const {
            stops,
            stopsWithRoutes,
            stopsWithoutRoutes,
            isLoading: stopsLoading,
            error: stopsError,
            initialize: initializeStops,
            getStopsByRoute
        } = useMapStops()

        // Debug stops data
        watch(stops, (newStops) => {
            console.log('Stops data updated:', newStops.length, 'stops')
        }, { immediate: true })

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

                // Emit event to reset countdown in parent
                emit('data-fetched')

            } catch (err) {
                console.error('Error loading vehicles:', err)
                error.value = err.message || ERROR_MESSAGES.VEHICLES_FETCH_FAILED
            } finally {
                isLoading.value = false
            }
        }

        const getVehicleMarkers = () => {
            return vehicles.value
                .filter(entity => {
                    // Filter by selected route if one is selected
                    if (props.selectedRoute) {
                        const fullRouteId = entity.vehicle?.trip?.routeId || 'Unknown'
                        const routeId = fullRouteId.split('_')[0]
                        return routeId === props.selectedRoute.id && entity.vehicle && entity.vehicle.position
                    }
                    // If no route selected, show all vehicles
                    return entity.vehicle && entity.vehicle.position
                })
                .map(entity => {
                    const { latitude, longitude } = entity.vehicle.position
                    const vehicleId = entity.vehicle.vehicle?.id || 'Unknown'
                    const fullRouteId = entity.vehicle.trip?.routeId || 'Unknown'

                    // Extract the actual route number from the API format (e.g., "100_0432_8_3" -> "100")
                    const routeId = fullRouteId.split('_')[0]

                    // Get route information for styling
                    const routeInfo = getRouteById(routeId)
                    const routeColor = routeInfo?.color || '#666666'
                    const routeName = routeInfo?.name || 'Unknown Route'

                    return {
                        position: [latitude, longitude],
                        vehicleId,
                        routeId,
                        fullRouteId,
                        routeColor,
                        routeName,
                        popup: `<b>Vehicle:</b> ${vehicleId}<br><b>Route:</b> ${routeId}<br><b>Name:</b> ${routeName}<br><b>Full ID:</b> ${fullRouteId}`
                    }
                })
        }

        const getStopMarkers = async () => {
            if (!showStops.value) {
                console.log('Stops are disabled')
                return []
            }

            // Use basic stops array directly - always show all stops
            let stopsToShow = stops.value
            console.log('Total stops available:', stopsToShow.length)

            console.log('Creating markers for', stopsToShow.length, 'stops')
            return stopsToShow.map(stop => {
                const lat = parseFloat(stop.stop_lat)
                const lon = parseFloat(stop.stop_lon)

                // Create popup content
                const popup = `
                    <div style="min-width: 200px;">
                        <h3 style="margin: 0 0 8px 0; color: #333;">${stop.stop_name}</h3>
                        <p style="margin: 4px 0; font-size: 12px; color: #666;">ID: ${stop.stop_id}</p>
                        <p style="margin: 4px 0; font-size: 12px; color: #666;">Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}</p>
                        ${stop.wheelchair_boarding === 1 ? '<p style="margin: 4px 0; font-size: 12px; color: #059669;">♿ Wheelchair accessible</p>' : ''}
                    </div>
                `

                return {
                    position: [lat, lon],
                    stopId: stop.stop_id,
                    stopName: stop.stop_name,
                    routes: [],
                    routeCount: 0,
                    wheelchairAccessible: stop.wheelchair_boarding === 1,
                    popup
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

        const createRouteCircleMarker = (vehicle) => {
            // Create HTML string for the route circle marker
            const circleHtml = `
        <div class="route-circle-marker" style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: ${vehicle.routeColor};
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          color: white;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
          cursor: pointer;
          transition: transform 0.2s ease;
        ">
          ${vehicle.routeId}
        </div>
      `

            return circleHtml
        }

        const createUserLocationMarker = () => {
            // Create HTML string for the user location marker with pulsing animation
            const userLocationHtml = `
        <div class="user-location-marker">
          <div class="user-location-pulse"></div>
          <div class="user-location-dot"></div>
        </div>
      `

            return userLocationHtml
        }

        const createStopMarker = (stop) => {
            // Different styles based on route count and accessibility
            const size = stop.routeCount > 3 ? '16px' : '12px'
            const backgroundColor = stop.wheelchairAccessible ? '#059669' : '#6b7280'
            const borderColor = stop.routeCount > 1 ? '#3b82f6' : '#6b7280'

            const stopHtml = `
        <div class="stop-marker" style="
          width: ${size};
          height: ${size};
          border-radius: 50%;
          background-color: ${backgroundColor};
          border: 2px solid ${borderColor};
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: white;
          font-weight: bold;
          text-shadow: 1px 1px 1px rgba(0,0,0,0.7);
          cursor: pointer;
          transition: transform 0.2s ease;
        ">
          ${stop.wheelchairAccessible ? '♿' : (stop.routeCount > 1 ? stop.routeCount : '●')}
        </div>
      `

            return stopHtml
        }

        const updateVehicleMarkers = () => {
            if (!map.value) return

            // Clear old markers
            if (vehicleLayer.value) {
                map.value.removeLayer(vehicleLayer.value)
            }

            const markers = getVehicleMarkers().map(vehicle => {
                const circleElement = createRouteCircleMarker(vehicle)
                const marker = L.marker(vehicle.position, {
                    icon: L.divIcon({
                        html: circleElement,
                        className: 'custom-route-marker',
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                    })
                }).bindPopup(vehicle.popup)

                return marker
            })

            // Add all markers to the map
            vehicleLayer.value = L.layerGroup(markers).addTo(map.value)
        }

        const updateStopMarkers = async () => {
            console.log('🔄 updateStopMarkers called, map:', !!map.value, 'showStops:', showStops.value)
            if (!map.value || !showStops.value) {
                console.log('❌ Skipping stop markers - map or showStops not ready')
                return
            }

            console.log('🧹 Clearing old stop markers...')
            // Clear old stop markers
            if (stopsLayer.value) {
                map.value.removeLayer(stopsLayer.value)
            }

            console.log('🎯 Creating new stop markers...')
            const stopMarkersData = await getStopMarkers()
            const stopMarkers = stopMarkersData.map(stop => {
                const stopElement = createStopMarker(stop)
                const marker = L.marker(stop.position, {
                    icon: L.divIcon({
                        html: stopElement,
                        className: 'custom-stop-marker',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    })
                }).bindPopup(stop.popup)

                return marker
            })

            // Add all stop markers to the map
            console.log(`📍 Adding ${stopMarkers.length} stop markers to map...`)
            stopsLayer.value = L.layerGroup(stopMarkers).addTo(map.value)
            console.log('✅ Stop markers added to map successfully')
        }

        const updateUserLocationMarker = () => {
            if (!map.value || !userLocation.value) return

            // Clear old user location marker
            if (userLocationLayer.value) {
                map.value.removeLayer(userLocationLayer.value)
            }

            // Create user location marker
            const userLocationElement = createUserLocationMarker()
            const userMarker = L.marker(userLocation.value, {
                icon: L.divIcon({
                    html: userLocationElement,
                    className: 'custom-user-location-marker',
                    iconSize: [30, 30],
                    iconAnchor: [20, 20]
                })
            }).bindPopup('Your location')

            // Add user location marker to the map
            userLocationLayer.value = L.layerGroup([userMarker]).addTo(map.value)
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

        const handleRequestLocation = async () => {
            try {
                await getCurrentLocation()
                startWatchingLocation()
            } catch (error) {
                console.warn('Could not get user location:', error.message)
            }
        }

        // Watch for vehicle data changes and update markers
        watch(vehicles, updateVehicleMarkers, { deep: true })

        // Watch for stops data changes and update markers
        watch(stops, updateStopMarkers, { deep: true })

        // Watch for user location changes and update marker
        watch(userLocation, updateUserLocationMarker)

        // Watch for selected route changes and update markers
        watch(() => props.selectedRoute, () => {
            updateVehicleMarkers()
            updateStopMarkers()
        })

        // Watch for showStops changes
        watch(showStops, updateStopMarkers)

        onMounted(async () => {
            console.log('🚀 MetroMap onMounted starting...')

            // Initialize map first
            initializeMap()
            console.log('✅ Map initialized')

            // Initialize stops and fetch vehicles in parallel
            console.log('📡 Fetching stops and vehicles...')
            await Promise.all([
                initializeStops(),
                fetchVehicles()
            ])
            console.log('✅ Stops and vehicles fetched')

            startAutoRefresh()

            // Try to get user location
            try {
                await getCurrentLocation()
                startWatchingLocation()
            } catch (error) {
                console.warn('Could not get user location:', error.message)
            }

            console.log('🎯 MetroMap initialization complete')
        })

        onUnmounted(() => {
            stopAutoRefresh()
            stopWatchingLocation()
            if (map.value) {
                map.value.remove()
            }
        })

        const mapClasses = computed(() => {
            return 'flex-1 pb-20 lg:pb-0'
        })

        return {
            mapClasses,
            isLoading,
            error,
            userLocation,
            isLocating,
            locationError,
            handleRequestLocation,
            showStops,
            stopsLoading,
            stopsError,
            stopsWithRoutes
        }
    }
}
</script>

<style scoped>
#map {
    height: 100vh;
    flex: 1;
    position: relative;
}

/* Stop marker styles */
:deep(.custom-stop-marker) {
    background: transparent;
    border: none;
}

:deep(.stop-marker) {
    position: relative;
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s ease;
}

:deep(.stop-marker:hover) {
    transform: scale(1.2);
}

/* User location marker styles */
:deep(.custom-user-location-marker) {
    background: transparent;
    border: none;
}

:deep(.user-location-marker) {
    position: relative;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

:deep(.user-location-dot) {
    width: 12px;
    height: 12px;
    background-color: #3b82f6;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    z-index: 2;
    position: relative;
}

:deep(.user-location-pulse) {
    position: absolute;
    width: 20px;
    height: 20px;
    background-color: #3b82f6;
    border-radius: 50%;
    opacity: 0.3;
    animation: user-location-pulse 2s infinite;
    z-index: 1;
}

@keyframes user-location-pulse {
    0% {
        transform: scale(0.5);
        opacity: 0.3;
    }

    50% {
        transform: scale(1.2);
        opacity: 0.1;
    }

    100% {
        transform: scale(1.5);
        opacity: 0;
    }
}

/* Location permission indicator styles */
.location-permission-indicator {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 1002;
    background-color: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
    border-radius: 0.5rem;
    padding: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    max-width: 300px;
}

.location-permission-content {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
}

.location-icon {
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    color: #3b82f6;
}

.location-title {
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
    font-size: 0.875rem;
}

.location-message {
    color: #6b7280;
    margin: 0 0 0.75rem 0;
    font-size: 0.75rem;
    line-height: 1.25;
}

.location-button {
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.375rem;
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.location-button:hover:not(:disabled) {
    background-color: #2563eb;
}

.location-button:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
}

.loading-indicator {
    position: absolute;
    top: 1rem;
    left: 1rem;
    z-index: 1002;
    background-color: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
    border-radius: 0.5rem;
    padding: 0.75rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
}

.loading-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.loading-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid #3b82f6;
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.loading-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
}

.error-indicator {
    position: absolute;
    top: 1rem;
    left: 1rem;
    z-index: 10;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    padding: 0.75rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
    max-width: 24rem;
}

.error-content {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
}

.error-icon {
    width: 1.25rem;
    height: 1.25rem;
    color: #ef4444;
    margin-top: 0.125rem;
}

.error-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: #991b1b;
    margin: 0;
}

.error-message {
    font-size: 0.75rem;
    color: #dc2626;
    margin: 0.25rem 0 0 0;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/* Custom route marker styles */
.custom-route-marker {
    background: transparent !important;
    border: none !important;
}

.route-circle-marker {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

/* Ensure proper z-index for markers */
.leaflet-marker-icon {
    z-index: 1000;
}

/* Hover state for route circles */
.route-circle-marker:hover {
    z-index: 1001;
    transform: scale(1.2);
}
</style>
