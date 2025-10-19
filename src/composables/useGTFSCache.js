import { ref, computed } from 'vue'
import { API_CONFIG } from '@/constants'

/**
 * Composable for managing GTFS data caching using IndexedDB
 * Handles large datasets efficiently with compression and smart invalidation
 */
export function useGTFSCache() {
    const isInitialized = ref(false)
    const cacheVersion = ref('1.0.0')
    const lastUpdated = ref(null)
    const isLoading = ref(false)
    const error = ref(null)

    // IndexedDB configuration
    const DB_NAME = 'MetroGTFSCache'
    const DB_VERSION = 1
    const STORES = {
        ROUTES: 'routes',
        STOPS: 'stops',
        SHAPES: 'shapes',
        TRIPS: 'trips',
        META: 'metadata',
    }

    /**
     * Initialize IndexedDB connection
     */
    const initDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                isInitialized.value = true
                resolve(request.result)
            }

            request.onupgradeneeded = (event) => {
                const db = event.target.result

                // Create object stores
                if (!db.objectStoreNames.contains(STORES.ROUTES)) {
                    db.createObjectStore(STORES.ROUTES, { keyPath: 'route_id' })
                }
                if (!db.objectStoreNames.contains(STORES.STOPS)) {
                    db.createObjectStore(STORES.STOPS, { keyPath: 'stop_id' })
                }
                if (!db.objectStoreNames.contains(STORES.SHAPES)) {
                    db.createObjectStore(STORES.SHAPES, { keyPath: 'shape_id' })
                }
                if (!db.objectStoreNames.contains(STORES.TRIPS)) {
                    db.createObjectStore(STORES.TRIPS, { keyPath: 'trip_id' })
                }
                if (!db.objectStoreNames.contains(STORES.META)) {
                    db.createObjectStore(STORES.META, { keyPath: 'key' })
                }
            }
        })
    }

    /**
     * Compress data using gzip compression
     */
    const compressData = async (data) => {
        const stream = new CompressionStream('gzip')
        const writer = stream.writable.getWriter()
        const reader = stream.readable.getReader()

        writer.write(new TextEncoder().encode(JSON.stringify(data)))
        writer.close()

        const chunks = []
        let done = false

        while (!done) {
            const { value, done: readerDone } = await reader.read()
            done = readerDone
            if (value) chunks.push(value)
        }

        return new Uint8Array(
            chunks.reduce((acc, chunk) => [...acc, ...chunk], [])
        )
    }

    /**
     * Decompress data from gzip
     */
    const decompressData = async (compressedData) => {
        const stream = new DecompressionStream('gzip')
        const writer = stream.writable.getWriter()
        const reader = stream.readable.getReader()

        writer.write(compressedData)
        writer.close()

        const chunks = []
        let done = false

        while (!done) {
            const { value, done: readerDone } = await reader.read()
            done = readerDone
            if (value) chunks.push(value)
        }

        const decompressed = new Uint8Array(
            chunks.reduce((acc, chunk) => [...acc, ...chunk], [])
        )
        return JSON.parse(new TextDecoder().decode(decompressed))
    }

    /**
     * Store data in IndexedDB with compression
     */
    const storeData = async (storeName, key, data) => {
        try {
            const db = await initDB()
            const transaction = db.transaction([storeName], 'readwrite')
            const store = transaction.objectStore(storeName)

            // Compress data before storing
            const compressed = await compressData(data)

            const item = {
                key,
                data: compressed,
                timestamp: Date.now(),
                version: cacheVersion.value,
            }

            await new Promise((resolve, reject) => {
                const request = store.put(item)
                request.onsuccess = () => resolve()
                request.onerror = () => reject(request.error)
            })

            console.log(`✅ Cached ${key} in ${storeName}`)
        } catch (err) {
            console.error(`Error storing ${key} in ${storeName}:`, err)
            throw err
        }
    }

    /**
     * Retrieve data from IndexedDB with decompression
     */
    const getData = async (storeName, key) => {
        try {
            const db = await initDB()
            const transaction = db.transaction([storeName], 'readonly')
            const store = transaction.objectStore(storeName)

            const item = await new Promise((resolve, reject) => {
                const request = store.get(key)
                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })

            if (!item) return null

            // Check if data is compressed (new format) or plain (legacy)
            if (item.data instanceof Uint8Array) {
                return await decompressData(item.data)
            } else {
                // Legacy format - return as is
                return item.data
            }
        } catch (err) {
            console.error(`Error retrieving ${key} from ${storeName}:`, err)
            return null
        }
    }

    /**
     * Check if data exists and is fresh
     */
    const isDataFresh = async (
        storeName,
        key,
        maxAge = 24 * 60 * 60 * 1000
    ) => {
        // 24 hours default
        try {
            const db = await initDB()
            const transaction = db.transaction([storeName], 'readonly')
            const store = transaction.objectStore(storeName)

            const item = await new Promise((resolve, reject) => {
                const request = store.get(key)
                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })

            if (!item) return false

            const age = Date.now() - item.timestamp
            return age < maxAge && item.version === cacheVersion.value
        } catch (err) {
            console.error(`Error checking freshness of ${key}:`, err)
            return false
        }
    }

    /**
     * Fetch and cache route shapes from API
     */
    const fetchAndCacheRouteShapes = async (routeId) => {
        try {
            isLoading.value = true
            error.value = null

            // Check cache first
            const cacheKey = `route_${routeId}`
            const isFresh = await isDataFresh(STORES.SHAPES, cacheKey)

            if (isFresh) {
                console.log(`Using cached shapes for route ${routeId}`)
                return await getData(STORES.SHAPES, cacheKey)
            }

            // Fetch from API
            console.log(`Fetching fresh shapes for route ${routeId}...`)
            const response = await fetch(
                `${API_CONFIG.CLOUDFLARE_API_BASE}/api/shapes?route_id=${routeId}`
            )

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            const shapesData = data.data || []

            // Process and optimize shape data
            const processedShapes = shapesData.map((shape) => ({
                shape_id: shape.shape_id,
                points: shape.points || [],
                route_id: routeId,
                compressed: true,
            }))

            // Cache the processed data
            await storeData(STORES.SHAPES, cacheKey, processedShapes)

            lastUpdated.value = new Date().toISOString()
            console.log(
                `✅ Cached ${processedShapes.length} shapes for route ${routeId}`
            )

            return processedShapes
        } catch (err) {
            console.error('Error fetching and caching route shapes:', err)
            error.value = err.message

            // Try to return cached data even if stale
            const cachedData = await getData(STORES.SHAPES, `route_${routeId}`)
            if (cachedData) {
                console.log(`Using stale cached data for route ${routeId}`)
                return cachedData
            }

            return []
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Fetch and cache all routes
     */
    const fetchAndCacheRoutes = async () => {
        try {
            isLoading.value = true
            error.value = null

            // Check cache first
            const isFresh = await isDataFresh(STORES.ROUTES, 'all_routes')

            if (isFresh) {
                console.log('Using cached routes')
                return await getData(STORES.ROUTES, 'all_routes')
            }

            // Fetch from API
            console.log('Fetching fresh routes...')
            const response = await fetch(
                `${API_CONFIG.CLOUDFLARE_API_BASE}/api/routes`
            )

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            const routes = data.data || []

            // Cache the routes
            await storeData(STORES.ROUTES, 'all_routes', routes)

            lastUpdated.value = new Date().toISOString()
            console.log(`✅ Cached ${routes.length} routes`)

            return routes
        } catch (err) {
            console.error('Error fetching and caching routes:', err)
            error.value = err.message

            // Try to return cached data even if stale
            const cachedData = await getData(STORES.ROUTES, 'all_routes')
            if (cachedData) {
                console.log('Using stale cached routes')
                return cachedData
            }

            return []
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Clear all cached data
     */
    const clearCache = async () => {
        try {
            const db = await initDB()
            const transaction = db.transaction(
                Object.values(STORES),
                'readwrite'
            )

            await Promise.all(
                Object.values(STORES).map((storeName) => {
                    return new Promise((resolve, reject) => {
                        const store = transaction.objectStore(storeName)
                        const request = store.clear()
                        request.onsuccess = () => resolve()
                        request.onerror = () => reject(request.error)
                    })
                })
            )

            lastUpdated.value = null
            console.log('✅ Cleared all cached data')
        } catch (err) {
            console.error('Error clearing cache:', err)
            throw err
        }
    }

    /**
     * Get cache statistics
     */
    const getCacheStats = async () => {
        try {
            const db = await initDB()
            const stats = {}

            for (const [name, storeName] of Object.entries(STORES)) {
                const transaction = db.transaction([storeName], 'readonly')
                const store = transaction.objectStore(storeName)

                const count = await new Promise((resolve, reject) => {
                    const request = store.count()
                    request.onsuccess = () => resolve(request.result)
                    request.onerror = () => reject(request.error)
                })

                stats[name] = count
            }

            return {
                ...stats,
                lastUpdated: lastUpdated.value,
                version: cacheVersion.value,
            }
        } catch (err) {
            console.error('Error getting cache stats:', err)
            return {}
        }
    }

    return {
        isInitialized,
        isLoading,
        error,
        lastUpdated,
        initDB,
        fetchAndCacheRouteShapes,
        fetchAndCacheRoutes,
        clearCache,
        getCacheStats,
        isDataFresh,
        getData,
    }
}
