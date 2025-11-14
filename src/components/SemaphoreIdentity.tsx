"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Collapse,
} from "@mui/material";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import SecurityIcon from "@mui/icons-material/Security";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { useSemaphore } from "@/hooks/useSemaphore";
import { generateMembershipProof } from "@/lib/semaphore";
import { getMedicalProfessionalsGroup } from "@/lib/groupManager";
import { syncCertificatesToServer } from "@/lib/certificateRegistry";
import { setVerificationSession } from "@/lib/verificationSession";

export function SemaphoreIdentity() {
  const router = useRouter();
  const { identity, identityCommitment, isLoading, resetIdentity } =
    useSemaphore();
  const [showProofGenerator, setShowProofGenerator] = useState(false);
  const [message, setMessage] = useState("");
  const [proof, setProof] = useState<any>(null);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatCommitment = (commitment: string) => {
    if (commitment.length <= 20) return commitment;
    return `${commitment.slice(0, 10)}...${commitment.slice(-10)}`;
  };

  const handleGenerateProof = async () => {
    if (!identity || !message) return;

    setIsGeneratingProof(true);
    setError(null);
    setProof(null);
    setVerificationResult(null);

    try {
      // STEP 0: Sync certificates to server (so server can verify the proof later)
      console.log(
        "[SYNC] Syncing certificates to server before proof generation..."
      );
      await syncCertificatesToServer();

      // STEP 1: Get the approved medical professionals group
      // This group represents your "whitelist"
      const { group: medicalGroup } = await getMedicalProfessionalsGroup();

      // STEP 2: Check if user is in the group (optional check)
      // Note: This doesn't reveal identity, just checks if they CAN generate a proof
      const isInGroup = medicalGroup.members.includes(identity.commitment);

      if (!isInGroup) {
        setError(
          "You are not in the approved medical professionals group. Please contact an administrator."
        );
        return;
      }

      // STEP 3: Generate zero-knowledge proof
      // This proves: "I'm in the approved group"
      // Without revealing: "I'm specifically Dr. Smith"
      const generatedProof = await generateMembershipProof(
        identity,
        medicalGroup,
        message,
        "medical-professionals" // scope/external nullifier
      );

      setProof(generatedProof);
    } catch (err: any) {
      console.error("Proof generation error:", err);

      if (err.message?.includes("No approved medical professionals")) {
        setError(
          "No approved medical professionals found. Please add members to the group first."
        );
      } else {
        setError("Failed to generate proof. Please try again.");
      }
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const handleVerifyProof = async () => {
    if (!proof) return;

    setIsVerifying(true);
    setVerificationResult(null);
    setError(null);

    try {
      // Sync certificates to server before verifying
      console.log(
        "[SYNC] Syncing certificates to server before verification..."
      );
      await syncCertificatesToServer();

      const response = await fetch("/api/verify-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof }),
      });

      const result = await response.json();

      console.log("[VERIFY] Server response:", result);

      if (response.ok && result.verified) {
        let message = result.message;

        // Show warning if dev mode is active
        if (result.devMode) {
          message +=
            "\n\n⚠️ Development Mode Active: Full cryptographic verification was skipped.";
        }

        setVerificationResult({
          verified: true,
          message,
        });

        // Store verification session for protected routes
        if (result.data) {
          setVerificationSession({
            nullifier: result.data.nullifier,
            groupRoot: result.data.groupRoot,
            verifiedAt: result.data.verifiedAt,
          });

          console.log("[VERIFY] ✅ Verification session stored");
        }

        // Redirect to chat after a short delay to show success message
        console.log("[VERIFY] Redirecting to /chat in 2 seconds...");
        setTimeout(() => {
          router.push("/chat");
        }, 2000);
      } else {
        let errorMessage =
          result.message || result.error || "Proof verification failed";

        // Add details if available
        if (result.details) {
          errorMessage += `\n\nDetails: ${JSON.stringify(
            result.details,
            null,
            2
          )}`;
        }

        setVerificationResult({
          verified: false,
          message: errorMessage,
        });
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError("Failed to verify proof. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleGenerateZKProofClick = async () => {
    if (!showProofGenerator) {
      // Show the proof generator and auto-generate proof
      setShowProofGenerator(true);

      // Generate timestamp-based signal
      const timestamp = Date.now();
      const autoSignal = `access_chat_${timestamp}`;
      setMessage(autoSignal);

      // Wait a tick for state to update, then trigger proof generation
      setTimeout(async () => {
        if (identity) {
          setIsGeneratingProof(true);
          setError(null);
          setProof(null);
          setVerificationResult(null);

          try {
            // STEP 0: Sync certificates to server
            console.log(
              "[SYNC] Syncing certificates to server before proof generation..."
            );
            await syncCertificatesToServer();

            // STEP 1: Get the approved medical professionals group
            const { group: medicalGroup } =
              await getMedicalProfessionalsGroup();

            // STEP 2: Check if user is in the group
            const isInGroup = medicalGroup.members.includes(
              identity.commitment
            );

            if (!isInGroup) {
              setError(
                "You are not in the approved medical professionals group. Please contact an administrator."
              );
              return;
            }

            // STEP 3: Generate zero-knowledge proof
            const generatedProof = await generateMembershipProof(
              identity,
              medicalGroup,
              autoSignal,
              "medical-professionals"
            );

            setProof(generatedProof);
          } catch (err: any) {
            console.error("Proof generation error:", err);

            if (err.message?.includes("No approved medical professionals")) {
              setError(
                "No approved medical professionals found. Please add members to the group first."
              );
            } else {
              setError("Failed to generate proof. Please try again.");
            }
          } finally {
            setIsGeneratingProof(false);
          }
        }
      }, 100);
    } else {
      // Just hide the proof generator
      setShowProofGenerator(false);
    }
  };

  if (isLoading) {
    return (
      <Paper
        sx={{
          p: 3,
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          textAlign: "center",
        }}
      >
        <CircularProgress />
      </Paper>
    );
  }

  if (!identity) {
    return (
      <Paper
        sx={{
          p: 3,
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Alert severity="info">
          Please connect your wallet to create a Semaphore identity.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 3,
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <Stack spacing={3}>
        {/* Identity Section */}
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <FingerprintIcon color="primary" />
            <Typography variant="h6">Semaphore Identity</Typography>
            <Chip
              label="Active"
              color="success"
              size="small"
              icon={<VerifiedUserIcon />}
            />
          </Stack>

          <Box
            sx={{
              p: 2,
              bgcolor: "rgba(0, 0, 0, 0.2)",
              borderRadius: 1,
              mb: 2,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Identity Commitment:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "monospace",
                wordBreak: "break-all",
                cursor: "pointer",
              }}
              onClick={() => copyToClipboard(identityCommitment || "")}
              title="Click to copy"
            >
              {identityCommitment}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            size="small"
            onClick={resetIdentity}
            sx={{ mr: 2 }}
          >
            Generate New Identity
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<SecurityIcon />}
            onClick={handleGenerateZKProofClick}
            disabled={isGeneratingProof}
          >
            {isGeneratingProof ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Generating...
              </>
            ) : showProofGenerator ? (
              "Hide"
            ) : (
              "Generate ZK Proof"
            )}
          </Button>
        </Box>

        {/* Proof Generator Section */}
        <Collapse in={showProofGenerator}>
          <Box
            sx={{
              p: 2,
              bgcolor: "rgba(99, 102, 241, 0.1)",
              borderRadius: 1,
              border: "1px solid rgba(99, 102, 241, 0.3)",
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Generate Zero-Knowledge Proof
            </Typography>
            <Typography variant="caption" color="text.secondary" paragraph>
              Generate a proof that you&apos;re a verified medical professional
              without revealing your identity.
            </Typography>

            <TextField
              fullWidth
              label="Message/Signal"
              placeholder="e.g., I am authorized to access this resource"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              sx={{ mb: 2 }}
              size="small"
            />

            <Button
              variant="contained"
              onClick={handleGenerateProof}
              disabled={!message || isGeneratingProof}
              fullWidth
            >
              {isGeneratingProof ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Generating Proof...
                </>
              ) : (
                "Generate Proof"
              )}
            </Button>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {proof && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  ✅ Proof generated successfully!
                </Alert>

                {/* Verification Result */}
                {verificationResult && (
                  <Alert
                    severity={verificationResult.verified ? "success" : "error"}
                    sx={{ mb: 2 }}
                  >
                    <strong>
                      {verificationResult.verified
                        ? "✅ Verified!"
                        : "❌ Verification Failed"}
                    </strong>
                    <br />
                    <Box
                      component="pre"
                      sx={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontFamily: "inherit",
                        m: 0,
                        mt: 1,
                      }}
                    >
                      {verificationResult.message}
                    </Box>

                    {/* Redirect notification for successful verification */}
                    {verificationResult.verified && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          🎉 Redirecting to chat in 2 seconds...
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => router.push("/chat")}
                          fullWidth
                        >
                          Go to Chat Now →
                        </Button>
                      </Box>
                    )}
                  </Alert>
                )}

                {/* Proof JSON */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "rgba(0, 0, 0, 0.3)",
                    borderRadius: 1,
                    maxHeight: 200,
                    overflow: "auto",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
                  >
                    {JSON.stringify(proof, null, 2)}
                  </Typography>
                </Box>

                {/* Action Buttons */}
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleVerifyProof}
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        Verifying...
                      </>
                    ) : (
                      "Verify Proof"
                    )}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => copyToClipboard(JSON.stringify(proof))}
                  >
                    Copy Proof
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>
        </Collapse>

        {/* Info Section */}
        <Alert severity="info" icon={<SecurityIcon />}>
          <Typography variant="caption">
            <strong>Zero-Knowledge Privacy:</strong> Your Semaphore identity
            allows you to prove you&apos;re a verified medical professional
            without revealing who you are.
          </Typography>
        </Alert>
      </Stack>
    </Paper>
  );
}
