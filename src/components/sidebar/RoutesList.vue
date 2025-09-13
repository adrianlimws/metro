<script>
import RouteCard from './RouteCard.vue'

export default {
    name: 'RoutesList',
    components: {
        RouteCard
    },
    props: {
        routes: {
            type: Array,
            required: true
        },
        searchQuery: {
            type: String,
            required: true
        }
    },
    emits: ['route-selected', 'show-stops'],
    setup(props, { emit }) {
        const handleRouteSelected = (route) => {
            emit('route-selected', route)
        }

        const handleShowStops = (route) => {
            emit('show-stops', route)
        }

        return {
            handleRouteSelected,
            handleShowStops
        }
    }
}
</script>

<template>
    <div class="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white/50">
        <!-- Empty State -->
        <div v-if="routes.length === 0 && searchQuery" class="p-8 sm:p-12 text-center">
            <div
                class="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center shadow-inner">
                <svg class="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
            </div>
            <h3 class="text-base sm:text-lg font-semibold text-gray-700 mb-2 m-0">No routes found</h3>
            <p class="text-xs sm:text-sm text-gray-500 m-0">Try adjusting your search terms</p>
        </div>

        <!-- Routes Grid -->
        <div v-else class="p-2 sm:p-3 lg:p-4 flex flex-col gap-2 sm:gap-3">
            <RouteCard v-for="route in routes" :key="route.id" :route="route" @route-selected="handleRouteSelected"
                @show-stops="handleShowStops" />
        </div>
    </div>
</template>
