<script>
export default {
    name: 'SearchSection',
    props: {
        searchQuery: {
            type: String,
            required: true
        }
    },
    emits: ['update:searchQuery', 'clear-search'],
    setup(props, { emit }) {
        const handleInput = (event) => {
            emit('update:searchQuery', event.target.value)
        }

        const handleClearSearch = () => {
            emit('clear-search')
        }

        return {
            handleInput,
            handleClearSearch
        }
    }
}
</script>

<template>
    <div
        class="sticky top-[8.5rem] z-10 p-6 bg-white/60 backdrop-blur-xl border-b border-gray-200/50 overflow-hidden box-border">
        <div class="relative box-border w-full">
            <input :value="searchQuery" @input="handleInput" type="text" placeholder="Search routes..."
                class="w-full pl-12 pr-12 py-4 border border-gray-200/60 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-300 text-sm font-medium text-gray-700 box-border max-w-full focus:outline-none focus:shadow-[0_0_0_2px_rgba(59,130,246,0.2)] focus:border-blue-500/50 focus:shadow-lg focus:bg-white">

            <!-- Search Icon -->
            <div class="absolute left-4 top-1/2 -translate-y-1/2">
                <svg class="w-5 h-5 text-gray-400 transition-colors duration-300 group-focus-within:text-blue-500"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
            </div>

            <!-- Clear Button -->
            <div v-if="searchQuery" class="absolute right-4 top-1/2 -translate-y-1/2">
                <button @click="handleClearSearch"
                    class="p-1 text-gray-400 rounded-lg transition-all duration-200 hover:text-gray-600 hover:bg-gray-100"
                    aria-label="Clear search">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12">
                        </path>
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>
