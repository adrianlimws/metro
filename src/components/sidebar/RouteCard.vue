<script>
import { ChevronRightIcon } from '@heroicons/vue/24/outline'

export default {
    name: 'RouteCard',
    components: {
        ChevronRightIcon
    },
    props: {
        route: {
            type: Object,
            required: true
        }
    },
    emits: ['route-selected'],
    setup(props, { emit }) {
        const handleRouteSelect = () => {
            emit('route-selected', props.route)
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                if (event.key === ' ') {
                    event.preventDefault()
                }
                handleRouteSelect()
            }
        }

        return {
            handleRouteSelect,
            handleKeyDown
        }
    }
}
</script>

<template>
    <div class="px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-white/70 backdrop-blur-sm shadow-md flex items-center justify-between cursor-pointer"
        tabindex="0" role="button" :aria-label="`Route ${route.id}: ${route.name}`" @click="handleRouteSelect"
        @keydown="handleKeyDown">
        <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0"
                :style="{ borderColor: route.color, color: route.color }">
                {{ route.id }}
            </div>
            <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse flex-shrink-0"></div>
            <span class="text-sm sm:text-base font-medium text-gray-800 truncate">{{ route.name }}</span>
        </div>
        <ChevronRightIcon class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 ml-2" />
    </div>
</template>
