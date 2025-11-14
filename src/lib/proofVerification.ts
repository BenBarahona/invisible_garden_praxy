"use client";

/**
 * Proof Verification Utilities
 * 
 * This file contains helper functions for working with Semaphore proofs
 * and verification results on the client side.
 */

import type { SemaphoreProof } from "@semaphore-protocol/proof";

/**
 * Response type from the verify-proof API endpoint
 */
export interface VerificationResponse {
  verified: boolean;
  message?: string;
  error?: string;
  data?: {
    nullifier: string;
    scope: string;
    groupRoot: string;
    verifiedAt: string;
  };
  details?: {
    providedRoot: string;
    expectedRoot: string;
  };
}

/**
 * Verifies a proof by calling the backend API
 * 
 * @param proof - The Semaphore proof to verify
 * @param expectedScope - Optional scope to validate against
 * @returns Verification result
 */
export async function verifyProofWithAPI(
  proof: SemaphoreProof,
  expectedScope?: string
): Promise<VerificationResponse> {
  try {
    const response = await fetch("/api/verify-proof", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        proof,
        expectedScope,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to verify proof:", error);
    return {
      verified: false,
      error: "Failed to communicate with verification server",
    };
  }
}

/**
 * Formats a bigint value for display
 */
export function formatBigInt(value: bigint | string, maxLength: number = 8): string {
  const str = value.toString();
  if (str.length <= maxLength * 2) return str;
  return `${str.slice(0, maxLength)}...${str.slice(-maxLength)}`;
}

/**
 * Validates proof structure on the client side (basic checks)
 * This doesn't verify cryptographic validity - just structure
 */
export function validateProofStructure(proof: any): {
  valid: boolean;
  error?: string;
} {
  if (!proof || typeof proof !== "object") {
    return { valid: false, error: "Proof must be an object" };
  }

  const requiredFields = [
    "merkleTreeDepth",
    "merkleTreeRoot",
    "nullifier",
    "message",
    "scope",
    "points",
  ];

  for (const field of requiredFields) {
    if (!(field in proof)) {
      return { valid: false, error: `Missing field: ${field}` };
    }
  }

  return { valid: true };
}

/**
 * Converts a Semaphore proof to a format suitable for on-chain verification
 * Based on the Verifier.sol contract structure
 */
export function formatProofForContract(proof: SemaphoreProof): {
  pA: [bigint, bigint];
  pB: [[bigint, bigint], [bigint, bigint]];
  pC: [bigint, bigint];
  pubSignals: bigint[];
} {
  // Extract proof points (this depends on your specific proof structure)
  // Semaphore proofs use a specific encoding that maps to Groth16 parameters
  const points = proof.points.map((p) => BigInt(p));

  // Convert proof fields to bigint (they may be strings or bigints)
  const toBigInt = (value: any): bigint => {
    return typeof value === "bigint" ? value : BigInt(value);
  };

  // This is a simplified version - you may need to adjust based on your exact proof format
  return {
    pA: [points[0], points[1]],
    pB: [
      [points[2], points[3]],
      [points[4], points[5]],
    ],
    pC: [points[6], points[7]],
    pubSignals: [
      toBigInt(proof.merkleTreeRoot),
      toBigInt(proof.nullifier),
      toBigInt(proof.message),
      toBigInt(proof.scope),
    ],
  };
}

/**
 * Extracts public signals from a proof for validation
 */
export function extractPublicSignals(proof: SemaphoreProof): {
  merkleTreeRoot: string;
  nullifier: string;
  message: string;
  scope: string;
} {
  return {
    merkleTreeRoot: proof.merkleTreeRoot.toString(),
    nullifier: proof.nullifier.toString(),
    message: proof.message.toString(),
    scope: proof.scope.toString(),
  };
}

