/**
 * Bus routes data for Christchurch Metro
 * This is now a fallback - the app will use GTFS data from the API
 */
export const busRoutes = [
  { id: '1',   color: '#87CEEB', name: 'Rangiora/Cashmere' },
  { id: '3',   color: '#8A2BE2', name: 'Airport/Sumner' },
  { id: '5',   color: '#FFD700', name: 'Rolleston/New Brighton' },
  { id: '7',   color: '#FF8C00', name: 'Halswell/Queenspark' },
  { id: '8',   color: '#FF69B4', name: 'Airport/Lyttelton' },
  { id: '27',  color: '#FF8C00', name: 'Northwood/Huntsbury' },
  { id: '29',  color: '#000080', name: 'Airport/City via Fendalton' },
  { id: '44',  color: '#008B8B', name: 'Shirley/Westmorland' },
  { id: '60',  color: '#FFB6C1', name: 'Hillmorton/Southshore' },
  { id: '80',  color: '#4B0082', name: 'Lincoln/Parklands' },
  { id: '81',  color: '#DC143C', name: 'Lincoln/City direct' },
  { id: '84',  color: '#DC143C', name: 'Rolleston/City direct' },
  { id: '85',  color: '#87CEEB', name: 'Rolleston/City direct' },
  { id: '86',  color: '#32CD32', name: 'Darfield/City' },
  { id: '91',  color: '#006400', name: 'Rangiora/City direct' },
  { id: '92',  color: '#8B4513', name: 'Kaiapoi/City direct' },
  { id: '95',  color: '#DC143C', name: 'Waikuku and Pegasus/City' },
  { id: '97',  color: '#8A2BE2', name: 'Rangiora/Pegasus' },
  { id: '100', color: '#808080', name: 'Wigram/The Palms via Riccarton' },
  { id: '107', color: '#008B8B', name: 'Styx Mill/Northlands Mall' },
  { id: '120', color: '#FFD700', name: 'Burnside/Spreydon' },
  { id: '125', color: '#228B22', name: 'Redwood/Westlake' },
  { id: '130', color: '#8B4513', name: 'Hei Hei/Avonhead' },
  { id: '135', color: '#228B22', name: 'The Palms/New Brighton' },
  { id: '140', color: '#008B8B', name: 'Russley/Mt Pleasant' },
  { id: '155', color: '#8A2BE2', name: 'Eastgate/Lyttelton' },
  { id: '820', color: '#228B22', name: 'Burnham/Lincoln via Rolleston' },
  { id: 'F',   color: '#4169E1', name: 'Diamond Harbour Ferry' },
  { id: 'Oa',  color: '#228B22', name: 'Orbiter' },
  { id: 'Oc',  color: '#228B22', name: 'Orbiter' }
]


/**
 * Get a route by its ID
 * @param {string} id - Route ID
 * @returns {Object|undefined} Route object or undefined if not found
 */
export const getRouteById = (id) => {
  return busRoutes.find(route => route.id === id)
}

/**
 * Search routes by name or ID
 * @param {string} query - Search query
 * @returns {Array} Array of matching routes
 */
export const searchRoutes = (query) => {
  if (!query) return busRoutes
  
  const searchTerm = query.toLowerCase()
  return busRoutes.filter(route =>
    route.name.toLowerCase().includes(searchTerm) ||
    route.id.toLowerCase().includes(searchTerm)
  )
}
