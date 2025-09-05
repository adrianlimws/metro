import { ref, onMounted, onUnmounted } from 'vue'
import { BREAKPOINTS } from '../constants'

/**
 * Composable for responsive screen size detection
 * @returns {Object} Screen size utilities and reactive state
 */
export function useScreenSize() {
  const windowWidth = ref(window.innerWidth)
  const isDesktop = ref(windowWidth.value >= BREAKPOINTS.DESKTOP)
  const isTablet = ref(windowWidth.value >= BREAKPOINTS.TABLET && windowWidth.value < BREAKPOINTS.DESKTOP)
  const isMobile = ref(windowWidth.value < BREAKPOINTS.TABLET)

  const updateScreenSize = () => {
    windowWidth.value = window.innerWidth
    isDesktop.value = windowWidth.value >= BREAKPOINTS.DESKTOP
    isTablet.value = windowWidth.value >= BREAKPOINTS.TABLET && windowWidth.value < BREAKPOINTS.DESKTOP
    isMobile.value = windowWidth.value < BREAKPOINTS.TABLET
  }

  onMounted(() => {
    window.addEventListener('resize', updateScreenSize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateScreenSize)
  })

  return {
    windowWidth,
    isDesktop,
    isTablet,
    isMobile,
    updateScreenSize
  }
}
