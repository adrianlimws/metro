import fetch from 'node-fetch'
import GtfsRealtimeBindings from 'gtfs-realtime-bindings'

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin' : '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    const url        = 'https://apis.metroinfo.co.nz/rti/gtfsrt/v1/vehicle-positions.pb'
    const apiHeaders = {
      'Ocp-Apim-Subscription-Key': process.env.OCP_APIM_SUBSCRIPTION_KEY
    }

    const response = await fetch(url, { headers: apiHeaders })
    const buffer   = await response.arrayBuffer()
    const feed     = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    )

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feed)
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to fetch vehicles' })
    }
  }
}
