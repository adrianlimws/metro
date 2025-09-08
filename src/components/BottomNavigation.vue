<script>
import { ref, computed, watch } from 'vue'
import { busRoutes, searchRoutes } from '../data/busRoutes.js'
import { useSearch } from '../composables/useSearch'
import { ROUTE_STATUS, MAP_CONFIG } from '../constants'
import {
    SidebarHeader,
    RefreshCountdown,
    SearchSection,
    RoutesList,
    SidebarFooter
} from './sidebar'

export default {
    name: 'BottomNavigation',
    components: {
        SidebarHeader,
        RefreshCountdown,
        SearchSection,
        RoutesList,
        SidebarFooter
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
        const isExpanded = ref(false)

        // Use search composable with debouncing
        const { searchQuery, filteredItems: filteredRoutes, clearSearch } = useSearch(
            routes,
            searchRoutes,
            300
        )

        // Methods
        const toggleExpanded = () => {
            isExpanded.value = !isExpanded.value
        }

        const handleSearchUpdate = (newQuery) => {
            searchQuery.value = newQuery
        }

        const handleRouteSelected = (route) => {
            emit('route-selected', route)
            // Collapse the bottom navigation after route selection
            isExpanded.value = false
        }

        return {
            routes,
            searchQuery,
            filteredRoutes,
            isExpanded,
            toggleExpanded,
            clearSearch,
            handleSearchUpdate,
            handleRouteSelected,
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
    <div class="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <!-- Expanded Content -->
        <div v-if="isExpanded"
            class="bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-[0_-8px_32px_rgba(0,0,0,0.04)] max-h-[80vh] flex flex-col">

            <!-- Header -->
            <div class="flex-shrink-0">
                <SidebarHeader :routes-count="routes.length" :show-close-button="true"
                    @toggle-sidebar="toggleExpanded" />
            </div>

            <!-- Refresh countdown bar -->
            <div class="flex-shrink-0">
                <RefreshCountdown :countdown-seconds="countdownSeconds" :countdown-percentage="countdownPercentage"
                    :is-loading="isLoading" :error="error" />
            </div>

            <!-- Search/Filter -->
            <div class="flex-shrink-0">
                <SearchSection :search-query="searchQuery" @update:search-query="handleSearchUpdate"
                    @clear-search="clearSearch" />
            </div>

            <!-- Routes List -->
            <div class="flex-1 overflow-y-auto">
                <RoutesList :routes="filteredRoutes" :search-query="searchQuery"
                    @route-selected="handleRouteSelected" />
            </div>

            <!-- Footer -->
            <div class="flex-shrink-0">
                <SidebarFooter />
            </div>
        </div>

        <!-- Collapsed Bottom Bar -->
        <div v-else
            class="bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-[0_-8px_32px_rgba(0,0,0,0.04)]">
            <div class="flex items-center justify-between p-4">
                <!-- Left: Route count and status -->
                <div class="flex items-center gap-3">
                    <div
                        class="w-8 h-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                        </svg>
                    </div>
                    <div>
                        <p class="text-sm font-semibold text-gray-800 m-0">{{ routes.length }} Routes</p>
                        <div class="flex items-center gap-1">
                            <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            <p class="text-xs text-gray-500 m-0">Live</p>
                        </div>
                    </div>
                </div>

                <!-- Center: Quick search preview -->
                <div v-if="searchQuery" class="flex-1 mx-4">
                    <p class="text-xs text-gray-600 truncate m-0">
                        Searching: "{{ searchQuery }}"
                    </p>
                </div>

                <!-- Right: Expand button -->
                <button @click="toggleExpanded"
                    class="p-3 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl transition-all duration-200 hover:from-slate-800 hover:to-slate-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-500">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>
