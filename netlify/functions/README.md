# Netlify Functions

This directory contains serverless functions for the Twitter Arc backend.

## Functions

### `rep.ts`
- **Endpoint**: `/.netlify/functions/rep?u={handle}`
- **Purpose**: Fetches user data from TweetScout and computes reputation scores
- **Returns**: JSON with reputation data

### `auth_x.ts`
- **Endpoint**: `/.netlify/functions/auth_x`
- **Purpose**: Handles Twitter OAuth 1.0a flow
- **Flow**: 
  1. Redirects to Twitter OAuth
  2. Handles callback and exchanges tokens
  3. Redirects to frontend with user handle

## Environment Variables

Required environment variables in Netlify:

```bash
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_CALLBACK=https://your-site.netlify.app/.netlify/functions/auth_x
TWEETSCOUT_KEY=your_tweetscout_key
```

## CORS Configuration

Functions are configured to allow requests from:
- `https://rad-toffee-97e32a.netlify.app`

## Development

1. Install dependencies:
   ```bash
   cd netlify/functions
   npm install
   ```

2. Test locally with Netlify CLI:
   ```bash
   netlify dev
   ```

3. Deploy:
   ```bash
   netlify deploy --prod
   ``` 