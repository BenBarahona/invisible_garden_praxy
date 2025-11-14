"use client";

import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof } from "@semaphore-protocol/proof";

/**
 * Converts a string to a BigInt for use in Semaphore proofs
 * Uses a simple hash function to create a numeric value
 */
function stringToBigInt(str: string): bigint {
  // Use browser's crypto API to hash the string
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  
  // Create a simple hash by summing character codes
  // For production, you might want to use a proper hash function
  let hash = 0n;
  for (let i = 0; i < data.length; i++) {
    hash = (hash * 31n + BigInt(data[i])) % (2n ** 256n);
  }
  
  return hash;
}

/**
 * Creates or retrieves a Semaphore identity for the user
 * The identity is stored in localStorage for persistence
 */
export function getOrCreateIdentity(userId: string): Identity {
  const storageKey = `semaphore-identity-${userId}`;
  
  // Try to retrieve existing identity
  const storedIdentity = localStorage.getItem(storageKey);
  
  if (storedIdentity) {
    try {
      // Restore identity from stored commitment
      return new Identity(storedIdentity);
    } catch (error) {
      console.error("Failed to restore identity:", error);
    }
  }
  
  // Create new identity
  const identity = new Identity();
  
  // Store identity commitment for future use
  localStorage.setItem(storageKey, identity.toString());
  
  return identity;
}

/**
 * Clears the stored Semaphore identity
 */
export function clearIdentity(userId: string): void {
  const storageKey = `semaphore-identity-${userId}`;
  localStorage.removeItem(storageKey);
}

/**
 * Creates a Semaphore group from a list of identity commitments
 */
export function createGroup(members: bigint[]): Group {
  return new Group(members);
}

/**
 * Generates a zero-knowledge proof of group membership
 * @param identity - User's Semaphore identity
 * @param group - The Semaphore group
 * @param message - The message/signal to prove (string will be converted to BigInt)
 * @param scope - External nullifier to prevent double-signaling (string will be converted to BigInt)
 */
export async function generateMembershipProof(
  identity: Identity,
  group: Group,
  message: string,
  scope: string
) {
  try {
    // Convert string parameters to BigInt for Semaphore
    const messageBigInt = stringToBigInt(message);
    const scopeBigInt = stringToBigInt(scope);
    
    console.log("Generating proof with:");
    console.log("- Message:", message, "→", messageBigInt.toString());
    console.log("- Scope:", scope, "→", scopeBigInt.toString());
    
    const proof = await generateProof(identity, group, messageBigInt, scopeBigInt);
    return proof;
  } catch (error) {
    console.error("Failed to generate proof:", error);
    throw error;
  }
}

/**
 * Verifies a Semaphore proof (to be called on backend)
 * For frontend reference only - actual verification should happen server-side
 */
export interface SemaphoreProof {
  merkleTreeDepth: number;
  merkleTreeRoot: bigint;
  nullifier: bigint;
  message: bigint;
  scope: bigint;
  points: bigint[];
}

/**
 * Get identity commitment (public identifier)
 */
export function getIdentityCommitment(identity: Identity): bigint {
  return identity.commitment;
}

