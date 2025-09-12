<template>
    <div id="app" class="h-screen w-full m-0 p-0 overflow-hidden">
        <div class="flex h-full">
            <MetroMap ref="metroMap" :sidebar-open="sidebarOpen" @data-fetched="resetCountdown" />
            <!-- Desktop Sidebar -->
            <RouteSidebar ref="sidebar" :countdown-seconds="countdownSeconds"
                :countdown-percentage="countdownPercentage" :is-loading="isLoading" :error="error"
                @sidebar-toggle="handleSidebarToggle" />
        </div>

        <!-- Mobile/Tablet Bottom Navigation -->
        <BottomNavigation :countdown-seconds="countdownSeconds" :countdown-percentage="countdownPercentage"
            :is-loading="isLoading" :error="error" @route-selected="handleRouteSelected" />

    </div>
</template>

<script>
import { ref, watch, computed, onUnmounted } from 'vue'
import MetroMap from './components/MetroMap.vue'
import RouteSidebar from './components/RouteSidebar.vue'
import BottomNavigation from './components/BottomNavigation.vue'
import { MAP_CONFIG } from './constants'

export default {
    name: 'App',
    components: {
        MetroMap,
        RouteSidebar,
        BottomNavigation
    },
    setup() {
        const sidebarOpen = ref(true) // Always open on desktop, controlled by CSS

        // Countdown timer data
        const countdownSeconds = ref(0)
        const isLoading = ref(false)
        const error = ref(null)
        const countdownInterval = ref(null)
        const metroMap = ref(null)

        const toggleSidebar = () => {
            sidebarOpen.value = !sidebarOpen.value
        }

        const handleSidebarToggle = (isOpen) => {
            sidebarOpen.value = isOpen
        }

        const handleRouteSelected = (route) => {
            // Handle route selection from bottom navigation
            // You can add route selection logic here if needed
            console.log('Route selected:', route)
        }

        // Countdown functions
        const startCountdown = () => {
            if (countdownInterval.value) {
                clearInterval(countdownInterval.value)
            }

            countdownSeconds.value = MAP_CONFIG.REFRESH_INTERVAL / 1000

            countdownInterval.value = setInterval(() => {
                countdownSeconds.value -= 1
                if (countdownSeconds.value <= 0) {
                    countdownSeconds.value = MAP_CONFIG.REFRESH_INTERVAL / 1000
                }
            }, 1000) // Update every second instead of every 100ms
        }

        const resetCountdown = () => {
            countdownSeconds.value = MAP_CONFIG.REFRESH_INTERVAL / 1000
            if (!countdownInterval.value) {
                startCountdown()
            }
        }

        const stopCountdown = () => {
            if (countdownInterval.value) {
                clearInterval(countdownInterval.value)
                countdownInterval.value = null
            }
        }

        // Computed properties
        const countdownPercentage = computed(() => {
            const totalSeconds = MAP_CONFIG.REFRESH_INTERVAL / 1000
            return ((totalSeconds - countdownSeconds.value) / totalSeconds) * 100
        })

        // Get loading and error states from MetroMap component
        const isLoadingFromMap = computed(() => metroMap.value?.isLoading || false)
        const errorFromMap = computed(() => metroMap.value?.error || null)

        // Start countdown on mount
        startCountdown()

        // Cleanup on unmount
        onUnmounted(() => {
            stopCountdown()
        })

        return {
            sidebarOpen,
            toggleSidebar,
            handleSidebarToggle,
            handleRouteSelected,
            countdownSeconds,
            countdownPercentage,
            isLoading: isLoadingFromMap,
            error: errorFromMap,
            metroMap,
            resetCountdown,
            stopCountdown
        }
    }
}
</script>

<style>
body {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, sans-serif;
}
</style>
