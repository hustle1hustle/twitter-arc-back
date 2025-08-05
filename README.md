# Twitter Arc

**Notion:** https://www.notion.so/wtf-Twitter-Arc-23093a2227908091b668c8e81d2cc9dc

**Demo:** https://cozy-mousse-5efbde.netlify.app

## TLDR

- **Reputation scoring** for Twitter profiles using follower analysis
- **Smart follower detection** via TweetScout API with Twitter API fallback
- **Card generation** with React → Puppeteer → S3 storage
- **Real-time processing** via Redis job queue
- **Next.js 14** web interface with Twitter OAuth
- **Edge functions** for scalable API endpoints

## Handle

@rep_hq

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.local.example .env.local

# Start development
pnpm dev:web    # Next.js web app
pnpm dev:worker # Background worker
```

## Architecture

- **Web** (`/web`): Next.js 14 app with Tailwind, tRPC, TypeScript
- **Worker** (`/worker`): Node.js 20 background job processor
- **Redis**: Job queue for card generation
- **S3**: Storage for generated cards and metadata
- **Vercel**: Edge functions and cron jobs

### New API response fields (v1.1)
- **smartTop** – array of 5 handles
- **smartMedianFollowers**
- **engagementRate** – percent
- **topHashtags**, **topMentions**

Bolt placeholders example:
```html
<span data-slot="smartTop.0">@a16z</span>
<span data-slot="engagementRate">3.2%</span>
``` 