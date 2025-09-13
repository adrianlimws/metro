# GTFS Data Fetching Guide

This guide helps you fetch and analyze the GTFS data from MetroInfo API before implementing Cloudflare Workers KV storage.

## Prerequisites

You need the MetroInfo API key. This should be the same key used in your Netlify function.

## Step 1: Set Your API Key

### Windows (PowerShell/CMD):

```bash
set OCP_APIM_SUBSCRIPTION_KEY=your_api_key_here
```

### Windows (PowerShell):

```powershell
$env:OCP_APIM_SUBSCRIPTION_KEY="your_api_key_here"
```

### Linux/Mac:

```bash
export OCP_APIM_SUBSCRIPTION_KEY="your_api_key_here"
```

## Step 2: Test the API (Recommended First)

This will check the API without downloading the full file:

```bash
npm run test-gtfs
```

This will show you:

- File size
- Content type
- Whether the API is accessible
- Recommendations for Cloudflare Workers

## Step 3: Download the Full GTFS Data

If the test looks good, download the full file:

```bash
npm run fetch-gtfs
```

This will:

- Download the complete GTFS ZIP file
- Show download progress
- Analyze the file size and structure
- Provide recommendations for KV storage

## Expected Results

The GTFS data typically contains:

- `routes.txt` - Bus routes information
- `stops.txt` - Bus stops locations
- `trips.txt` - Trip schedules
- `stop_times.txt` - Stop arrival/departure times
- `calendar.txt` - Service calendar
- `agency.txt` - Transit agency information

## Cloudflare Workers Considerations

Based on the file size, you may need to:

### Small Files (< 10MB):

- Direct download and storage in KV
- Simple implementation

### Medium Files (10-50MB):

- Implement timeout handling
- Consider chunked processing

### Large Files (> 50MB):

- Use streaming download
- Store in Cloudflare R2 instead of KV
- Implement background processing
- Consider incremental updates

## Next Steps

After analyzing the data:

1. Implement Cloudflare Worker for GTFS fetching
2. Set up KV storage or R2 for large files
3. Create cron job for regular updates
4. Implement data parsing and API endpoints
