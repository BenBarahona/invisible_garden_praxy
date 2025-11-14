/**
 * Certificate Storage Adapter
 * 
 * Provides a unified interface for storing linked certificates.
 * - Uses Vercel KV (Redis) when available (production & local dev with connection)
 * - Falls back to file-based storage for pure local development
 */

import { kv } from "@vercel/kv";
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

// Check if KV is available by testing for environment variables
function isKVAvailable(): boolean {
  return !!(process.env.KV_URL && process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
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
    console.log(`[STORAGE] Saved ${certificates.size} certificates to KV`);
  } catch (error) {
    console.error("[STORAGE] Failed to save to KV:", error);
    throw error;
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
  const useKV = isKVAvailable();
  console.log(`[STORAGE] Using ${useKV ? "Vercel KV" : "file storage"}`);
  
  if (useKV) {
    return await loadFromKV();
  } else {
    return loadFromFile();
  }
}

/**
 * Save all linked certificates
 */
export async function saveCertificates(certificates: Map<string, LinkedCertificate>): Promise<void> {
  const useKV = isKVAvailable();
  
  if (useKV) {
    await saveToKV(certificates);
  } else {
    saveToFile(certificates);
  }
}

/**
 * Get a single certificate
 */
export async function getCertificate(certificateNumber: string): Promise<LinkedCertificate | null> {
  const useKV = isKVAvailable();
  
  if (useKV) {
    return await getOneFromKV(certificateNumber);
  } else {
    const all = loadFromFile();
    return all.get(certificateNumber) || null;
  }
}

/**
 * Save a single certificate
 */
export async function setCertificate(certificateNumber: string, certificate: LinkedCertificate): Promise<void> {
  const useKV = isKVAvailable();
  
  if (useKV) {
    await setOneInKV(certificateNumber, certificate);
  } else {
    const all = loadFromFile();
    all.set(certificateNumber, certificate);
    saveToFile(all);
  }
}

