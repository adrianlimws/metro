<script>
import { ref, computed, watch } from 'vue'
import { busRoutes, searchRoutes } from '../data/busRoutes.js'
import { useScreenSize } from '../composables/useScreenSize'
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
        const { isDesktop } = useScreenSize()

        // Use search composable with debouncing
        const { searchQuery, filteredItems: filteredRoutes, clearSearch } = useSearch(
            routes,
            searchRoutes,
            300
        )

        const isOpen = computed(() => isDesktop.value)

        // Watch for screen size changes and emit sidebar state
        watch(isDesktop, (newIsDesktop) => {
            emit('sidebar-toggle', newIsDesktop)
        }, { immediate: true })

        // Methods
        const toggleSidebar = () => {
            // Only toggle on mobile/tablet screens
            if (!isDesktop.value) {
                emit('sidebar-toggle', !isOpen.value)
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
            isOpen,
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
    <div class="h-screen bg-white/80 backdrop-blur-xl border-l border-gray-200/50 overflow-y-auto overflow-x-hidden w-64 sm:w-72 lg:w-80 transform translate-x-0 box-border min-h-screen shadow-[-8px_0_32px_rgba(0,0,0,0.04)] fixed lg:relative top-0 right-0 z-50 lg:z-auto"
        :class="isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'">

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