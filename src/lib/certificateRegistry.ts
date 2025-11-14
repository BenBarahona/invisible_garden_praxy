"use client";

import certificatesData from "@/data/certificates.json";

export interface Certificate {
  certificate_number: string;
  first_name: string;
  last_name: string;
}

export interface LinkedCertificate extends Certificate {
  commitment: string;  // Single wallet only
  linkedAt: Date;
}

// ========================================
// localStorage Persistence
// ========================================

const STORAGE_KEY = "praxy_linked_certificates";

// Load from localStorage on initialization
function loadLinkedCertificates(): Map<string, LinkedCertificate> {
  if (typeof window === "undefined") return new Map();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      const map = new Map<string, LinkedCertificate>();
      
      for (const [key, value] of Object.entries(data)) {
        map.set(key, {
          ...(value as any),
          linkedAt: new Date((value as any).linkedAt),
        });
      }
      
      return map;
    }
  } catch (error) {
    console.error("Failed to load linked certificates:", error);
  }
  
  return new Map();
}

// Save to localStorage
function saveLinkedCertificates(): void {
  if (typeof window === "undefined") return;
  
  try {
    const data: Record<string, any> = {};
    Array.from(linkedCertificates.entries()).forEach(([key, value]) => {
      data[key] = value;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save linked certificates:", error);
  }
}

const linkedCertificates: Map<string, LinkedCertificate> = loadLinkedCertificates();

/**
 * Get all approved certificates from JSON
 */
export function getApprovedCertificates(): Certificate[] {
  return certificatesData.approvedCertificates;
}

/**
 * Verify if certificate exists and matches name
 */
export function verifyCertificate(
  certificateNumber: string,
  firstName: string,
  lastName: string
): Certificate | null {
  const certificates = getApprovedCertificates();
  
  const found = certificates.find(
    (cert) =>
      cert.certificate_number.toLowerCase() === certificateNumber.toLowerCase() &&
      cert.first_name.toLowerCase() === firstName.toLowerCase() &&
      cert.last_name.toLowerCase() === lastName.toLowerCase()
  );
  
  return found || null;
}

/**
 * Link a certificate to a Semaphore commitment
 */
export function linkCertificateToCommitment(
  certificateNumber: string,
  firstName: string,
  lastName: string,
  commitment: string
): { success: boolean; message: string; certificate?: LinkedCertificate } {
  // First, verify the certificate exists
  const certificate = verifyCertificate(certificateNumber, firstName, lastName);
  
  if (!certificate) {
    return {
      success: false,
      message: "Certificate not found or name mismatch. Please check your information.",
    };
  }
  
  // Check if certificate is already linked
  const existing = linkedCertificates.get(certificateNumber);
  
  if (existing) {
    // Only one wallet allowed per certificate
    if (existing.commitment === commitment) {
      return {
        success: false,
        message: "This wallet is already linked to this certificate.",
      };
    }
    
    // Certificate already linked to a different wallet
    return {
      success: false,
      message: "This certificate is already linked to another wallet. Only one wallet per certificate is allowed.",
    };
  }
  
  // Create new linked certificate
  const linked: LinkedCertificate = {
    ...certificate,
    commitment: commitment,
    linkedAt: new Date(),
  };
  
  linkedCertificates.set(certificateNumber, linked);
  saveLinkedCertificates(); // Persist to localStorage
  
  return {
    success: true,
    message: "Certificate verified and linked successfully!",
    certificate: linked,
  };
}

/**
 * Get all commitments from linked certificates
 * This is what builds the Semaphore group
 */
export function getAllApprovedCommitments(): bigint[] {
  const commitments: bigint[] = [];
  
  Array.from(linkedCertificates.values()).forEach((linked) => {
    commitments.push(BigInt(linked.commitment));
  });
  
  return commitments;
}

/**
 * Check if a commitment is already linked
 */
export function isCommitmentLinked(commitment: string): boolean {
  return Array.from(linkedCertificates.values()).some(
    (linked) => linked.commitment === commitment
  );
}

/**
 * Get certificate info by commitment (for display only)
 */
export function getCertificateByCommitment(
  commitment: string
): LinkedCertificate | null {
  return (
    Array.from(linkedCertificates.values()).find(
      (linked) => linked.commitment === commitment
    ) || null
  );
}

/**
 * Get all linked certificates (for admin view)
 */
export function getAllLinkedCertificates(): LinkedCertificate[] {
  return Array.from(linkedCertificates.values());
}

/**
 * Revoke a certificate (remove all commitments)
 */
export function revokeCertificate(certificateNumber: string): boolean {
  const result = linkedCertificates.delete(certificateNumber);
  if (result) {
    saveLinkedCertificates(); // Persist to localStorage
  }
  return result;
}

/**
 * Remove commitment from certificate (unlinks wallet)
 */
export function removeCommitment(
  certificateNumber: string,
  commitment: string
): boolean {
  const linked = linkedCertificates.get(certificateNumber);
  
  if (!linked) return false;
  
  // Check if this is the linked commitment
  if (linked.commitment === commitment) {
    linkedCertificates.delete(certificateNumber);
    saveLinkedCertificates(); // Persist to localStorage
    return true;
  }
  
  return false;
}

// ========================================
// Statistics & Info
// ========================================

/**
 * Get statistics
 */
export function getStats() {
  return {
    totalApprovedCertificates: getApprovedCertificates().length,
    totalLinkedCertificates: linkedCertificates.size,
    totalCommitments: getAllApprovedCommitments().length,
  };
}

/**
 * Sync certificates to server
 * This allows the server-side API to access the group data
 */
export async function syncCertificatesToServer(): Promise<boolean> {
  if (typeof window === "undefined") {
    console.warn("syncCertificatesToServer: Not in browser environment, skipping sync");
    return false;
  }
  
  try {
    const certificates = getAllLinkedCertificates();
    
    console.log(`[SYNC] Syncing ${certificates.length} certificate(s) to server...`);
    
    const response = await fetch("/api/sync-certificates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        linkedCertificates: certificates,
      }),
    });
    
    if (!response.ok) {
      console.error("[SYNC] Server responded with error:", response.status);
      return false;
    }
    
    const result = await response.json();
    console.log(`[SYNC] Sync ${result.success ? "successful" : "failed"}:`, result);
    return result.success;
  } catch (error) {
    console.error("[SYNC] Failed to sync certificates:", error);
    return false;
  }
}

