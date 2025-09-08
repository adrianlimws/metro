<template>
    <div id="app" class="h-screen w-full m-0 p-0">
        <div class="flex h-full">
            <MetroMap ref="metroMap" :sidebar-open="sidebarOpen" @data-fetched="resetCountdown" />
            <RouteSidebar ref="sidebar" :countdown-seconds="countdownSeconds"
                :countdown-percentage="countdownPercentage" :is-loading="isLoading" :error="error"
                @sidebar-toggle="handleSidebarToggle" />
        </div>

        <!-- Mobile backdrop -->
        <div v-if="sidebarOpen && !isDesktop" class="fixed inset-0 bg-black/30 z-40 lg:hidden" @click="toggleSidebar"
            aria-hidden="true">
        </div>

        <!-- Mobile menu button -->
        <button v-if="!isDesktop"
            class="fixed top-4 right-4 z-60 bg-white p-3 rounded-xl shadow-lg border border-gray-200 transition-all duration-200 hover:bg-gray-50 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
            @click="toggleSidebar" :aria-label="sidebarOpen ? 'Close sidebar' : 'Open sidebar'">
            <Bars3Icon class="w-6 h-6 text-gray-600" />
        </button>
    </div>
</template>

<script>
import { ref, watch, computed, onUnmounted } from 'vue'
import MetroMap from './components/MetroMap.vue'
import RouteSidebar from './components/RouteSidebar.vue'
import { Bars3Icon } from '@heroicons/vue/24/outline'
import { useScreenSize } from './composables/useScreenSize'
import { MAP_CONFIG } from './constants'

export default {
    name: 'App',
    components: {
        MetroMap,
        RouteSidebar,
        Bars3Icon
    },
    setup() {
        const sidebarOpen = ref(false)
        const { isDesktop } = useScreenSize()

        // Countdown timer data
        const countdownSeconds = ref(0)
        const isLoading = ref(false)
        const error = ref(null)
        const countdownInterval = ref(null)
        const metroMap = ref(null)

        // Watch for screen size changes and adjust sidebar state
        watch(isDesktop, (newIsDesktop) => {
            sidebarOpen.value = newIsDesktop
        }, { immediate: true })

        const toggleSidebar = () => {
            // Only toggle on mobile/tablet screens
            if (!isDesktop.value) {
                sidebarOpen.value = !sidebarOpen.value
            }
        }

        const handleSidebarToggle = (isOpen) => {
            sidebarOpen.value = isOpen
        }

        // Countdown functions
        const startCountdown = () => {
            if (countdownInterval.value) {
                clearInterval(countdownInterval.value)
            }

            countdownSeconds.value = MAP_CONFIG.REFRESH_INTERVAL / 1000

            countdownInterval.value = setInterval(() => {
                countdownSeconds.value -= 0.1
                if (countdownSeconds.value <= 0) {
                    countdownSeconds.value = MAP_CONFIG.REFRESH_INTERVAL / 1000
                }
            }, 100)
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
            isDesktop,
            toggleSidebar,
            handleSidebarToggle,
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
