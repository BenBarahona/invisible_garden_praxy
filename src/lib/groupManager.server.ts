/**
 * Server-Side Group Manager with File-Based Persistence
 * 
 * This module provides group management functionality for server-side code (API routes).
 * Uses file-based storage to persist between API calls.
 * 
 * For production, replace with proper database (PostgreSQL, Redis, etc.)
 */

import { Group } from "@semaphore-protocol/group";
import certificatesData from "@/data/certificates.json";
import fs from "fs";
import path from "path";

export interface Certificate {
  certificate_number: string;
  first_name: string;
  last_name: string;
}

export interface LinkedCertificate extends Certificate {
  commitment: string;
  linkedAt: string;
}

// ========================================
// File-Based Storage (Development & Production)
// ========================================

const STORAGE_FILE = path.join(process.cwd(), "linked_certificates_server.json");

/**
 * Load certificates from file
 */
function loadCertificatesFromFile(): Map<string, LinkedCertificate> {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, "utf-8");
      const parsed = JSON.parse(data);
      const map = new Map<string, LinkedCertificate>();
      
      for (const [key, value] of Object.entries(parsed)) {
        map.set(key, value as LinkedCertificate);
      }
      
      console.log(`[SERVER] Loaded ${map.size} certificates from file storage`);
      return map;
    }
  } catch (error) {
    console.error("[SERVER] Failed to load certificates from file:", error);
  }
  
  return new Map();
}

/**
 * Save certificates to file
 */
function saveCertificatesToFile(certificates: Map<string, LinkedCertificate>): void {
  try {
    const obj: Record<string, LinkedCertificate> = {};
    const entries = Array.from(certificates.entries());
    for (const [key, value] of entries) {
      obj[key] = value;
    }
    
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(obj, null, 2), "utf-8");
    console.log(`[SERVER] Saved ${certificates.size} certificates to file storage`);
  } catch (error) {
    console.error("[SERVER] Failed to save certificates to file:", error);
  }
}

/**
 * Link a certificate (server-side)
 * This should be called by an API endpoint
 */
export function linkCertificateServer(
  certificateNumber: string,
  firstName: string,
  lastName: string,
  commitment: string
): { success: boolean; message: string } {
  // Verify certificate exists in approved list
  const certificate = certificatesData.approvedCertificates.find(
    (cert) =>
      cert.certificate_number.toLowerCase() === certificateNumber.toLowerCase() &&
      cert.first_name.toLowerCase() === firstName.toLowerCase() &&
      cert.last_name.toLowerCase() === lastName.toLowerCase()
  );

  if (!certificate) {
    return {
      success: false,
      message: "Certificate not found or name mismatch.",
    };
  }

  // Load current certificates
  const linkedCertificates = loadCertificatesFromFile();

  // Check if already linked
  const existing = linkedCertificates.get(certificateNumber);
  
  if (existing) {
    if (existing.commitment === commitment) {
      return {
        success: false,
        message: "Already linked to this wallet.",
      };
    }
    
    return {
      success: false,
      message: "Certificate already linked to another wallet.",
    };
  }

  // Link certificate
  linkedCertificates.set(certificateNumber, {
    ...certificate,
    commitment,
    linkedAt: new Date().toISOString(),
  });

  // Save to file
  saveCertificatesToFile(linkedCertificates);

  // Invalidate cache
  invalidateGroupCacheServer();

  return {
    success: true,
    message: "Certificate linked successfully!",
  };
}

/**
 * Get all approved commitments from linked certificates
 */
export function getAllApprovedCommitmentsServer(): bigint[] {
  console.log("[SERVER] Getting commitments from server storage");
  
  // Always load fresh from file
  const linkedCertificates = loadCertificatesFromFile();
  console.log("[SERVER] Loaded certificates count:", linkedCertificates.size);
  
  const commitments: bigint[] = [];
  
  const certificates = Array.from(linkedCertificates.values());
  for (const linked of certificates) {
    console.log("[SERVER] Adding commitment:", linked.commitment);
    commitments.push(BigInt(linked.commitment));
  }
  
  console.log("[SERVER] Total commitments:", commitments.length);
  return commitments;
}

/**
 * Create medical professionals group
 */
export function createMedicalProfessionalsGroupServer(): Group {
  const commitments = getAllApprovedCommitmentsServer();
  
  if (commitments.length === 0) {
    throw new Error("No linked certificates yet.");
  }
  
  return new Group(commitments);
}

// ========================================
// Group Root Cache (Server-Side)
// ========================================

interface CachedGroupServer {
  root: bigint;
  members: bigint[];
  lastUpdated: number;
}

let cachedMedicalGroupServer: CachedGroupServer | null = null;

/**
 * Get the medical professionals group with caching (server-side)
 */
export async function getMedicalProfessionalsGroupServer(): Promise<{
  group: Group;
  root: bigint;
}> {
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const now = Date.now();
  
  // Return cached group if still valid
  if (
    cachedMedicalGroupServer &&
    now - cachedMedicalGroupServer.lastUpdated < CACHE_DURATION
  ) {
    console.log("[SERVER] Using cached group");
    const group = new Group(cachedMedicalGroupServer.members);
    return { group, root: cachedMedicalGroupServer.root };
  }
  
  console.log("[SERVER] Building new group from file storage");
  
  // Rebuild group from file
  const commitments = getAllApprovedCommitmentsServer();
  
  if (commitments.length === 0) {
    throw new Error("No linked certificates yet.");
  }
  
  const group = new Group(commitments);
  
  // Cache it
  cachedMedicalGroupServer = {
    root: group.root,
    members: commitments,
    lastUpdated: now,
  };
  
  console.log("[SERVER] Cached new group with root:", group.root.toString());
  
  return { group, root: group.root };
}

/**
 * Get current group root (for verification)
 */
export async function getCurrentGroupRootServer(): Promise<bigint> {
  console.log("[SERVER] getCurrentGroupRootServer called");
  
  // Load fresh from file to get current count
  const linkedCertificates = loadCertificatesFromFile();
  console.log("[SERVER] Current file storage size:", linkedCertificates.size);
  
  try {
    const { root } = await getMedicalProfessionalsGroupServer();
    console.log("[SERVER] Successfully got group root:", root.toString());
    return root;
  } catch (error) {
    console.error("[SERVER] Failed to get group root:", error);
    throw error;
  }
}

/**
 * Invalidate the cache
 */
export function invalidateGroupCacheServer(): void {
  cachedMedicalGroupServer = null;
  console.log("[SERVER] Group cache invalidated");
}

/**
 * Sync data from client (for development)
 * In production, use proper database and this won't be needed
 */
export function syncFromClientData(linkedCertificates: LinkedCertificate[]): void {
  console.log("[SERVER] syncFromClientData called with", linkedCertificates.length, "certificates");
  
  const certificatesMap = new Map<string, LinkedCertificate>();
  
  for (const cert of linkedCertificates) {
    console.log("[SERVER] Storing certificate:", {
      number: cert.certificate_number,
      name: `${cert.first_name} ${cert.last_name}`,
      commitment: cert.commitment,
    });
    certificatesMap.set(cert.certificate_number, cert);
  }
  
  // Save to file
  saveCertificatesToFile(certificatesMap);
  
  invalidateGroupCacheServer();
}

/**
 * Get stats
 */
export function getStatsServer() {
  const linkedCertificates = loadCertificatesFromFile();
  return {
    totalApprovedCertificates: certificatesData.approvedCertificates.length,
    totalLinkedCertificates: linkedCertificates.size,
    totalCommitments: getAllApprovedCommitmentsServer().length,
  };
}
