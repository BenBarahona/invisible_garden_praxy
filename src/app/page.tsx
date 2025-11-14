"use client";

import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
} from "@mui/material";
import { motion } from "framer-motion";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SecurityIcon from "@mui/icons-material/Security";
import LogoutIcon from "@mui/icons-material/Logout";
import { usePrivy } from "@privy-io/react-auth";
import { SemaphoreIdentity } from "@/components/SemaphoreIdentity";
import { CertificateRegistration } from "@/components/CertificateRegistration";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

export default function Home() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  const walletAddress = user?.wallet?.address;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
        py: 8,
      }}
    >
      <Container maxWidth="lg">
        {/* Hero Section */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          sx={{ textAlign: "center", mb: 8 }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "2.5rem", md: "4rem" },
              fontWeight: 700,
              background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 2,
            }}
          >
            Praxy
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: "800px", mx: "auto" }}
          >
            AI Assistant for authorized medical professionals
          </Typography>

          {/* Wallet Connection Section */}
          {!ready ? (
            <Button
              variant="contained"
              size="large"
              disabled
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
              }}
            >
              Loading...
            </Button>
          ) : authenticated ? (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ justifyContent: "center", alignItems: "center" }}
            >
              <Chip
                icon={<AccountBalanceWalletIcon />}
                label={
                  walletAddress
                    ? formatAddress(walletAddress)
                    : user?.email?.address || "Connected"
                }
                color="primary"
                sx={{ px: 2, py: 3, fontSize: "1rem" }}
              />
              <Button
                variant="outlined"
                size="large"
                startIcon={<LogoutIcon />}
                onClick={logout}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: "1rem",
                }}
              >
                Logout
              </Button>
            </Stack>
          ) : (
            <Button
              variant="contained"
              size="large"
              startIcon={<AccountBalanceWalletIcon />}
              onClick={login}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
              }}
            >
              Connect Wallet
            </Button>
          )}
        </MotionBox>

        {/* Certificate Registration - Only show when authenticated */}
        {authenticated && (
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            sx={{ mb: 4 }}
          >
            <CertificateRegistration />
          </MotionBox>
        )}

        {/* Semaphore Identity Section - Only show when authenticated */}
        {authenticated && (
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            sx={{ mb: 8 }}
          >
            <SemaphoreIdentity />
          </MotionBox>
        )}

        {/* Features Section */}
        <Grid container spacing={4}>
          {[
            {
              icon: <RocketLaunchIcon sx={{ fontSize: 48 }} />,
              title: "AI Powered",
              description:
                "AI powered chatbot, powered by medical literature and medical director expertise",
            },
            {
              icon: <SecurityIcon sx={{ fontSize: 48 }} />,
              title: "Secure",
              description:
                "ZK powered authentication for authorized medical professionals",
            },
            {
              icon: <AccountBalanceWalletIcon sx={{ fontSize: 48 }} />,
              title: "Web3 Ready",
              description:
                "Seamless wallet integration for decentralized interactions",
            },
          ].map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                whileHover={{ scale: 1.05 }}
                sx={{
                  height: "100%",
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <CardContent sx={{ textAlign: "center", p: 4 }}>
                  <Box sx={{ color: "primary.main", mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
