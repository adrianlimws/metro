import { ref, computed } from 'vue'
import { debounce } from '../utils'

/**
 * Composable for search functionality with debouncing
 * @param {Array} items - Array of items to search through
 * @param {Function} searchFn - Function to perform the search
 * @param {number} debounceMs - Debounce delay in milliseconds
 * @returns {Object} Search utilities and reactive state
 */
export function useSearch(items, searchFn, debounceMs = 300) {
  const searchQuery = ref('')
  const isSearching = ref(false)

  // Debounced search function
  const debouncedSearch = debounce((query) => {
    isSearching.value = false
  }, debounceMs)

  // Computed filtered results
  const filteredItems = computed(() => {
    if (!searchQuery.value) return items.value || items
    
    isSearching.value = true
    debouncedSearch(searchQuery.value)
    
    return searchFn(searchQuery.value, items.value || items)
  })

  // Clear search
  const clearSearch = () => {
    searchQuery.value = ''
  }

  return {
    searchQuery,
    filteredItems,
    isSearching,
    clearSearch
  }
}
