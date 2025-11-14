"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Alert,
  Collapse,
} from "@mui/material";
import BugReportIcon from "@mui/icons-material/BugReport";
import { useSemaphore } from "@/hooks/useSemaphore";
import {
  getAllLinkedCertificates,
  isCommitmentLinked,
} from "@/lib/certificateRegistry";
import { getMedicalProfessionalsGroupFromServer } from "@/lib/groupManager";

export function DebugInfo() {
  const { identityCommitment } = useSemaphore();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const gatherDebugInfo = async () => {
    setIsLoading(true);
    try {
      // Get local data
      const localCertificates = getAllLinkedCertificates();
      const isCurrentIdentityLinked = identityCommitment
        ? isCommitmentLinked(identityCommitment)
        : false;

      // Get server data
      const { group, root } = await getMedicalProfessionalsGroupFromServer();
      const serverMembers = group.members.map((m) => m.toString());

      // Check if current identity is in server group
      const isInServerGroup = identityCommitment
        ? serverMembers.includes(identityCommitment)
        : false;

      const info = {
        currentIdentity: {
          commitment: identityCommitment,
          isLinkedLocally: isCurrentIdentityLinked,
          isInServerGroup: isInServerGroup,
        },
        localStorage: {
          certificateCount: localCertificates.length,
          certificates: localCertificates.map((cert) => ({
            number: cert.certificate_number,
            name: `${cert.first_name} ${cert.last_name}`,
            commitment: cert.commitment,
            linkedAt: cert.linkedAt,
          })),
          commitments: localCertificates.map((cert) => cert.commitment),
        },
        serverGroup: {
          memberCount: serverMembers.length,
          root: root.toString(),
          members: serverMembers,
        },
        comparison: {
          localCommitmentsInServer: localCertificates
            .map((cert) => cert.commitment)
            .filter((c) => serverMembers.includes(c)).length,
          currentIdentityMatch:
            identityCommitment && isInServerGroup ? "✅ Match" : "❌ Mismatch",
        },
      };

      setDebugInfo(info);
    } catch (error) {
      console.error("Failed to gather debug info:", error);
      setDebugInfo({
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper
      sx={{
        p: 2,
        background: "rgba(255, 200, 0, 0.05)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 200, 0, 0.3)",
      }}
    >
      <Button
        variant="outlined"
        size="small"
        startIcon={<BugReportIcon />}
        onClick={() => {
          setShowDebug(!showDebug);
          if (!showDebug && !debugInfo) {
            gatherDebugInfo();
          }
        }}
        disabled={isLoading}
        color="warning"
      >
        {isLoading
          ? "Loading..."
          : showDebug
          ? "Hide Debug Info"
          : "Show Debug Info"}
      </Button>

      <Collapse in={showDebug}>
        {debugInfo && (
          <Box sx={{ mt: 2 }}>
            {debugInfo.error ? (
              <Alert severity="error">
                <strong>Error:</strong> {debugInfo.error}
              </Alert>
            ) : (
              <Stack spacing={2}>
                {/* Current Identity Status */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="warning.main"
                    gutterBottom
                  >
                    Current Identity Status
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "rgba(0, 0, 0, 0.3)",
                      borderRadius: 1,
                      fontFamily: "monospace",
                      fontSize: "0.85rem",
                    }}
                  >
                    <div>
                      <strong>Commitment:</strong>{" "}
                      {debugInfo.currentIdentity.commitment?.slice(0, 20)}...
                    </div>
                    <div>
                      <strong>Linked Locally:</strong>{" "}
                      {debugInfo.currentIdentity.isLinkedLocally
                        ? "✅ Yes"
                        : "❌ No"}
                    </div>
                    <div>
                      <strong>In Server Group:</strong>{" "}
                      {debugInfo.currentIdentity.isInServerGroup
                        ? "✅ Yes"
                        : "❌ No"}
                    </div>
                  </Box>
                </Box>

                {/* Local Storage */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="warning.main"
                    gutterBottom
                  >
                    Local Storage ({debugInfo.localStorage.certificateCount}{" "}
                    certificates)
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "rgba(0, 0, 0, 0.3)",
                      borderRadius: 1,
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      maxHeight: 200,
                      overflow: "auto",
                    }}
                  >
                    {debugInfo.localStorage.certificates.map((cert: any) => (
                      <div key={cert.number} style={{ marginBottom: 8 }}>
                        <div>
                          <strong>{cert.number}</strong> - {cert.name}
                        </div>
                        <div style={{ paddingLeft: 16, color: "#888" }}>
                          {cert.commitment.slice(0, 20)}...
                        </div>
                      </div>
                    ))}
                  </Box>
                </Box>

                {/* Server Group */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="warning.main"
                    gutterBottom
                  >
                    Server Group ({debugInfo.serverGroup.memberCount} members)
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "rgba(0, 0, 0, 0.3)",
                      borderRadius: 1,
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      maxHeight: 200,
                      overflow: "auto",
                    }}
                  >
                    <div>
                      <strong>Root:</strong>{" "}
                      {debugInfo.serverGroup.root.slice(0, 30)}
                      ...
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <strong>Members:</strong>
                    </div>
                    {debugInfo.serverGroup.members.map((member: string) => (
                      <div
                        key={member}
                        style={{ paddingLeft: 16, color: "#888" }}
                      >
                        {member.slice(0, 20)}...
                        {member === debugInfo.currentIdentity.commitment && (
                          <span style={{ color: "#4caf50", marginLeft: 8 }}>
                            ← YOUR IDENTITY
                          </span>
                        )}
                      </div>
                    ))}
                  </Box>
                </Box>

                {/* Comparison */}
                <Alert
                  severity={
                    debugInfo.currentIdentity.isInServerGroup
                      ? "success"
                      : "error"
                  }
                >
                  <strong>Status:</strong>{" "}
                  {debugInfo.comparison.currentIdentityMatch}
                  <br />
                  {!debugInfo.currentIdentity.isInServerGroup && (
                    <>
                      <br />
                      <strong>Issue:</strong> Your current Semaphore identity
                      commitment is not in the server group. This typically
                      happens when:
                      <ul style={{ marginTop: 8, marginBottom: 0 }}>
                        <li>
                          You clicked "Generate New Identity" after linking
                          certificates
                        </li>
                        <li>Your browser's localStorage was cleared</li>
                        <li>You're using a different wallet/account</li>
                      </ul>
                      <br />
                      <strong>Solution:</strong> Go to the "Certificate
                      Registration" tab and re-link your certificate with your
                      current identity.
                    </>
                  )}
                </Alert>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={gatherDebugInfo}
                  color="warning"
                >
                  Refresh Debug Info
                </Button>
              </Stack>
            )}
          </Box>
        )}
      </Collapse>
    </Paper>
  );
}
