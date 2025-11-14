# Vercel KV Setup Guide

This guide explains how to set up Vercel KV (Redis) for certificate storage, which works seamlessly both locally and on Vercel.

## Why Vercel KV?

The app now uses **Vercel KV** (serverless Redis) to store linked certificates. This is required for Vercel deployment because:

- ❌ **File storage doesn't work** on Vercel (read-only filesystem)
- ✅ **KV works everywhere**: Production, preview deployments, and local development
- ✅ **Zero config in production**: Automatically injected environment variables
- ✅ **Simple key-value storage**: Perfect for our certificate data structure

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  certificateStorage.ts (Unified Storage Layer)              │
│  ─────────────────────────────────────────────────────────  │
│  • Auto-detects available storage backend                   │
│  • Provides consistent async API                            │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼──────┐        ┌──────▼──────┐
        │  Vercel KV   │        │File Storage │
        │  (Production)│        │(Local Dev)  │
        └──────────────┘        └─────────────┘
```

## Setup for Production (Vercel)

### Step 1: Create a KV Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Storage** tab
4. Click **Create Database**
5. Select **KV (Redis)**
6. Choose a name (e.g., `invisible-garden-kv`)
7. Select a region (choose closest to your users)
8. Click **Create**

### Step 2: Connect to Your Project

1. In the KV database page, click **Connect to Project**
2. Select your project (e.g., `invisible-garden-praxy`)
3. Choose environment: **Production**, **Preview**, and **Development** (select all)
4. Click **Connect**

That's it! ✅ Vercel automatically injects these environment variables:

- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### Step 3: Deploy

Deploy your project to Vercel:

```bash
cd src
vercel --prod
```

The app will automatically use Vercel KV in production!

## Setup for Local Development

You have **two options** for local development:

### Option 1: File-Based Storage (Easiest)

**No setup required!** Just run your app:

```bash
cd src
npm run dev
# or
pnpm dev
```

The app automatically falls back to file-based storage (`linked_certificates_server.json`) when KV environment variables are not present.

**When to use**: Quick local testing, offline development

### Option 2: Connect to Vercel KV (Recommended for Testing)

Connect to your production KV database from localhost to test with real data:

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

The app automatically detects which storage backend to use:

```typescript
// In certificateStorage.ts
function isKVAvailable(): boolean {
  return !!(
    process.env.KV_URL &&
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  );
}

// All storage functions check availability
export async function loadCertificates() {
  const useKV = isKVAvailable();

  if (useKV) {
    return await loadFromKV(); // Production/connected local
  } else {
    return loadFromFile(); // Pure local dev
  }
}
```

**On Vercel**: KV variables are present → uses Redis  
**On localhost without .env.local**: No variables → uses file storage  
**On localhost with .env.local**: KV variables present → uses Redis

## Data Structure in KV

Certificates are stored as:

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

**Cause**: Certificates exist in local file storage but not in Vercel KV

**Solution**:

1. Open your app in the browser
2. Link a certificate (this triggers sync to server)
3. Or use the sync API: POST `/api/sync-certificates` with your certificates

### KV connection errors in local development

**Check**:

```bash
# Verify .env.local exists and has values
cat src/.env.local

# Restart dev server
cd src
pnpm dev
```

### File storage not working

**Cause**: Trying to use file storage on Vercel

**Solution**: Set up Vercel KV (see steps above)

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
   - `[STORAGE] Using Vercel KV` → Using Redis
   - `[STORAGE] Using file storage` → Using local files

### Check data in KV

1. Go to **Storage** → Your KV database
2. Click **Data Browser**
3. Search for keys starting with `cert:`

## Cost

- **Free tier**: 30,000 commands per month
- **Hobby**: ~3,000 certificate operations = ~6,000 commands (well within free tier)
- **Each certificate operation**: ~2 Redis commands (1 SET + 1 SADD)

You're unlikely to hit the free tier limit unless you have thousands of users.

## Security

- ✅ **Encrypted in transit**: All KV connections use TLS
- ✅ **Encrypted at rest**: Data is encrypted on disk
- ✅ **Scoped credentials**: Tokens are scoped to your project
- ✅ **No public access**: Only accessible via your app's API routes

## Next Steps

1. ✅ Set up Vercel KV (follow steps above)
2. ✅ Deploy to Vercel
3. ✅ Test certificate linking in production
4. ✅ Verify data in KV Data Browser
5. Consider: Add database backups (export to JSON periodically)

## Questions?

- **Vercel KV Docs**: https://vercel.com/docs/storage/vercel-kv
- **Redis Commands**: https://redis.io/commands/
- **@vercel/kv Package**: https://www.npmjs.com/package/@vercel/kv
