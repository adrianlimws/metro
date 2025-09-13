<template>
    <div class="route-stops-timeline">
        <!-- Header -->
        <div
            class="flex items-center justify-between mb-4 px-4 py-2 bg-white/80 backdrop-blur-sm border-b border-gray-200">
            <div class="flex items-center gap-3">
                <button @click="$emit('close')" class="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close timeline">
                    <ChevronLeftIcon class="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h2 class="text-lg font-semibold text-gray-800">
                        Route {{ selectedRoute?.id }}
                    </h2>
                    <p class="text-sm text-gray-600">{{ selectedRoute?.name }}</p>
                </div>
            </div>
            <div class="text-sm text-gray-500">
                {{ stopsCount }} stops
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="p-8 text-center">
            <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4">
            </div>
            <p class="text-gray-600">Loading stops...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="p-8 text-center">
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon class="w-6 h-6 text-red-600" />
            </div>
            <p class="text-red-600 mb-2">{{ error }}</p>
            <button @click="$emit('retry')" class="text-sm text-blue-600 hover:text-blue-800 underline">
                Try again
            </button>
        </div>

        <!-- Timeline -->
        <div v-else-if="hasStops" class="relative">
            <!-- Timeline line -->
            <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-400 to-pink-300"></div>

            <!-- Stops list -->
            <div class="space-y-1 pb-4">
                <div v-for="(stop, index) in routeStops" :key="stop.stop_id || stop.id || index"
                    class="relative flex items-start gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                    <!-- Timeline dot -->
                    <div
                        class="relative z-10 flex-shrink-0 w-4 h-4 bg-white border-2 border-pink-400 rounded-full mt-1">
                    </div>

                    <!-- Stop content -->
                    <div class="flex-1 min-w-0">
                        <!-- Stop name -->
                        <h3 class="text-sm font-medium text-gray-800 mb-1">
                            {{ stop.stop_name || stop.name || 'Unknown Stop' }}
                        </h3>

                        <!-- Stop ID and additional info -->
                        <div class="flex items-center gap-2 text-xs text-gray-500">
                            <span class="bg-gray-100 px-2 py-1 rounded font-mono">
                                ID: {{ stop.stop_id || stop.id || 'N/A' }}
                            </span>
                            <span v-if="stop.stop_code && stop.stop_code !== stop.stop_id"
                                class="bg-gray-100 px-2 py-1 rounded">
                                Code: {{ stop.stop_code }}
                            </span>
                        </div>

                        <!-- Stop description if available -->
                        <p v-if="stop.stop_desc && stop.stop_desc !== 'null'" class="text-xs text-gray-600 mt-1">
                            {{ stop.stop_desc }}
                        </p>
                    </div>

                    <!-- Sequence number -->
                    <div class="flex-shrink-0 text-xs text-gray-400 font-medium">
                        {{ stop.stop_sequence || index + 1 }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="p-8 text-center">
            <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPinIcon class="w-6 h-6 text-gray-400" />
            </div>
            <p class="text-gray-600">No stops found for this route</p>
        </div>
    </div>
</template>

<script setup>
import {
    ChevronLeftIcon,
    ExclamationTriangleIcon,
    MapPinIcon
} from '@heroicons/vue/24/outline'

defineProps({
    routeStops: {
        type: Array,
        default: () => []
    },
    isLoading: {
        type: Boolean,
        default: false
    },
    error: {
        type: String,
        default: null
    },
    selectedRoute: {
        type: Object,
        default: null
    },
    stopsCount: {
        type: Number,
        default: 0
    },
    hasStops: {
        type: Boolean,
        default: false
    }
})

defineEmits(['close', 'retry'])
</script>

<style scoped>
.route-stops-timeline {
    @apply h-full bg-white/80 backdrop-blur-xl overflow-y-auto;
}

/* Custom scrollbar */
.route-stops-timeline::-webkit-scrollbar {
    width: 6px;
}

.route-stops-timeline::-webkit-scrollbar-track {
    @apply bg-gray-100/50;
}

.route-stops-timeline::-webkit-scrollbar-thumb {
    @apply bg-gray-300 rounded-full;
}

.route-stops-timeline::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-400;
}
</style>
