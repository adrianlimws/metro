import { ref, onUnmounted } from 'vue'

/**
 * Composable for handling GPS geolocation functionality
 * Provides user location with error handling and permission management
 */
export function useGeolocation() {
  const userLocation = ref(null)
  const isLocating = ref(false)
  const locationError = ref(null)
  const watchId = ref(null)

  /**
   * Get current user location using GPS
   */
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error('Geolocation is not supported by this browser')
        locationError.value = error.message
        reject(error)
        return
      }

      isLocating.value = true
      locationError.value = null

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          userLocation.value = [latitude, longitude]
          isLocating.value = false
          locationError.value = null
          resolve([latitude, longitude])
        },
        (error) => {
          isLocating.value = false
          let errorMessage = 'Unable to get your location'
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions.'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.'
              break
          }
          
          locationError.value = errorMessage
          reject(new Error(errorMessage))
        },
        options
      )
    })
  }

  /**
   * Start watching user location for continuous updates
   */
  const startWatchingLocation = () => {
    if (!navigator.geolocation) {
      locationError.value = 'Geolocation is not supported by this browser'
      return
    }

    if (watchId.value) {
      stopWatchingLocation()
    }

    isLocating.value = true
    locationError.value = null

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000 // 30 seconds
    }

    watchId.value = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        userLocation.value = [latitude, longitude]
        isLocating.value = false
        locationError.value = null
      },
      (error) => {
        isLocating.value = false
        let errorMessage = 'Unable to track your location'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
        }
        
        locationError.value = errorMessage
      },
      options
    )
  }

  /**
   * Stop watching user location
   */
  const stopWatchingLocation = () => {
    if (watchId.value) {
      navigator.geolocation.clearWatch(watchId.value)
      watchId.value = null
    }
  }

  /**
   * Clear location data and errors
   */
  const clearLocation = () => {
    userLocation.value = null
    locationError.value = null
    isLocating.value = false
    stopWatchingLocation()
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopWatchingLocation()
  })

  return {
    userLocation,
    isLocating,
    locationError,
    getCurrentLocation,
    startWatchingLocation,
    stopWatchingLocation,
    clearLocation
  }
}
