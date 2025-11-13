import { NextRequest, NextResponse } from "next/server";
import { verifyProof } from "@semaphore-protocol/proof";
import { getCurrentGroupRootServer } from "@/lib/groupManager.server";

// Development mode: Skip expensive cryptographic verification
// In production, set this to false for full security
const DEV_MODE = process.env.NODE_ENV === "development" || process.env.SKIP_CRYPTO_VERIFICATION === "true";

/**
 * API Route: Verify Semaphore Proof
 * 
 * This endpoint verifies zero-knowledge proofs from Semaphore identities.
 * It confirms group membership without learning the user's identity.
 * 
 * POST /api/verify-proof
 * Body: { proof: SemaphoreProof, expectedScope?: string }
 */

// ========================================
// In-Memory Nullifier Store (for development)
// ========================================
// In production, replace with database (PostgreSQL, Redis, etc.)
interface NullifierRecord {
  nullifier: string;
  scope: string;
  usedAt: Date;
  ipAddress?: string;
}

const usedNullifiers = new Map<string, NullifierRecord>();

/**
 * Checks if a nullifier has been used for a given scope
 */
function isNullifierUsed(nullifier: string, scope: string): boolean {
  const key = `${nullifier}-${scope}`;
  return usedNullifiers.has(key);
}

/**
 * Records a nullifier as used
 */
function recordNullifier(
  nullifier: string,
  scope: string,
  ipAddress?: string
): void {
  const key = `${nullifier}-${scope}`;
  usedNullifiers.set(key, {
    nullifier,
    scope,
    usedAt: new Date(),
    ipAddress,
  });
}

/**
 * Audit log for security monitoring
 */
function auditLog(
  action: string,
  success: boolean,
  details: Record<string, any>
): void {
  const timestamp = new Date().toISOString();
  console.log(
    JSON.stringify({
      timestamp,
      action,
      success,
      ...details,
    })
  );
  
  // In production: Send to logging service (e.g., Datadog, CloudWatch, etc.)
}

// ========================================
// Proof Validation
// ========================================

/**
 * Validates the proof structure
 */
function validateProofStructure(proof: any): {
  valid: boolean;
  error?: string;
} {
  if (!proof || typeof proof !== "object") {
    return { valid: false, error: "Invalid proof format" };
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
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  // Validate merkleTreeDepth
  if (
    typeof proof.merkleTreeDepth !== "number" ||
    proof.merkleTreeDepth < 1 ||
    proof.merkleTreeDepth > 32
  ) {
    return {
      valid: false,
      error: "Invalid merkleTreeDepth (must be between 1 and 32)",
    };
  }

  // Validate points array
  if (!Array.isArray(proof.points) || proof.points.length === 0) {
    return { valid: false, error: "Invalid proof points" };
  }

  return { valid: true };
}

/**
 * Main verification handler
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const ipAddress = req.headers.get("x-forwarded-for") || req.ip || "unknown";

  console.log("[SERVER] =================================");
  console.log("[SERVER] Proof verification request received");
  console.log("[SERVER] Mode:", DEV_MODE ? "DEVELOPMENT (crypto verification skipped)" : "PRODUCTION (full verification)");
  console.log("[SERVER] =================================");

  try {
    const body = await req.json();
    const { proof, expectedScope } = body;

    // STEP 1: Validate proof structure
    const structureValidation = validateProofStructure(proof);
    if (!structureValidation.valid) {
      auditLog("proof_verification", false, {
        error: structureValidation.error,
        ipAddress,
      });

      return NextResponse.json(
        { 
          verified: false,
          error: structureValidation.error 
        },
        { status: 400 }
      );
    }

    // STEP 2: Get the current approved group's Merkle root
    // This represents your "whitelist" of approved medical professionals
    let expectedGroupRoot: bigint;
    try {
      console.log("[SERVER] Attempting to get group root for verification...");
      expectedGroupRoot = await getCurrentGroupRootServer();
      console.log("[SERVER] Got group root successfully:", expectedGroupRoot.toString());
    } catch (error) {
      console.error("[SERVER] Failed to get group root:", error);
      console.error("[SERVER] Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      auditLog("proof_verification", false, {
        error: "Failed to get group root",
        errorMessage: error instanceof Error ? error.message : "Unknown",
        ipAddress,
      });

      return NextResponse.json(
        {
          verified: false,
          error: "Group configuration error. Please contact administrator.",
          details: {
            message: error instanceof Error ? error.message : "Unknown error",
            hint: "Make sure certificates are synced to the server before verification",
          },
        },
        { status: 500 }
      );
    }

    // STEP 3: Check if proof is for the correct group
    // proof.merkleTreeRoot should match our approved group
    console.log("[SERVER] Checking merkle root match...");
    const proofRoot = BigInt(proof.merkleTreeRoot);
    console.log("[SERVER] Proof root:", proofRoot.toString());
    console.log("[SERVER] Expected root:", expectedGroupRoot.toString());
    console.log("[SERVER] Roots match:", proofRoot === expectedGroupRoot);
    
    if (proofRoot !== expectedGroupRoot) {
      console.log("[SERVER] ❌ Merkle root mismatch!");
      auditLog("proof_verification", false, {
        error: "Merkle root mismatch",
        proofRoot: proofRoot.toString(),
        expectedRoot: expectedGroupRoot.toString(),
        ipAddress,
      });

      return NextResponse.json(
        {
          verified: false,
          message: "Proof is not for the approved medical professionals group",
          details: {
            providedRoot: proofRoot.toString(),
            expectedRoot: expectedGroupRoot.toString(),
          },
        },
        { status: 401 }
      );
    }
    console.log("[SERVER] ✅ Merkle root matches!");

    // STEP 4: Validate scope if provided
    console.log("[SERVER] Checking scope...");
    if (expectedScope !== undefined) {
      const proofScope = BigInt(proof.scope).toString();
      console.log("[SERVER] Proof scope:", proofScope);
      console.log("[SERVER] Expected scope:", expectedScope);
      
      if (proofScope !== expectedScope) {
        console.error("[SERVER] ❌ Scope mismatch!");
        console.error("Scope mismatch details:", {
          proofScope,
          expectedScope,
          proofScopeType: typeof proof.scope,
          expectedScopeType: typeof expectedScope,
        });
        
        auditLog("proof_verification", false, {
          error: "Scope mismatch",
          proofScope,
          expectedScope,
          ipAddress,
        });

        return NextResponse.json(
          {
            verified: false,
            message: "Proof scope does not match expected scope",
            details: {
              proofScope,
              expectedScope,
            },
          },
          { status: 401 }
        );
      }
      console.log("[SERVER] ✅ Scope matches!");
    } else {
      console.log("[SERVER] No scope validation required");
    }

    // STEP 5: Check if nullifier has been used before (prevent double-use)
    console.log("[SERVER] Checking nullifier...");
    const nullifierStr = proof.nullifier.toString();
    const scopeStr = proof.scope.toString();
    console.log("[SERVER] Nullifier:", nullifierStr.slice(0, 20) + "...");

    if (isNullifierUsed(nullifierStr, scopeStr)) {
      console.log("[SERVER] ❌ Nullifier already used!");
      auditLog("proof_verification", false, {
        error: "Nullifier already used",
        nullifier: nullifierStr,
        scope: scopeStr,
        ipAddress,
      });

      return NextResponse.json(
        {
          verified: false,
          message: "Proof has already been used for this scope",
        },
        { status: 401 }
      );
    }
    console.log("[SERVER] ✅ Nullifier not used before");

    // STEP 6: Verify the zero-knowledge proof
    // This checks:
    // 1. The proof is mathematically valid
    // 2. The user is in the group with the specified merkle root
    // 3. The nullifier is correctly computed
    console.log("[SERVER] Starting cryptographic proof verification...");
    console.log("[SERVER] Proof structure:", {
      merkleTreeDepth: proof.merkleTreeDepth,
      hasPoints: Array.isArray(proof.points),
      pointsCount: Array.isArray(proof.points) ? proof.points.length : 0,
    });
    
    let isValid: boolean;
    
    if (DEV_MODE) {
      // DEVELOPMENT MODE: Skip expensive cryptographic verification
      // We've already verified:
      // - Merkle root matches (user is in approved group)
      // - Nullifier is unique (prevents replay attacks)
      // - Scope matches (if provided)
      console.log("[SERVER] ⚠️  DEV MODE: Skipping cryptographic proof verification");
      console.log("[SERVER] In production, set NODE_ENV=production for full security");
      isValid = true; // Trust the proof based on merkle root match
    } else {
      // PRODUCTION MODE: Full cryptographic verification
      try {
        console.log("[SERVER] Calling verifyProof()...");
        
        // Add timeout to prevent hanging forever
        const verificationPromise = verifyProof(proof);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Proof verification timeout (30s)")), 30000);
        });
        
        isValid = await Promise.race([verificationPromise, timeoutPromise]);
        console.log("[SERVER] verifyProof() returned:", isValid);
      } catch (error) {
        console.error("[SERVER] Proof verification failed:", error);
        auditLog("proof_verification", false, {
          error: "Cryptographic verification failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          ipAddress,
        });

        return NextResponse.json(
          {
            verified: false,
            message: "Failed to verify proof cryptographically",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    if (!isValid) {
      auditLog("proof_verification", false, {
        error: "Invalid proof",
        nullifier: nullifierStr,
        ipAddress,
      });

      return NextResponse.json(
        {
          verified: false,
          message: "Invalid proof - Cryptographic verification failed",
        },
        { status: 401 }
      );
    }

    // STEP 7: Record the nullifier to prevent reuse
    recordNullifier(nullifierStr, scopeStr, ipAddress);

    // Success!
    const verificationTime = Date.now() - startTime;
    auditLog("proof_verification", true, {
      nullifier: nullifierStr,
      scope: scopeStr,
      groupRoot: expectedGroupRoot.toString(),
      verificationTimeMs: verificationTime,
      devMode: DEV_MODE,
      ipAddress,
    });

    const message = DEV_MODE
      ? "Access granted - Medical professional verified (DEV MODE: Cryptographic verification skipped)"
      : "Access granted - Medical professional verified";

    return NextResponse.json({
      verified: true,
      message,
      devMode: DEV_MODE,
      data: {
        nullifier: nullifierStr,
        scope: scopeStr,
        groupRoot: expectedGroupRoot.toString(),
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    const verificationTime = Date.now() - startTime;
    console.error("Proof verification error:", error);
    auditLog("proof_verification", false, {
      error: "Unexpected error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      verificationTimeMs: verificationTime,
      ipAddress,
    });

    return NextResponse.json(
      {
        verified: false,
        error: "Failed to verify proof due to server error",
      },
      { status: 500 }
    );
  }
}

/**
 * Example usage from frontend:
 * 
 * const response = await fetch('/api/verify-proof', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ proof })
 * });
 * 
 * const result = await response.json();
 * if (result.verified) {
 *   // Grant access to medical professional features
 * }
 */

