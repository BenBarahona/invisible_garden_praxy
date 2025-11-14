"use client";

import { Group } from "@semaphore-protocol/group";
import { getAllApprovedCommitments } from "./certificateRegistry";

/**
 * Group Manager - Manages approved medical professional groups
 * 
 * Now integrated with certificateRegistry!
 * 
 * Flow:
 * 1. Certificates loaded from JSON file (certificate_number, first_name, last_name)
 * 2. Users verify their certificate and link to Semaphore commitment
 * 3. Auto-approved if certificate exists in JSON
 * 4. System builds Semaphore group from all linked commitments
 */

/**
 * Creates a group from all linked and approved certificates
 * This represents your "whitelist" of verified medical professionals
 */
export function createMedicalProfessionalsGroup(): Group {
  const commitments = getAllApprovedCommitments();
  
  if (commitments.length === 0) {
    throw new Error(
      "No linked certificates yet. Please register with a valid certificate."
    );
  }
  
  return new Group(commitments);
}

// ========================================
// Group Root Cache (for performance)
// ========================================
// NOTE: Cache is disabled to ensure consistency when syncing with server
// Merkle tree building is fast enough without caching

/**
 * Gets the current medical professionals group
 * Always builds fresh from localStorage to ensure consistency
 */
export async function getMedicalProfessionalsGroup(): Promise<{
  group: Group;
  root: bigint;
}> {
  const commitments = getAllApprovedCommitments();
  
  if (commitments.length === 0) {
    throw new Error("No linked certificates yet.");
  }
  
  const group = new Group(commitments);
  
  return { group, root: group.root };
}

/**
 * Invalidates the cache (no-op - kept for compatibility)
 */
export function invalidateGroupCache(): void {
  // No-op: Cache is disabled to prevent sync issues
}

/**
 * Gets the current Merkle root of the medical professionals group
 * This is what you use for verification!
 */
export async function getCurrentGroupRoot(): Promise<bigint> {
  const { root } = await getMedicalProfessionalsGroup();
  return root;
}

/**
 * Fetch the medical professionals group from the server
 * This ensures we use the server's version (from Vercel KV) instead of localStorage
 */
export async function getMedicalProfessionalsGroupFromServer(): Promise<{
  group: Group;
  root: bigint;
}> {
  try {
    console.log("[CLIENT] Fetching group from server...");
    
    // Add cache-busting parameter and disable browser cache
    const timestamp = Date.now();
    const response = await fetch(`/api/get-group?t=${timestamp}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to get group from server");
    }
    
    console.log("[CLIENT] Received group from server:", {
      memberCount: data.memberCount,
      root: data.root,
    });
    
    // Convert string members back to BigInt
    const members = data.members.map((m: string) => BigInt(m));
    const group = new Group(members);
    const root = BigInt(data.root);
    
    return { group, root };
  } catch (error) {
    console.error("[CLIENT] Failed to fetch group from server:", error);
    throw error;
  }
}

