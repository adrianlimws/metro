<script>
export default {
    name: 'RefreshCountdown',
    props: {
        countdownSeconds: {
            type: Number,
            required: true
        },
        countdownPercentage: {
            type: Number,
            required: true
        },
        isLoading: {
            type: Boolean,
            default: false
        },
        error: {
            type: String,
            default: null
        }
    }
}
</script>

<template>
    <div v-if="!isLoading && !error" class="sticky top-[8.5rem] h-1 bg-black/10 z-[15] overflow-hidden">
        <div class="h-full bg-gradient-to-r from-blue-500 via-blue-700 to-blue-800 transition-[width] duration-100 ease-linear relative"
            :style="{ width: countdownPercentage + '%' }">
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer">
            </div>
        </div>
        <div class="absolute top-2 right-3 text-xs text-gray-700 bg-white/90 px-2 py-0.5 rounded font-medium shadow-sm">
            Next refresh in {{ Math.ceil(countdownSeconds) }}s
        </div>
    </div>
</template>
