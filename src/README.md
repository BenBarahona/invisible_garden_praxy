# Invisible Garden Praxy - Frontend

A modern Web3 frontend application built with Next.js 14, Material UI, and Framer Motion.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Material UI (MUI)** - Modern UI component library
- **Framer Motion** - Animation library
- **Web3 Libraries** - wagmi, viem, RainbowKit, Web3Modal

## Getting Started

### Prerequisites

For local development, no additional setup is required. The app will use file-based storage for certificates.

For **Vercel deployment**, you need to set up Redis storage. See [VERCEL_KV_SETUP.md](../VERCEL_KV_SETUP.md) for detailed instructions.

**Supported Redis Options:**

- Redis Cloud (Recommended - more generous free tier)
- Vercel KV (Built into Vercel Dashboard)
- Any Redis-compatible service

### Installation

```bash
cd src
npm install
# or use pnpm
pnpm install
```

### Development

Run the development server:

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Build

Build the application for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── layout.tsx    # Root layout with providers
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles
├── components/       # Reusable React components
├── lib/              # Utilities and configuration
│   └── theme.ts      # MUI theme configuration
└── public/           # Static assets
```

## Features

- 🎨 Modern, responsive UI with Material UI
- 🌙 Dark mode by default
- ✨ Smooth animations with Framer Motion
- 🔐 Web3 wallet connection ready
- ⚡ Optimized performance with Next.js 14
- 📱 Mobile-responsive design

## Deployment

### Deploying to Vercel

1. **Set up Redis Storage** (Required for production)

   - Follow the detailed guide: [VERCEL_KV_SETUP.md](../VERCEL_KV_SETUP.md)
   - **Option A**: Use Redis Cloud (recommended)
     - Add `REDIS_URL` environment variable to Vercel
   - **Option B**: Use Vercel KV
     - Create KV database in Vercel Dashboard
     - Connect it to your project

2. **Deploy**

   ```bash
   cd src
   vercel --prod
   ```

3. **Verify**
   - Check that certificates sync properly
   - Test proof verification
   - Monitor logs for `[STORAGE] Using backend: redis` or `[STORAGE] Using backend: vercel-kv`

### Storage Backend Detection

The app automatically detects and uses the appropriate storage backend:

- **Local Development**: File-based storage (`linked_certificates_server.json`) - zero config
- **Vercel with Redis Cloud**: Standard Redis via `ioredis` (if `REDIS_URL` is set)
- **Vercel with Vercel KV**: REST API via `@vercel/kv` (if `KV_REST_API_URL` is set)

No code changes needed - it just works! ✨

## Next Steps

- Configure Web3 wallet providers
- Add more pages and routes
- Implement authentication
- Connect to backend services
