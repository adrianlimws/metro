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
    name: 'RouteSidebar',
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
    emits: ['sidebar-toggle', 'route-selected'],
    setup(props, { emit }) {
        const routes = ref(busRoutes || [])

        // Use search composable with debouncing
        const { searchQuery, filteredItems: filteredRoutes, clearSearch } = useSearch(
            routes,
            searchRoutes,
            300
        )

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

        return {
            routes,
            searchQuery,
            filteredRoutes,
            toggleSidebar,
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

        <!-- Routes List -->
        <RoutesList :routes="filteredRoutes" :search-query="searchQuery" @route-selected="handleRouteSelected" />

        <!-- Footer -->
        <SidebarFooter />
    </div>
</template>