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

/**
 * Cache to avoid rebuilding Merkle tree on every request
 */
interface CachedGroup {
  root: bigint;
  members: bigint[];
  lastUpdated: number;
}

let cachedMedicalGroup: CachedGroup | null = null;

/**
 * Gets the current medical professionals group with caching
 * Rebuilds only if cache is expired or invalidated
 */
export async function getMedicalProfessionalsGroup(): Promise<{
  group: Group;
  root: bigint;
}> {
  const CACHE_DURATION = 5 * 60 * 1000;
  const now = Date.now();
  
  if (
    cachedMedicalGroup &&
    now - cachedMedicalGroup.lastUpdated < CACHE_DURATION
  ) {
    const group = new Group(cachedMedicalGroup.members);
    return { group, root: cachedMedicalGroup.root };
  }
  
  const commitments = getAllApprovedCommitments();
  
  if (commitments.length === 0) {
    throw new Error("No linked certificates yet.");
  }
  
  const group = new Group(commitments);
  
  cachedMedicalGroup = {
    root: group.root,
    members: commitments,
    lastUpdated: now,
  };
  
  return { group, root: group.root };
}

/**
 * Invalidates the cache (call when someone links a certificate)
 */
export function invalidateGroupCache(): void {
  cachedMedicalGroup = null;
}

/**
 * Gets the current Merkle root of the medical professionals group
 * This is what you use for verification!
 */
export async function getCurrentGroupRoot(): Promise<bigint> {
  const { root } = await getMedicalProfessionalsGroup();
  return root;
}

