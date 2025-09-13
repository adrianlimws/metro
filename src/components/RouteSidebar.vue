<script>
import { ref, computed, watch } from 'vue'
import { busRoutes, searchRoutes } from '../data/busRoutes.js'
import { useSearch } from '../composables/useSearch'
import { useRouteStops } from '../composables/useRouteStops'
import { MAP_CONFIG, API_CONFIG } from '../constants'
import RouteStopsTimeline from './RouteStopsTimeline.vue'
import {
    SidebarHeader,
    RefreshCountdown,
    SearchSection,
    RoutesList,
    SidebarFooter
} from './sidebar'

export default {
    name: 'RouteSidebar',
    components: {
        SidebarHeader,
        RefreshCountdown,
        SearchSection,
        RoutesList,
        SidebarFooter,
        RouteStopsTimeline
    },
    props: {
        countdownSeconds: {
            type: Number,
            default: 0
        },
        countdownPercentage: {
            type: Number,
            default: 0
        },
        isLoading: {
            type: Boolean,
            default: false
        },
        error: {
            type: String,
            default: null
        }
    },
    emits: ['sidebar-toggle', 'route-selected'],
    setup(props, { emit }) {
        const routes = ref(busRoutes || [])
        const showTimeline = ref(false)
        const selectedRouteForStops = ref(null)
        const routesInitialized = ref(false)

        // Use route stops composable
        const {
            routeStops,
            isLoading: stopsLoading,
            error: stopsError,
            selectedRoute,
            fetchRouteStops,
            clearRouteStops,
            stopsCount,
            hasStops
        } = useRouteStops()

        // Use search composable with debouncing
        const { searchQuery, filteredItems: filteredRoutes, clearSearch } = useSearch(
            routes,
            searchRoutes,
            300
        )

        // Fetch routes from API on component mount
        const initializeRoutes = async () => {
            if (routesInitialized.value) {
                return
            }

            try {
                const response = await fetch(`${API_CONFIG.CLOUDFLARE_API_BASE}/api/routes`)
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                const data = await response.json()
                const apiRoutesData = data.data || []

                // Group routes by short name and take the first one of each group
                const routeMap = new Map()
                apiRoutesData.forEach(route => {
                    if (!routeMap.has(route.route_short_name)) {
                        routeMap.set(route.route_short_name, {
                            id: route.route_short_name,
                            name: route.route_long_name,
                            color: route.route_color ? `#${route.route_color}` : '#000000',
                            route_id: route.route_id // Store the full route_id for API calls
                        })
                    }
                })
                routes.value = Array.from(routeMap.values())
                routesInitialized.value = true
            } catch (error) {
                console.warn('Failed to fetch routes from API, using fallback data:', error)
                // Keep using the fallback busRoutes data
            }
        }

        // Initialize routes when component is created
        initializeRoutes()

        // Watch for changes in routes to ensure colors persist
        watch(routes, (newRoutes) => {
            // Routes changed - colors should persist
        }, { deep: true })

        // Methods
        const toggleSidebar = () => {
            // Desktop sidebar doesn't need toggle functionality
            // This is kept for compatibility with SidebarHeader component
        }

        const handleSearchUpdate = (newQuery) => {
            searchQuery.value = newQuery
        }

        const handleRouteSelected = (route) => {
            emit('route-selected', route)
        }

        const handleShowRouteStops = async (route) => {
            selectedRouteForStops.value = route
            showTimeline.value = true
            // Use the full route_id for API calls, fallback to route.id for mock data
            const routeId = route.route_id || route.id
            await fetchRouteStops(routeId)
        }

        const handleCloseTimeline = () => {
            showTimeline.value = false
            selectedRouteForStops.value = null
            clearRouteStops()
        }

        const handleRetryStops = async () => {
            if (selectedRouteForStops.value) {
                await fetchRouteStops(selectedRouteForStops.value.id)
            }
        }

        return {
            routes,
            searchQuery,
            filteredRoutes,
            toggleSidebar,
            clearSearch,
            handleSearchUpdate,
            handleRouteSelected,
            handleShowRouteStops,
            handleCloseTimeline,
            handleRetryStops,
            showTimeline,
            selectedRouteForStops,
            routeStops,
            stopsLoading,
            stopsError,
            selectedRoute,
            stopsCount,
            hasStops,
            countdownSeconds: computed(() => props.countdownSeconds),
            countdownPercentage: computed(() => props.countdownPercentage),
            isLoading: computed(() => props.isLoading),
            error: computed(() => props.error)
        }
    }
}
</script>

<template>
    <div
        class="hidden lg:block h-screen bg-white/80 backdrop-blur-xl border-l border-gray-200/50 overflow-y-auto overflow-x-hidden w-80 box-border min-h-screen shadow-[-8px_0_32px_rgba(0,0,0,0.04)] relative">

        <!-- Header -->
        <SidebarHeader :routes-count="routes.length" @toggle-sidebar="toggleSidebar" />

        <!-- Refresh countdown bar -->
        <RefreshCountdown :countdown-seconds="countdownSeconds" :countdown-percentage="countdownPercentage"
            :is-loading="isLoading" :error="error" />

        <!-- Search/Filter -->
        <SearchSection :search-query="searchQuery" @update:search-query="handleSearchUpdate"
            @clear-search="clearSearch" />

        <!-- Routes List or Timeline -->
        <div v-if="!showTimeline" class="flex-1 flex flex-col">
            <RoutesList :routes="filteredRoutes" :search-query="searchQuery" @route-selected="handleRouteSelected"
                @show-stops="handleShowRouteStops" />
        </div>

        <!-- Route Stops Timeline -->
        <div v-else class="flex-1">
            <RouteStopsTimeline :route-stops="routeStops" :is-loading="stopsLoading" :error="stopsError"
                :selected-route="selectedRouteForStops" :stops-count="stopsCount" :has-stops="hasStops"
                :route-color="selectedRouteForStops?.color || '#88807E'" @close="handleCloseTimeline"
                @retry="handleRetryStops" />
        </div>

        <!-- Footer -->
        <SidebarFooter />
    </div>
</template>