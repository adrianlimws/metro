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
    </div>
</template>

<script>
import L from 'leaflet'
import { onMounted, onUnmounted, computed, ref, watch } from 'vue'
import { MAP_CONFIG, API_CONFIG, ERROR_MESSAGES } from '../constants'
import { getRouteById } from '../data/busRoutes'

export default {
    name: 'MetroMap',
    props: {
        sidebarOpen: {
            type: Boolean,
            default: false
        }
    },
    emits: ['data-fetched'],
    setup(props, { emit }) {
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
                .filter(entity => entity.vehicle && entity.vehicle.position)
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
            return 'flex-1 pb-20 lg:pb-0'
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
    position: relative;
}


.loading-indicator {
    position: absolute;
    top: 1rem;
    left: 1rem;
    z-index: 10;
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
