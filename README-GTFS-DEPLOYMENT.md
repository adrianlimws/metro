# GTFS Cloudflare Workers Deployment Guide

This guide will help you deploy the GTFS data management system to Cloudflare Workers.

## 🚀 Prerequisites

1. **Cloudflare Account** - Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI** - Install with `npm install -g wrangler`
3. **API Key** - Your MetroInfo API key

## 📋 Setup Steps

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create KV Namespace

```bash
# Create production namespace
wrangler kv:namespace create "GTFS_KV"

# Create preview namespace
wrangler kv:namespace create "GTFS_KV" --preview
```

### 4. Update wrangler.toml

Replace the KV namespace IDs in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "GTFS_KV"
id = "your-actual-kv-namespace-id"
preview_id = "your-actual-preview-kv-namespace-id"
```

### 5. Set Environment Variables

```bash
# Set your API key
wrangler secret put OCP_APIM_SUBSCRIPTION_KEY
# Enter your MetroInfo API key when prompted

# Set other environment variables
wrangler secret put GTFS_API_URL
# Enter: https://apis.metroinfo.co.nz/rti/gtfs/v1/gtfs.zip

wrangler secret put REALTIME_API_URL
# Enter: https://apis.metroinfo.co.nz/rti/gtfsrt/v1/vehicle-positions.pb
```

### 6. Deploy the Worker

```bash
# Deploy to production
wrangler deploy

# Deploy to staging
wrangler deploy --env staging
```

## 🔧 Configuration

### Environment Variables

| Variable                    | Description             | Example                                                           |
| --------------------------- | ----------------------- | ----------------------------------------------------------------- |
| `OCP_APIM_SUBSCRIPTION_KEY` | MetroInfo API key       | `your-api-key-here`                                               |
| `GTFS_API_URL`              | GTFS data endpoint      | `https://apis.metroinfo.co.nz/rti/gtfs/v1/gtfs.zip`               |
| `REALTIME_API_URL`          | Real-time data endpoint | `https://apis.metroinfo.co.nz/rti/gtfsrt/v1/vehicle-positions.pb` |

### Cron Schedule

The worker is configured to update GTFS data daily at 2 AM UTC:

```toml
[[triggers]]
crons = ["0 2 * * *"]
```

## 📊 API Endpoints

Once deployed, your worker will provide these endpoints:

### GTFS Data Endpoints

- `GET /api/gtfs/routes` - Get all routes
- `GET /api/gtfs/stops` - Get all stops
- `GET /api/gtfs/route/{id}` - Get specific route
- `GET /api/gtfs/stop/{id}` - Get specific stop
- `GET /api/gtfs/search?q={query}` - Search routes/stops
- `GET /api/gtfs/route/{id}/stops` - Get stops for a route

### Admin Endpoints

- `GET /api/admin/gtfs/status` - Get GTFS data status
- `POST /api/admin/gtfs/update` - Force update GTFS data

### Health Check

- `GET /health` - Worker health status

## 🔄 Data Flow

1. **Cron Job** triggers daily at 2 AM UTC
2. **Worker** fetches GTFS data from MetroInfo API
3. **Data** is parsed and stored in KV storage
4. **API** serves data to frontend applications

## 🧪 Testing

### Test the API

```bash
# Test health endpoint
curl https://your-worker.your-subdomain.workers.dev/health

# Test routes endpoint
curl https://your-worker.your-subdomain.workers.dev/api/gtfs/routes

# Test search
curl "https://your-worker.your-subdomain.workers.dev/api/gtfs/search?q=100"
```

### Test Admin Functions

```bash
# Check status
curl https://your-worker.your-subdomain.workers.dev/api/admin/gtfs/status

# Force update
curl -X POST https://your-worker.your-subdomain.workers.dev/api/admin/gtfs/update
```

## 🔍 Monitoring

### Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Workers & Pages
3. Select your worker
4. Monitor logs, metrics, and errors

### Logs

```bash
# View real-time logs
wrangler tail

# View logs for specific environment
wrangler tail --env staging
```

## 🚨 Troubleshooting

### Common Issues

1. **KV Namespace Not Found**

   - Ensure KV namespace is created and IDs are correct in `wrangler.toml`

2. **API Key Issues**

   - Verify API key is set correctly with `wrangler secret list`

3. **Cron Job Not Running**

   - Check cron schedule in `wrangler.toml`
   - Verify worker is deployed successfully

4. **Data Not Updating**
   - Check worker logs for errors
   - Manually trigger update via admin endpoint

### Debug Commands

```bash
# Check worker status
wrangler whoami

# List secrets
wrangler secret list

# View worker details
wrangler dev
```

## 🔄 Updates

### Updating the Worker

```bash
# Deploy updates
wrangler deploy

# Deploy to specific environment
wrangler deploy --env staging
```

### Updating GTFS Data

The worker automatically updates GTFS data daily. To force an update:

```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/api/admin/gtfs/update
```

## 📱 Frontend Integration

Update your frontend to use the new GTFS API:

```javascript
// Update the API base URL in useGTFS.js
const GTFS_API_BASE = "https://your-worker.your-subdomain.workers.dev";
```

## 🎯 Next Steps

1. Deploy the worker following this guide
2. Update your frontend to use the new GTFS API
3. Test all endpoints to ensure everything works
4. Monitor the cron job to ensure data updates automatically
5. Set up monitoring and alerting for any issues

## 📞 Support

If you encounter issues:

1. Check the Cloudflare Workers documentation
2. Review worker logs for error messages
3. Verify all environment variables are set correctly
4. Ensure your API key has the necessary permissions
