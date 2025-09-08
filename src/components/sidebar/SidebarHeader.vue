<script>
import { XMarkIcon } from '@heroicons/vue/24/outline'

export default {
    name: 'SidebarHeader',
    components: {
        XMarkIcon
    },
    props: {
        routesCount: {
            type: Number,
            required: true
        }
    },
    emits: ['toggle-sidebar'],
    setup(props, { emit }) {
        const handleToggleSidebar = () => {
            emit('toggle-sidebar')
        }

        return {
            handleToggleSidebar
        }
    }
}
</script>

<template>
    <div
        class="sticky top-0 z-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 relative overflow-hidden">
        <!-- Background Pattern -->
        <div class="absolute inset-0 opacity-5">
            <div class="absolute inset-0"
                style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0); background-size: 20px 20px;">
            </div>
        </div>

        <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div
                        class="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                        <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold tracking-tight m-0">Bus Routes</h1>
                        <p class="text-slate-300 text-sm font-medium m-0">Metro Transit</p>
                    </div>
                </div>
                <button
                    class="p-2.5 bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20 hover:bg-white/10"
                    @click="handleToggleSidebar">
                    <XMarkIcon class="w-5 h-5 text-white" />
                </button>
            </div>

            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div
                        class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_0_0_rgba(16,185,129,0.5)]">
                    </div>
                    <p class="text-sm text-slate-300 font-medium m-0">{{ routesCount }} routes available</p>
                </div>
                <div class="text-xs text-slate-400 font-mono">Live</div>
            </div>
        </div>
    </div>
</template>
