# Metro Vue.js App

A Vue.js application that displays real-time vehicle positions from Metroinfo's API on an interactive map.

## Features

- Real-time vehicle position tracking
- Interactive Leaflet map
- Auto-refresh every 30 seconds
- Responsive design
- Netlify Functions for API proxy

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

   - Copy `env.example` to `.env`
   - Add your Metroinfo API key to the `.env` file

3. Run locally:

```bash
npm run dev
```

4. Test with Netlify Functions locally:

```bash
npm run netlify:dev
```

## Deployment to Netlify

1. Build the project:

```bash
npm run build
```

2. Deploy to Netlify:

   - Connect your GitHub repository to Netlify
   - Set the build command: `npm run build`
   - Set the publish directory: `dist`
   - Add environment variable `OCP_APIM_SUBSCRIPTION_KEY` in Netlify dashboard

3. The app will be automatically deployed and available at your Netlify URL.

## Project Structure

```
├── src/
│   ├── components/
│   │   └── MetroMap.vue    # Main map component
│   ├── App.vue             # Root Vue component
│   └── main.js             # Vue app entry point
├── netlify/
│   └── functions/
│       └── vehicles.js     # Netlify Function for API proxy
├── netlify.toml            # Netlify configuration
└── package.json            # Dependencies and scripts
```

## API

The app uses Netlify Functions to proxy requests to the Metroinfo API, avoiding CORS issues and keeping API keys secure.
