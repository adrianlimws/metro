<script>
import { ref, computed, watch } from 'vue'
import { busRoutes, searchRoutes } from '../data/busRoutes.js'
import { useSearch } from '../composables/useSearch'
import { ROUTE_STATUS, MAP_CONFIG } from '../constants'
import { RefreshCountdown } from './sidebar'

export default {
    name: 'BottomNavigation',
    components: {
        RefreshCountdown
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
    emits: ['route-selected'],
    setup(props, { emit }) {
        const routes = ref(busRoutes || [])
        const selectedRoute = ref('')

        // Use search composable with debouncing
        const { searchQuery, filteredItems: filteredRoutes, clearSearch } = useSearch(
            routes,
            searchRoutes,
            300
        )

        // Methods
        const handleRouteChange = () => {
            if (selectedRoute.value) {
                const route = routes.value.find(r => r.id === selectedRoute.value)
                if (route) {
                    emit('route-selected', route)
                }
            }
        }

        const handleSearchUpdate = (newQuery) => {
            searchQuery.value = newQuery
        }

        const handleRouteSelected = (route) => {
            emit('route-selected', route)
        }

        return {
            routes,
            searchQuery,
            filteredRoutes,
            selectedRoute,
            clearSearch,
            handleSearchUpdate,
            handleRouteSelected,
            handleRouteChange,
            countdownSeconds: computed(() => props.countdownSeconds),
            countdownPercentage: computed(() => props.countdownPercentage),
            isLoading: computed(() => props.isLoading),
            error: computed(() => props.error)
        }
    }
}
</script>

<template>
    <!-- Bottom Navigation Container -->
    <div class="fixed bottom-0 left-0 right-0 z-[9999] block lg:hidden" style="transform: translateZ(0);">

        <!-- Refresh countdown bar - always visible above bottom bar -->
        <div class="bg-white/95 backdrop-blur-xl border-t border-gray-200/50">
            <RefreshCountdown :countdown-seconds="countdownSeconds" :countdown-percentage="countdownPercentage"
                :is-loading="isLoading" :error="error" />
        </div>

        <!-- Bottom Bar -->
        <div
            class="bg-white backdrop-blur-xl border-t-2 border-blue-500 shadow-[0_-8px_32px_rgba(0,0,0,0.1)] min-h-[80px]">
            <div class="p-4 space-y-3">
                <!-- Top row: Route count and status -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div
                            class="w-8 h-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl flex items-center justify-center">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-gray-800 m-0">{{ routes.length }} Routes (Mobile)</p>
                            <div class="flex items-center gap-1">
                                <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                <p class="text-xs text-gray-500 m-0">Live</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bottom row: Route selector -->
                <div>
                    <select v-model="selectedRoute" @change="handleRouteChange"
                        class="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Choose a route...</option>
                        <option v-for="route in routes" :key="route.id" :value="route.id">
                            {{ route.name }} ({{ route.id }})
                        </option>
                    </select>
                </div>
            </div>
        </div>
    </div>
</template>
