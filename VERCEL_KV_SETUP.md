# Storage Setup Guide

This guide explains how to set up Redis storage for certificate persistence, which is required for Vercel deployment.

## Why Redis Storage?

The app uses **Redis** to store linked certificates. This is required for Vercel deployment because:

- ❌ **File storage doesn't work** on Vercel (read-only filesystem)
- ✅ **Redis works everywhere**: Production, preview deployments, and local development
- ✅ **Multiple options**: Vercel KV, Redis Cloud, ElastiCache, or any Redis-compatible service
- ✅ **Simple key-value storage**: Perfect for our certificate data structure

## Supported Storage Backends

The app automatically detects and uses the appropriate storage backend in this priority order:

1. **Vercel KV** (if `KV_REST_API_URL` is set) - Vercel's managed Redis with REST API
2. **Standard Redis** (if `REDIS_URL` is set) - Any Redis-compatible service (Redis Cloud, ElastiCache, etc.)
3. **File Storage** (fallback) - For local development only

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  certificateStorage.ts (Unified Storage Layer)              │
│  ─────────────────────────────────────────────────────────  │
│  • Auto-detects available storage backend                   │
│  • Provides consistent async API                            │
└─────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
  ┌───────▼──────┐  ┌───────▼──────┐  ┌──────▼──────┐
  │  Vercel KV   │  │Standard Redis│  │File Storage │
  │ (REST API)   │  │  (ioredis)   │  │(Local Dev)  │
  └──────────────┘  └──────────────┘  └─────────────┘
```

## Setup Options

You have **two options** for Redis storage on Vercel:

### Option A: Standard Redis (Redis Cloud, ElastiCache, etc.) - Recommended

**Pros:**

- ✅ Works with your existing Redis instance
- ✅ More flexible - use any Redis provider
- ✅ Often has more generous free tiers
- ✅ Can be shared across multiple projects

**Cons:**

- Requires manual environment variable setup

#### Setup Steps for Redis Cloud:

1. **Get Your Redis Connection String**

   - If you already have Redis Cloud, get your connection URL from your dashboard
   - Format: `redis://username:password@host:port`
   - Example: `redis://default:abc123@redis-12345.c256.us-east-1-2.ec2.cloud.redislabs.com:16821`

2. **Add Environment Variable to Vercel**

   - Go to your Vercel project → **Settings** → **Environment Variables**
   - Click **Add New**
   - Key: `REDIS_URL`
   - Value: Your Redis connection string
   - Environments: ✅ Production ✅ Preview ✅ Development
   - Click **Save**

3. **Redeploy**

   ```bash
   cd src
   vercel --prod
   ```

4. **Verify in Logs**
   - Check Vercel logs after deployment
   - Look for: `[STORAGE] Using backend: redis`

**That's it!** Your app will now use your Redis instance.

---

### Option B: Vercel KV (Managed Redis)

**Pros:**

- ✅ Zero-config in Vercel (auto-injected env vars)
- ✅ Built into Vercel Dashboard
- ✅ Serverless-optimized with REST API

**Cons:**

- More restrictive free tier
- Locked into Vercel's ecosystem

#### Setup Steps for Vercel KV:

**Step 1: Create a KV Database**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Storage** tab
4. Click **Create Database**
5. Select **KV (Redis)**
6. Choose a name (e.g., `invisible-garden-kv`)
7. Select a region (choose closest to your users)
8. Click **Create**

**Step 2: Connect to Your Project**

1. In the KV database page, click **Connect to Project**
2. Select your project (e.g., `invisible-garden-praxy`)
3. Choose environment: **Production**, **Preview**, and **Development** (select all)
4. Click **Connect**

That's it! ✅ Vercel automatically injects these environment variables:

- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

**Step 3: Deploy**

Deploy your project to Vercel:

```bash
cd src
vercel --prod
```

The app will automatically use Vercel KV in production!

## Setup for Local Development

You have **three options** for local development:

### Option 1: File-Based Storage (Easiest - No Setup)

**No setup required!** Just run your app:

```bash
cd src
npm run dev
# or
pnpm dev
```

The app automatically falls back to file-based storage (`linked_certificates_server.json`) when no Redis connection is configured.

**When to use**: Quick local testing, offline development

### Option 2: Connect to Your Redis Instance

Use your production Redis (Redis Cloud, etc.) from localhost:

#### 1. Create `.env.local` file

```bash
cd src
cp env.local.example .env.local
```

#### 2. Add your Redis URL

```bash
# For Redis Cloud / standard Redis
REDIS_URL="redis://default:password@redis-12345.c256.us-east-1-2.ec2.cloud.redislabs.com:16821"

# Optional: Skip crypto verification for faster development
SKIP_CRYPTO_VERIFICATION=true
NODE_ENV=development
```

#### 3. Run the app

```bash
pnpm dev
```

**When to use**: Testing with production data, debugging storage issues

### Option 3: Connect to Vercel KV

Connect to your Vercel KV database from localhost:

#### 1. Get your KV credentials

Go to your KV database in Vercel Dashboard and click the `.env.local` tab. Copy the credentials.

#### 2. Create `.env.local` file

```bash
cd src
cp env.local.example .env.local
```

#### 3. Add your KV credentials to `.env.local`

```bash
# Paste the values from Vercel Dashboard
KV_URL="redis://..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
KV_REST_API_READ_ONLY_TOKEN="..."

# Optional: Skip crypto verification for faster development
SKIP_CRYPTO_VERIFICATION=true
NODE_ENV=development
```

#### 4. Run the app

```bash
pnpm dev
```

**When to use**: Testing with production data, debugging storage issues

## How It Works

The app automatically detects which storage backend to use in priority order:

```typescript
// In certificateStorage.ts
function getStorageBackend(): StorageBackend {
  // Priority 1: Vercel KV (REST API)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return "vercel-kv";
  }

  // Priority 2: Standard Redis (ioredis)
  if (process.env.REDIS_URL) {
    return "redis";
  }

  // Priority 3: File fallback
  return "file";
}

// All storage functions automatically route to the right backend
export async function loadCertificates() {
  const backend = getStorageBackend();

  switch (backend) {
    case "vercel-kv":
      return await loadFromKV(); // Vercel KV with REST API
    case "redis":
      return await loadFromRedis(); // Standard Redis via ioredis
    case "file":
      return loadFromFile(); // Local file storage
  }
}
```

**Detection Logic:**

- **On Vercel with Vercel KV**: `KV_REST_API_URL` present → uses Vercel KV
- **On Vercel with Redis Cloud**: `REDIS_URL` present → uses standard Redis
- **On localhost with `.env.local`**: Uses whichever variable you set (REDIS_URL or KV_REST_API_URL)
- **On localhost without `.env.local`**: No variables → uses file storage

## Data Structure in Redis

Certificates are stored identically in both Vercel KV and standard Redis:

```
Key: cert:MN-118951
Value: {
  "certificate_number": "MN-118951",
  "first_name": "Claudia",
  "last_name": "Gutierrez",
  "commitment": "8634188275185702250...",
  "linkedAt": "2025-11-11T02:42:52.408Z"
}

Key: certs:all
Value: Set["MN-118951", "MN-123456", ...]
```

## Migration from File Storage

If you have existing certificates in `linked_certificates_server.json`:

### Option 1: Use the Sync API (Client-side migration)

1. Open your app in the browser
2. The client will automatically sync localStorage to the server
3. If KV is configured, it will save to KV

### Option 2: Manual Migration Script

Create `src/scripts/migrate-to-kv.ts`:

```typescript
import fs from "fs";
import path from "path";
import {
  saveCertificates,
  type LinkedCertificate,
} from "@/lib/certificateStorage";

async function migrate() {
  const filePath = path.join(
    process.cwd(),
    "..",
    "linked_certificates_server.json"
  );

  if (!fs.existsSync(filePath)) {
    console.log("No file to migrate");
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const map = new Map<string, LinkedCertificate>();

  for (const [key, value] of Object.entries(data)) {
    map.set(key, value as LinkedCertificate);
  }

  await saveCertificates(map);
  console.log(`Migrated ${map.size} certificates to KV`);
}

migrate();
```

Run it:

```bash
cd src
npx tsx scripts/migrate-to-kv.ts
```

## Troubleshooting

### "No linked certificates yet" error in production

**Cause**: Certificates exist in local file storage but not in Redis

**Solution**:

1. Open your app in the browser
2. Link a certificate (this triggers sync to server)
3. Or use the sync API: POST `/api/sync-certificates` with your certificates

### Redis connection errors

**For Redis Cloud:**

**Check environment variable:**

```bash
# In Vercel: Settings → Environment Variables
# Should see: REDIS_URL=redis://...
```

**Check connection string format:**

- Should start with `redis://`
- Include username (usually `default`)
- Include password
- Include host and port
- Example: `redis://default:password@host.com:16821`

**For Vercel KV:**

**Check**:

```bash
# Verify .env.local exists and has values
cat src/.env.local

# Restart dev server
cd src
pnpm dev
```

### File storage not working on Vercel

**Cause**: Trying to use file storage on Vercel (read-only filesystem)

**Solution**: Set up Redis storage (either Redis Cloud or Vercel KV - see options above)

## API Endpoints

### Sync Certificates

```http
POST /api/sync-certificates
Content-Type: application/json

{
  "linkedCertificates": [
    {
      "certificate_number": "MN-118951",
      "first_name": "Claudia",
      "last_name": "Gutierrez",
      "commitment": "8634188275185702250...",
      "linkedAt": "2025-11-11T02:42:52.408Z"
    }
  ]
}
```

## Monitoring

### Check logs in Vercel

1. Go to your project in Vercel Dashboard
2. Click **Logs** tab
3. Look for `[STORAGE]` prefixed messages:
   - `[STORAGE] Using backend: vercel-kv` → Using Vercel KV
   - `[STORAGE] Using backend: redis` → Using standard Redis
   - `[STORAGE] Using backend: file` → Using local file storage

### Check data in Redis

**For Vercel KV:**

1. Go to **Storage** → Your KV database in Vercel Dashboard
2. Click **Data Browser**
3. Search for keys starting with `cert:`

**For Redis Cloud:**

1. Go to your Redis Cloud dashboard
2. Use the built-in Redis CLI or browser
3. Search for keys: `KEYS cert:*`
4. View all certificate IDs: `SMEMBERS certs:all`

## Cost Comparison

### Redis Cloud

- **Free tier**: 30MB storage, no command limit
- **Generous limits**: More than enough for certificate storage
- **Cost**: Free for small projects

### Vercel KV

- **Free tier**: 30,000 commands/month, 256MB storage
- **Usage**: ~3,000 certificate operations = ~6,000 commands
- **Cost**: Free for hobby projects

**Both options are free for typical usage.** Redis Cloud has more generous limits.

## Security

Both storage options provide strong security:

- ✅ **Encrypted in transit**: All connections use TLS
- ✅ **Encrypted at rest**: Data is encrypted on disk
- ✅ **Authentication required**: Password/token-based access
- ✅ **No public access**: Only accessible via your app's API routes
- ✅ **Network isolation**: Not exposed to the internet directly

## Next Steps

1. ✅ Choose your Redis option (Redis Cloud or Vercel KV)
2. ✅ Set up environment variables (see setup sections above)
3. ✅ Deploy to Vercel
4. ✅ Test certificate linking in production
5. ✅ Verify data in Redis (via dashboard or logs)
6. Consider: Add database backups (export to JSON periodically)

## Resources

### Redis Cloud

- **Redis Cloud Dashboard**: https://app.redislabs.com/
- **Redis Commands**: https://redis.io/commands/
- **ioredis Package**: https://www.npmjs.com/package/ioredis

### Vercel KV

- **Vercel KV Docs**: https://vercel.com/docs/storage/vercel-kv
- **@vercel/kv Package**: https://www.npmjs.com/package/@vercel/kv

### General

- **Redis Documentation**: https://redis.io/docs/
- **Upstash (Vercel KV backend)**: https://upstash.com/
