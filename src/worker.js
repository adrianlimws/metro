/**
 * Metro GTFS API Worker
 * Serves GTFS data from Cloudflare KV storage
 */

export default {
  async fetch(request, env, ctx) {
    try {
      // Set CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      };

      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      // Parse URL and validate parameters
      const url = new URL(request.url);
      const path = url.pathname;
      const searchParams = url.searchParams;

      // Route handling
      switch (path) {
        case '/api/stops':
          return await handleStopsRequest(env, searchParams, corsHeaders);
        case '/api/routes':
          return await handleRoutesRequest(env, searchParams, corsHeaders);
        case '/api/agency':
          return await handleAgencyRequest(env, corsHeaders);
        case '/api/calendar':
          return await handleCalendarRequest(env, corsHeaders);
        case '/api/shapes':
          return await handleShapesRequest(env, searchParams, corsHeaders);
        case '/api/stop-times':
          return await handleStopTimesRequest(env, searchParams, corsHeaders);
        case '/api/trips':
          return await handleTripsRequest(env, searchParams, corsHeaders);
        case '/api/health':
          return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
            headers: corsHeaders,
          });
        case '/':
          return new Response(JSON.stringify({
            name: 'Metro GTFS API',
            version: '1.0.0',
            endpoints: [
              'GET /api/stops - Get all bus stops',
              'GET /api/routes - Get all routes',
              'GET /api/agency - Get agency information',
              'GET /api/calendar - Get service calendar',
              'GET /api/shapes - Get route shapes',
              'GET /api/stop-times - Get stop times',
              'GET /api/trips - Get trips',
              'GET /api/health - Health check'
            ]
          }), {
            headers: corsHeaders,
          });
        default:
          return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: corsHeaders,
          });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }
  },
};

/**
 * Handle stops request with optional filtering
 */
async function handleStopsRequest(env, searchParams, corsHeaders) {
  try {
    const stops = await env.METRO_KV.get('gtfs:stops', 'json');
    
    if (!stops) {
      return new Response(JSON.stringify({ error: 'Stops data not found' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Apply filters if provided
    let filteredStops = stops;

    // Filter by route_id if provided
    const routeId = searchParams.get('route_id');
    if (routeId) {
      // Get stop times for the route to find relevant stops
      const stopTimes = await env.METRO_KV.get('gtfs:stop_times', 'json');
      if (stopTimes) {
        const routeStopIds = new Set();
        stopTimes.forEach(stopTime => {
          if (stopTime.route_id === routeId) {
            routeStopIds.add(stopTime.stop_id);
          }
        });
        filteredStops = stops.filter(stop => routeStopIds.has(stop.stop_id));
      }
    }

    // Filter by search term if provided
    const search = searchParams.get('search');
    if (search) {
      const searchLower = search.toLowerCase();
      filteredStops = filteredStops.filter(stop => 
        stop.stop_name.toLowerCase().includes(searchLower) ||
        stop.stop_code.toLowerCase().includes(searchLower)
      );
    }

    // Filter by bounds if provided
    const minLat = searchParams.get('min_lat');
    const maxLat = searchParams.get('max_lat');
    const minLon = searchParams.get('min_lon');
    const maxLon = searchParams.get('max_lon');
    
    if (minLat && maxLat && minLon && maxLon) {
      filteredStops = filteredStops.filter(stop => 
        stop.stop_lat >= parseFloat(minLat) &&
        stop.stop_lat <= parseFloat(maxLat) &&
        stop.stop_lon >= parseFloat(minLon) &&
        stop.stop_lon <= parseFloat(maxLon)
      );
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedStops = filteredStops.slice(startIndex, endIndex);

    return new Response(JSON.stringify({
      data: paginatedStops,
      pagination: {
        page,
        limit,
        total: filteredStops.length,
        totalPages: Math.ceil(filteredStops.length / limit)
      }
    }), {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300', // 5 minutes cache
      },
    });
  } catch (error) {
    console.error('Stops request error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch stops data' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

/**
 * Handle routes request
 */
async function handleRoutesRequest(env, searchParams, corsHeaders) {
  try {
    const routes = await env.METRO_KV.get('gtfs:routes', 'json');
    
    if (!routes) {
      return new Response(JSON.stringify({ error: 'Routes data not found' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Filter by search term if provided
    const search = searchParams.get('search');
    let filteredRoutes = routes;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredRoutes = routes.filter(route => 
        route.route_long_name.toLowerCase().includes(searchLower) ||
        route.route_short_name.toLowerCase().includes(searchLower)
      );
    }

    return new Response(JSON.stringify({
      data: filteredRoutes,
      total: filteredRoutes.length
    }), {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=3600', // 1 hour cache
      },
    });
  } catch (error) {
    console.error('Routes request error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch routes data' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

/**
 * Handle agency request
 */
async function handleAgencyRequest(env, corsHeaders) {
  try {
    const agency = await env.METRO_KV.get('gtfs:agency', 'json');
    
    if (!agency) {
      return new Response(JSON.stringify({ error: 'Agency data not found' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({
      data: agency,
      total: agency.length
    }), {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=86400', // 24 hours cache
      },
    });
  } catch (error) {
    console.error('Agency request error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch agency data' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

/**
 * Handle calendar request
 */
async function handleCalendarRequest(env, corsHeaders) {
  try {
    const calendar = await env.METRO_KV.get('gtfs:calendar', 'json');
    
    if (!calendar) {
      return new Response(JSON.stringify({ error: 'Calendar data not found' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({
      data: calendar,
      total: calendar.length
    }), {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=3600', // 1 hour cache
      },
    });
  } catch (error) {
    console.error('Calendar request error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch calendar data' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

/**
 * Handle shapes request
 */
async function handleShapesRequest(env, searchParams, corsHeaders) {
  try {
    const shapes = await env.METRO_KV.get('gtfs:shapes', 'json');
    
    if (!shapes) {
      return new Response(JSON.stringify({ error: 'Shapes data not found' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Filter by shape_id if provided
    const shapeId = searchParams.get('shape_id');
    let filteredShapes = shapes;
    if (shapeId) {
      filteredShapes = shapes.filter(shape => shape.shape_id === shapeId);
    }

    return new Response(JSON.stringify({
      data: filteredShapes,
      total: filteredShapes.length
    }), {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=3600', // 1 hour cache
      },
    });
  } catch (error) {
    console.error('Shapes request error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch shapes data' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

/**
 * Handle stop times request
 */
async function handleStopTimesRequest(env, searchParams, corsHeaders) {
  try {
    // Get stop times from the main key first
    let stopTimes = await env.METRO_KV.get('gtfs:stop_times', 'json');
    
    if (!stopTimes) {
      // If main key doesn't exist, try to get from chunks
      stopTimes = [];
      for (let i = 0; i < 32; i++) {
        const chunk = await env.METRO_KV.get(`gtfs:stop_times:chunk:${i}`, 'json');
        if (chunk) {
          stopTimes = stopTimes.concat(chunk);
        }
      }
    }

    if (!stopTimes || stopTimes.length === 0) {
      return new Response(JSON.stringify({ error: 'Stop times data not found' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Filter by stop_id if provided
    const stopId = searchParams.get('stop_id');
    if (stopId) {
      stopTimes = stopTimes.filter(stopTime => stopTime.stop_id === stopId);
    }

    // Filter by route_id if provided
    const routeId = searchParams.get('route_id');
    if (routeId) {
      stopTimes = stopTimes.filter(stopTime => stopTime.route_id === routeId);
    }

    // Filter by trip_id if provided
    const tripId = searchParams.get('trip_id');
    if (tripId) {
      stopTimes = stopTimes.filter(stopTime => stopTime.trip_id === tripId);
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedStopTimes = stopTimes.slice(startIndex, endIndex);

    return new Response(JSON.stringify({
      data: paginatedStopTimes,
      pagination: {
        page,
        limit,
        total: stopTimes.length,
        totalPages: Math.ceil(stopTimes.length / limit)
      }
    }), {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300', // 5 minutes cache
      },
    });
  } catch (error) {
    console.error('Stop times request error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch stop times data' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

/**
 * Handle trips request
 */
async function handleTripsRequest(env, searchParams, corsHeaders) {
  try {
    const trips = await env.METRO_KV.get('gtfs:trips', 'json');
    
    if (!trips) {
      return new Response(JSON.stringify({ error: 'Trips data not found' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Filter by route_id if provided
    const routeId = searchParams.get('route_id');
    let filteredTrips = trips;
    if (routeId) {
      filteredTrips = trips.filter(trip => trip.route_id === routeId);
    }

    // Filter by service_id if provided
    const serviceId = searchParams.get('service_id');
    if (serviceId) {
      filteredTrips = filteredTrips.filter(trip => trip.service_id === serviceId);
    }

    return new Response(JSON.stringify({
      data: filteredTrips,
      total: filteredTrips.length
    }), {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=1800', // 30 minutes cache
      },
    });
  } catch (error) {
    console.error('Trips request error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch trips data' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
