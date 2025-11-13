"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { usePrivy } from "@privy-io/react-auth";
import { useSemaphore } from "@/hooks/useSemaphore";
import {
  linkCertificateToCommitment,
  isCommitmentLinked,
  getCertificateByCommitment,
  syncCertificatesToServer,
} from "@/lib/certificateRegistry";
import { invalidateGroupCache } from "@/lib/groupManager";

export function CertificateRegistration() {
  const { authenticated } = usePrivy();
  const { identityCommitment, identity } = useSemaphore();

  const [certificateNumber, setCertificateNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });

  // Check if already linked
  const linkedCertificate =
    identityCommitment && isCommitmentLinked(identityCommitment)
      ? getCertificateByCommitment(identityCommitment)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identityCommitment || !identity) {
      setStatus({
        type: "error",
        message: "Please connect your wallet first.",
      });
      return;
    }

    if (!certificateNumber || !firstName || !lastName) {
      setStatus({
        type: "error",
        message: "Please fill in all fields.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: null, message: "" });

    try {
      // Verify certificate and link to commitment
      const result = linkCertificateToCommitment(
        certificateNumber.trim(),
        firstName.trim(),
        lastName.trim(),
        identityCommitment
      );

      if (result.success) {
        setStatus({
          type: "success",
          message: result.message,
        });

        invalidateGroupCache();

        // Sync to server so API routes can access the data
        await syncCertificatesToServer();

        setCertificateNumber("");
        setFirstName("");
        setLastName("");
      } else {
        setStatus({
          type: "error",
          message: result.message,
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setStatus({
        type: "error",
        message: "An error occurred during registration. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authenticated) {
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
          Please connect your wallet to register your certificate.
        </Alert>
      </Paper>
    );
  }

  // Already linked
  if (linkedCertificate) {
    return (
      <Paper
        sx={{
          p: 3,
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Stack spacing={2}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="h6">Certificate Verified</Typography>
          </Box>

          <Alert severity="success">
            <strong>Certificate Number:</strong>{" "}
            {linkedCertificate.certificate_number}
            <br />
            <strong>Name:</strong> {linkedCertificate.first_name}{" "}
            {linkedCertificate.last_name}
            <br />
            <strong>Wallet:</strong> Connected
          </Alert>

          <Typography variant="body2" color="text.secondary">
            You are verified and can now generate zero-knowledge proofs!
          </Typography>
        </Stack>
      </Paper>
    );
  }

  // Registration form
  return (
    <Paper
      sx={{
        p: 3,
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Register Medical Certificate
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter your certificate details to verify and link your Semaphore
        identity.
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Certificate Number"
            placeholder="e.g., MN-118951"
            value={certificateNumber}
            onChange={(e) => setCertificateNumber(e.target.value)}
            fullWidth
            required
            disabled={isSubmitting}
          />

          <TextField
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            fullWidth
            required
            disabled={isSubmitting}
          />

          <TextField
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            fullWidth
            required
            disabled={isSubmitting}
          />

          {status.type && (
            <Alert severity={status.type}>{status.message}</Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            fullWidth
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Verifying...
              </>
            ) : (
              "Verify & Link Certificate"
            )}
          </Button>
        </Stack>
      </form>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="caption">
          <strong>Note:</strong> Your certificate will be automatically verified
          against our approved list. If found, your Semaphore identity will be
          linked immediately.
        </Typography>
      </Alert>
    </Paper>
  );
}
