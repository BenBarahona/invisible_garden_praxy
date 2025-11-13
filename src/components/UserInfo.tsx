"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Box, Typography, Paper } from "@mui/material";

export function UserInfo() {
  const { user, authenticated } = usePrivy();

  if (!authenticated || !user) {
    return null;
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
      <Typography variant="h6" gutterBottom>
        User Information
      </Typography>

      {user.email && (
        <Typography variant="body2" color="text.secondary">
          📧 Email: {user.email.address}
        </Typography>
      )}

      {user.wallet && (
        <Typography variant="body2" color="text.secondary">
          💼 Wallet: {user.wallet.address}
        </Typography>
      )}

      {user.google && (
        <Typography variant="body2" color="text.secondary">
          🔑 Google: {user.google.email}
        </Typography>
      )}

      {user.twitter && (
        <Typography variant="body2" color="text.secondary">
          🐦 Twitter: {user.twitter.username}
        </Typography>
      )}

      {user.discord && (
        <Typography variant="body2" color="text.secondary">
          💬 Discord: {user.discord.username}
        </Typography>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Linked Accounts: {user.linkedAccounts?.length || 0}
        </Typography>
      </Box>
    </Paper>
  );
}
