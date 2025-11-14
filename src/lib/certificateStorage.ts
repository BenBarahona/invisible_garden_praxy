/**
 * Certificate Storage Adapter
 * 
 * Provides a unified interface for storing linked certificates.
 * - Uses Vercel KV when KV_REST_API_URL is available
 * - Uses standard Redis (ioredis) when REDIS_URL is available
 * - Falls back to file-based storage for pure local development
 */

import { kv } from "@vercel/kv";
import Redis from "ioredis";
import fs from "fs";
import path from "path";

export interface LinkedCertificate {
  certificate_number: string;
  first_name: string;
  last_name: string;
  commitment: string;
  linkedAt: string;
}

const KV_PREFIX = "cert:";
const KV_ALL_CERTS_KEY = "certs:all";
const FILE_STORAGE_PATH = path.join(process.cwd(), "linked_certificates_server.json");

// Redis client singleton
let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient && process.env.REDIS_URL) {
    console.log("[STORAGE] Creating Redis client...");
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
    
    redisClient.on("error", (err) => {
      console.error("[STORAGE] Redis client error:", err);
    });
    
    redisClient.on("connect", () => {
      console.log("[STORAGE] Redis client connected");
    });
  }
  
  if (!redisClient) {
    throw new Error("Redis client not initialized");
  }
  
  return redisClient;
}

// Storage backend detection
type StorageBackend = "vercel-kv" | "redis" | "file";

function getStorageBackend(): StorageBackend {
  // Vercel KV takes priority (REST API)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return "vercel-kv";
  }
  
  // Standard Redis (ioredis)
  if (process.env.REDIS_URL) {
    return "redis";
  }
  
  // File fallback
  return "file";
}

function logStorageBackend(): void {
  const backend = getStorageBackend();
  console.log(`[STORAGE] Using backend: ${backend}`);
  
  if (backend === "file") {
    console.log("[STORAGE] Environment check:", {
      hasKV_REST_API_URL: !!process.env.KV_REST_API_URL,
      hasKV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
      hasREDIS_URL: !!process.env.REDIS_URL,
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
    });
  }
}

// ========================================
// File-Based Storage (Fallback)
// ========================================

function loadFromFile(): Map<string, LinkedCertificate> {
  try {
    if (fs.existsSync(FILE_STORAGE_PATH)) {
      const data = fs.readFileSync(FILE_STORAGE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      const map = new Map<string, LinkedCertificate>();
      
      for (const [key, value] of Object.entries(parsed)) {
        map.set(key, value as LinkedCertificate);
      }
      
      console.log(`[STORAGE] Loaded ${map.size} certificates from file`);
      return map;
    }
  } catch (error) {
    console.error("[STORAGE] Failed to load from file:", error);
  }
  
  return new Map();
}

function saveToFile(certificates: Map<string, LinkedCertificate>): void {
  try {
    const obj: Record<string, LinkedCertificate> = {};
    for (const [key, value] of certificates) {
      obj[key] = value;
    }
    
    fs.writeFileSync(FILE_STORAGE_PATH, JSON.stringify(obj, null, 2), "utf-8");
    console.log(`[STORAGE] Saved ${certificates.size} certificates to file`);
  } catch (error) {
    console.error("[STORAGE] Failed to save to file:", error);
    
    // Check if we're in a serverless environment (Vercel)
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      throw new Error(
        "File storage not available in serverless environment. Please set up Vercel KV. " +
        "See VERCEL_KV_SETUP.md for instructions."
      );
    }
    
    throw error;
  }
}

// ========================================
// Standard Redis Storage (ioredis)
// ========================================

async function loadFromRedis(): Promise<Map<string, LinkedCertificate>> {
  try {
    const redis = getRedisClient();
    
    // Get all certificate numbers from the set
    const certNumbers = await redis.smembers(KV_ALL_CERTS_KEY);
    const map = new Map<string, LinkedCertificate>();
    
    if (certNumbers && certNumbers.length > 0) {
      // Fetch all certificates in parallel
      const pipeline = redis.pipeline();
      certNumbers.forEach((certNum) => {
        pipeline.get(`${KV_PREFIX}${certNum}`);
      });
      
      const results = await pipeline.exec();
      
      if (results) {
        results.forEach((result, index) => {
          if (result && result[1]) {
            const cert = JSON.parse(result[1] as string) as LinkedCertificate;
            map.set(certNumbers[index], cert);
          }
        });
      }
    }
    
    console.log(`[STORAGE] Loaded ${map.size} certificates from Redis`);
    return map;
  } catch (error) {
    console.error("[STORAGE] Failed to load from Redis:", error);
    throw error;
  }
}

async function saveToRedis(certificates: Map<string, LinkedCertificate>): Promise<void> {
  try {
    console.log(`[STORAGE] Attempting to save ${certificates.size} certificates to Redis...`);
    
    const redis = getRedisClient();
    const pipeline = redis.pipeline();
    
    // Clear the set of certificate numbers
    pipeline.del(KV_ALL_CERTS_KEY);
    
    // Add all certificates
    for (const [certNumber, cert] of certificates) {
      pipeline.set(`${KV_PREFIX}${certNumber}`, JSON.stringify(cert));
      pipeline.sadd(KV_ALL_CERTS_KEY, certNumber);
    }
    
    await pipeline.exec();
    console.log(`[STORAGE] ✅ Successfully saved ${certificates.size} certificates to Redis`);
  } catch (error) {
    console.error("[STORAGE] ❌ Failed to save to Redis:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      certificateCount: certificates.size,
    });
    
    throw new Error(
      `Failed to save to Redis: ${error instanceof Error ? error.message : String(error)}. ` +
      "Please check your Redis connection."
    );
  }
}

async function getOneFromRedis(certificateNumber: string): Promise<LinkedCertificate | null> {
  try {
    const redis = getRedisClient();
    const data = await redis.get(`${KV_PREFIX}${certificateNumber}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("[STORAGE] Failed to get from Redis:", error);
    throw error;
  }
}

async function setOneInRedis(certificateNumber: string, certificate: LinkedCertificate): Promise<void> {
  try {
    const redis = getRedisClient();
    const pipeline = redis.pipeline();
    pipeline.set(`${KV_PREFIX}${certificateNumber}`, JSON.stringify(certificate));
    pipeline.sadd(KV_ALL_CERTS_KEY, certificateNumber);
    await pipeline.exec();
    console.log(`[STORAGE] Saved certificate ${certificateNumber} to Redis`);
  } catch (error) {
    console.error("[STORAGE] Failed to set in Redis:", error);
    throw error;
  }
}

// ========================================
// Vercel KV Storage
// ========================================

async function loadFromKV(): Promise<Map<string, LinkedCertificate>> {
  try {
    // Get all certificate numbers from the set
    const certNumbers = await kv.smembers(KV_ALL_CERTS_KEY);
    const map = new Map<string, LinkedCertificate>();
    
    if (certNumbers && certNumbers.length > 0) {
      // Fetch all certificates in parallel
      const certificates = await Promise.all(
        certNumbers.map((certNum) => kv.get<LinkedCertificate>(`${KV_PREFIX}${certNum}`))
      );
      
      certificates.forEach((cert, index) => {
        if (cert) {
          map.set(certNumbers[index] as string, cert);
        }
      });
    }
    
    console.log(`[STORAGE] Loaded ${map.size} certificates from KV`);
    return map;
  } catch (error) {
    console.error("[STORAGE] Failed to load from KV:", error);
    throw error;
  }
}

async function saveToKV(certificates: Map<string, LinkedCertificate>): Promise<void> {
  try {
    console.log(`[STORAGE] Attempting to save ${certificates.size} certificates to KV...`);
    
    // Use a pipeline for atomic operations
    const pipeline = kv.pipeline();
    
    // Clear the set of certificate numbers
    pipeline.del(KV_ALL_CERTS_KEY);
    
    // Add all certificates
    for (const [certNumber, cert] of certificates) {
      pipeline.set(`${KV_PREFIX}${certNumber}`, cert);
      pipeline.sadd(KV_ALL_CERTS_KEY, certNumber);
    }
    
    await pipeline.exec();
    console.log(`[STORAGE] ✅ Successfully saved ${certificates.size} certificates to KV`);
  } catch (error) {
    console.error("[STORAGE] ❌ Failed to save to KV:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      certificateCount: certificates.size,
    });
    
    throw new Error(
      `Failed to save to Vercel KV: ${error instanceof Error ? error.message : String(error)}. ` +
      "Please check your KV configuration in Vercel Dashboard."
    );
  }
}

async function getOneFromKV(certificateNumber: string): Promise<LinkedCertificate | null> {
  try {
    const cert = await kv.get<LinkedCertificate>(`${KV_PREFIX}${certificateNumber}`);
    return cert;
  } catch (error) {
    console.error("[STORAGE] Failed to get from KV:", error);
    throw error;
  }
}

async function setOneInKV(certificateNumber: string, certificate: LinkedCertificate): Promise<void> {
  try {
    const pipeline = kv.pipeline();
    pipeline.set(`${KV_PREFIX}${certificateNumber}`, certificate);
    pipeline.sadd(KV_ALL_CERTS_KEY, certificateNumber);
    await pipeline.exec();
    console.log(`[STORAGE] Saved certificate ${certificateNumber} to KV`);
  } catch (error) {
    console.error("[STORAGE] Failed to set in KV:", error);
    throw error;
  }
}

// ========================================
// Unified Storage Interface
// ========================================

/**
 * Load all linked certificates
 */
export async function loadCertificates(): Promise<Map<string, LinkedCertificate>> {
  const backend = getStorageBackend();
  logStorageBackend();
  
  switch (backend) {
    case "vercel-kv":
      return await loadFromKV();
    case "redis":
      return await loadFromRedis();
    case "file":
      return loadFromFile();
  }
}

/**
 * Save all linked certificates
 */
export async function saveCertificates(certificates: Map<string, LinkedCertificate>): Promise<void> {
  const backend = getStorageBackend();
  console.log(`[STORAGE] saveCertificates called - using ${backend} storage`);
  
  try {
    switch (backend) {
      case "vercel-kv":
        await saveToKV(certificates);
        break;
      case "redis":
        await saveToRedis(certificates);
        break;
      case "file":
        saveToFile(certificates);
        break;
    }
  } catch (error) {
    console.error("[STORAGE] saveCertificates failed:", error);
    throw error;
  }
}

/**
 * Get a single certificate
 */
export async function getCertificate(certificateNumber: string): Promise<LinkedCertificate | null> {
  const backend = getStorageBackend();
  
  switch (backend) {
    case "vercel-kv":
      return await getOneFromKV(certificateNumber);
    case "redis":
      return await getOneFromRedis(certificateNumber);
    case "file":
      const all = loadFromFile();
      return all.get(certificateNumber) || null;
  }
}

/**
 * Save a single certificate
 */
export async function setCertificate(certificateNumber: string, certificate: LinkedCertificate): Promise<void> {
  const backend = getStorageBackend();
  
  switch (backend) {
    case "vercel-kv":
      await setOneInKV(certificateNumber, certificate);
      break;
    case "redis":
      await setOneInRedis(certificateNumber, certificate);
      break;
    case "file":
      const all = loadFromFile();
      all.set(certificateNumber, certificate);
      saveToFile(all);
      break;
  }
}

