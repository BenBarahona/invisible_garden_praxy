"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import type { SemaphoreProof } from "@semaphore-protocol/proof";
import {
  getOrCreateIdentity,
  generateMembershipProof,
  getIdentityCommitment,
} from "@/lib/semaphore";
import { getMedicalProfessionalsGroup } from "@/lib/groupManager";
import {
  verifyProofWithAPI,
  VerificationResponse,
  extractPublicSignals,
} from "@/lib/proofVerification";
import { setVerificationSession } from "@/lib/verificationSession";
import { syncCertificatesToServer } from "@/lib/certificateRegistry";

interface ProofVerificationProps {
  message?: string;
  scope?: string;
  onVerified?: (data: VerificationResponse) => void;
  onError?: (error: string) => void;
  redirectOnSuccess?: string;
  autoRedirect?: boolean;
}

export function ProofVerification({
  message = "Verify medical professional credentials",
  scope = `verification-${Date.now()}`,
  onVerified,
  onError,
  redirectOnSuccess = "/chat",
  autoRedirect = false,
}: ProofVerificationProps) {
  const router = useRouter();
  const { user, authenticated } = usePrivy();
  const [loading, setLoading] = useState(false);
  const [proof, setProof] = useState<SemaphoreProof | null>(null);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateProof = async () => {
    if (!authenticated || !user) {
      const errMsg = "Please log in first";
      setError(errMsg);
      onError?.(errMsg);
      return;
    }

    setLoading(true);
    setError(null);
    setProof(null);
    setVerificationResult(null);

    try {
      // Step 0: Sync certificates to server (so server can verify the proof)
      console.log("Syncing certificates to server...");
      await syncCertificatesToServer();

      // Step 1: Get or create user's Semaphore identity
      const identity = getOrCreateIdentity(user.id);
      const commitment = getIdentityCommitment(identity);
      console.log("Identity Commitment:", commitment.toString());

      // Step 2: Get the approved medical professionals group
      let group;
      let groupRoot;
      try {
        const groupData = await getMedicalProfessionalsGroup();
        group = groupData.group;
        groupRoot = groupData.root;
        console.log("Group Root:", groupRoot.toString());
        console.log("Group Members:", groupData.group.members.length);
      } catch (err) {
        console.error("Failed to get group:", err);
        const errMsg =
          "⚠️ No linked certificates found. Please complete the steps above:\n\n" +
          "1. Register your certificate with your name and certificate number\n" +
          "2. Link your Semaphore identity commitment\n" +
          "3. Then generate your zero-knowledge proof\n\n" +
          "Scroll up to complete these steps first!";
        setError(errMsg);
        onError?.(errMsg);
        setLoading(false);
        return;
      }

      // Step 3: Check if user's commitment is in the group
      const userCommitment = commitment.toString();
      const groupMembers = group.members.map((m) => m.toString());

      if (!groupMembers.includes(userCommitment)) {
        const errMsg =
          "⚠️ Your Semaphore identity is not in the approved group.\n\n" +
          "This means you haven't linked your certificate to your identity yet.\n\n" +
          "Please scroll up and complete the 'Certificate Registration' section to link your certificate!";
        setError(errMsg);
        onError?.(errMsg);
        setLoading(false);
        return;
      }

      // Step 4: Generate the zero-knowledge proof
      console.log("Generating proof...");
      console.log("User commitment is in group ✓");
      const generatedProof = await generateMembershipProof(
        identity,
        group,
        message,
        scope
      );

      console.log("Proof generated successfully:", generatedProof);
      setProof(generatedProof);
    } catch (err) {
      console.error("Failed to generate proof:", err);
      const errMsg =
        err instanceof Error ? err.message : "Failed to generate proof";
      setError(errMsg);
      onError?.(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyProof = async () => {
    if (!proof) {
      setError("No proof to verify. Generate a proof first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Sync certificates to server before verifying
      console.log("Syncing certificates to server...");
      await syncCertificatesToServer();

      console.log("Verifying proof...");
      console.log("Proof scope:", extractPublicSignals(proof).scope);
      console.log("Proof nullifier:", extractPublicSignals(proof).nullifier);

      const result = await verifyProofWithAPI(
        proof,
        extractPublicSignals(proof).scope
      );

      console.log("Verification result:", result);
      setVerificationResult(result);

      if (result.verified && result.data) {
        // Store verification session
        setVerificationSession({
          nullifier: result.data.nullifier,
          groupRoot: result.data.groupRoot,
          verifiedAt: result.data.verifiedAt,
        });

        // Call onVerified callback
        onVerified?.(result);

        // Auto-redirect if enabled
        if (autoRedirect) {
          // Check for stored redirect URL
          const storedRedirect = sessionStorage.getItem(
            "verification_redirect"
          );
          const targetRoute = storedRedirect || redirectOnSuccess;

          // Clear stored redirect
          sessionStorage.removeItem("verification_redirect");

          // Redirect after a short delay to show success message
          setTimeout(() => {
            router.push(targetRoute);
          }, 1500);
        }
      } else {
        let errMsg = result.message || result.error || "Verification failed";

        // Add details if available
        if (result.details) {
          errMsg += `\n\nDebug Info:\n${JSON.stringify(
            result.details,
            null,
            2
          )}`;
        }

        console.error("Verification failed:", result);
        setError(errMsg);
        onError?.(errMsg);
      }
    } catch (err) {
      console.error("Verification error:", err);
      const errMsg =
        err instanceof Error ? err.message : "Failed to verify proof";
      setError(errMsg);
      onError?.(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAndVerify = async () => {
    await handleGenerateProof();
    // Wait a bit for state to update
    setTimeout(async () => {
      if (proof) {
        await handleVerifyProof();
      }
    }, 100);
  };

  if (!authenticated) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg">
        <p className="text-gray-700">
          Please log in to verify your credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Zero-Knowledge Proof Verification
        </h2>
        <p className="text-gray-600">
          Prove you&apos;re an approved medical professional without revealing
          your identity.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleGenerateProof}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading && !proof ? "Generating Proof..." : "Generate Proof"}
        </button>

        {proof && (
          <button
            onClick={handleVerifyProof}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Verifying..." : "Verify Proof"}
          </button>
        )}

        <button
          onClick={handleGenerateAndVerify}
          disabled={loading}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Processing..." : "Generate & Verify"}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-700">
              {!proof
                ? "Generating zero-knowledge proof..."
                : "Verifying proof..."}
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">
                {error.includes("No linked certificates") ||
                error.includes("not in the approved group")
                  ? "Action Required"
                  : "Verification Failed"}
              </h3>
              <div className="text-red-700 mt-1 whitespace-pre-line">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proof Generated Success */}
      {proof && !verificationResult && !error && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">Proof Generated</h3>
              <p className="text-green-700 mt-1">
                Your zero-knowledge proof has been created. Click &quot;Verify
                Proof&quot; to validate it.
              </p>

              {/* Proof Details */}
              <div className="mt-3 p-3 bg-white rounded border border-green-200">
                <p className="text-sm font-mono text-gray-700 break-all">
                  <span className="font-semibold">Nullifier:</span>{" "}
                  {extractPublicSignals(proof).nullifier.slice(0, 20)}...
                </p>
                <p className="text-sm font-mono text-gray-700 break-all mt-1">
                  <span className="font-semibold">Scope:</span>{" "}
                  {extractPublicSignals(proof).scope.slice(0, 20)}...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Result */}
      {verificationResult && (
        <div
          className={`p-4 border rounded-lg ${
            verificationResult.verified
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`text-xl ${
                verificationResult.verified ? "text-green-600" : "text-red-600"
              }`}
            >
              {verificationResult.verified ? "✓" : "✗"}
            </span>
            <div className="flex-1">
              <h3
                className={`font-semibold ${
                  verificationResult.verified
                    ? "text-green-900"
                    : "text-red-900"
                }`}
              >
                {verificationResult.verified
                  ? "Verification Successful!"
                  : "Verification Failed"}
              </h3>
              <p
                className={`mt-1 ${
                  verificationResult.verified
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {verificationResult.message}
              </p>

              {/* Success Data */}
              {verificationResult.verified && verificationResult.data && (
                <div className="mt-3 space-y-3">
                  <div className="p-3 bg-white rounded border border-green-200">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Status:</span> ✓ Approved
                      Medical Professional
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-semibold">Verified At:</span>{" "}
                      {new Date(
                        verificationResult.data.verifiedAt
                      ).toLocaleString()}
                    </p>
                    <p className="text-sm font-mono text-gray-700 break-all mt-1">
                      <span className="font-semibold">Nullifier:</span>{" "}
                      {verificationResult.data.nullifier.slice(0, 20)}...
                    </p>
                    <p className="text-sm font-mono text-gray-700 break-all mt-1">
                      <span className="font-semibold">Group Root:</span>{" "}
                      {verificationResult.data.groupRoot.slice(0, 20)}...
                    </p>
                  </div>

                  {!autoRedirect && (
                    <button
                      onClick={() => router.push(redirectOnSuccess)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all font-semibold shadow-md"
                    >
                      Continue to Secure Chat →
                    </button>
                  )}

                  {autoRedirect && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded text-center">
                      <p className="text-sm text-blue-700 font-semibold">
                        Redirecting to {redirectOnSuccess}...
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-600 italic">
                    🔒 Your identity remains private. Only your group membership
                    was proven.
                  </p>
                </div>
              )}

              {/* Failure Details */}
              {!verificationResult.verified && verificationResult.details && (
                <div className="mt-3 p-3 bg-white rounded border border-red-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Provided Root:</span>{" "}
                    {verificationResult.details.providedRoot.slice(0, 20)}...
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-semibold">Expected Root:</span>{" "}
                    {verificationResult.details.expectedRoot.slice(0, 20)}...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">How it works:</h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
          <li>Your Semaphore identity is created (stored locally)</li>
          <li>A zero-knowledge proof is generated proving group membership</li>
          <li>The proof is verified without revealing your identity</li>
          <li>Access is granted while maintaining privacy</li>
        </ol>
      </div>
    </div>
  );
}
