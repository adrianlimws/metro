
// Map configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: [-43.5321, 172.6362],
  DEFAULT_ZOOM: 12,
  REFRESH_INTERVAL: 30000, // 30 seconds
  TILE_LAYER_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  TILE_ATTRIBUTION: '© OpenStreetMap contributors'
}

// API configuration
export const API_CONFIG = {
  VEHICLES_ENDPOINT: '/.netlify/functions/vehicles',
  METRO_API_URL: 'https://apis.metroinfo.co.nz/rti/gtfsrt/v1/vehicle-positions.pb'
}

// Error messages
export const ERROR_MESSAGES = {
  VEHICLES_FETCH_FAILED: 'Failed to fetch vehicle data',
  NETWORK_ERROR: 'Network error occurred',
  UNKNOWN_ERROR: 'An unknown error occurred'
}
