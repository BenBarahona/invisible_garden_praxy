/**
 * Server-Side Group Manager with Vercel KV Support
 * 
 * This module provides group management functionality for server-side code (API routes).
 * Uses Vercel KV (Redis) for production and file-based storage for local development fallback.
 */

import { Group } from "@semaphore-protocol/group";
import certificatesData from "@/data/certificates.json";
import {
  loadCertificates,
  saveCertificates,
  getCertificate,
  setCertificate,
  type LinkedCertificate,
} from "./certificateStorage";

export interface Certificate {
  certificate_number: string;
  first_name: string;
  last_name: string;
}

export type { LinkedCertificate };

/**
 * Link a certificate (server-side)
 * This should be called by an API endpoint
 */
export async function linkCertificateServer(
  certificateNumber: string,
  firstName: string,
  lastName: string,
  commitment: string
): Promise<{ success: boolean; message: string }> {
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

  // Check if already linked
  const existing = await getCertificate(certificateNumber);
  
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
  const linkedCert: LinkedCertificate = {
    ...certificate,
    commitment,
    linkedAt: new Date().toISOString(),
  };

  await setCertificate(certificateNumber, linkedCert);

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
export async function getAllApprovedCommitmentsServer(): Promise<bigint[]> {
  console.log("[SERVER] Getting commitments from storage");
  
  // Load all certificates
  const linkedCertificates = await loadCertificates();
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
export async function createMedicalProfessionalsGroupServer(): Promise<Group> {
  const commitments = await getAllApprovedCommitmentsServer();
  
  if (commitments.length === 0) {
    throw new Error("No linked certificates yet.");
  }
  
  return new Group(commitments);
}

// ========================================
// Group Root Cache (Server-Side)
// ========================================
// NOTE: In-memory cache is disabled in serverless environments to prevent
// stale data across multiple function instances. Vercel KV is already fast enough.

/**
 * Get the medical professionals group (server-side)
 * Always builds fresh from storage - no caching in serverless environment
 */
export async function getMedicalProfessionalsGroupServer(): Promise<{
  group: Group;
  root: bigint;
}> {
  console.log("[SERVER] Building group from storage");
  
  // Always rebuild group from storage to ensure consistency
  // across multiple serverless function instances
  const commitments = await getAllApprovedCommitmentsServer();
  
  if (commitments.length === 0) {
    throw new Error("No linked certificates yet.");
  }
  
  const group = new Group(commitments);
  
  console.log("[SERVER] Built group with root:", group.root.toString());
  console.log("[SERVER] Group has", commitments.length, "members");
  
  return { group, root: group.root };
}

/**
 * Get current group root (for verification)
 */
export async function getCurrentGroupRootServer(): Promise<bigint> {
  console.log("[SERVER] getCurrentGroupRootServer called");
  
  // Load fresh from storage to get current count
  const linkedCertificates = await loadCertificates();
  console.log("[SERVER] Current storage size:", linkedCertificates.size);
  
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
 * Invalidate the cache (no-op in serverless - kept for compatibility)
 */
export function invalidateGroupCacheServer(): void {
  // No-op: In serverless environments, there's no shared cache to invalidate
  // Each function instance builds fresh from storage
  console.log("[SERVER] Cache invalidation requested (no-op in serverless)");
}

/**
 * Sync data from client (for development)
 * In production, this syncs to Vercel KV
 */
export async function syncFromClientData(linkedCertificates: LinkedCertificate[]): Promise<void> {
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
  
  // Save to storage (KV or file)
  await saveCertificates(certificatesMap);
  
  invalidateGroupCacheServer();
}

/**
 * Get stats
 */
export async function getStatsServer() {
  const linkedCertificates = await loadCertificates();
  const commitments = await getAllApprovedCommitmentsServer();
  return {
    totalApprovedCertificates: certificatesData.approvedCertificates.length,
    totalLinkedCertificates: linkedCertificates.size,
    totalCommitments: commitments.length,
  };
}
