"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Identity } from "@semaphore-protocol/identity";
import { getOrCreateIdentity, clearIdentity } from "@/lib/semaphore";

export function useSemaphore() {
  const { authenticated, user } = usePrivy();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [identityCommitment, setIdentityCommitment] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authenticated && user) {
      try {
        const userId =
          user.wallet?.address || user.email?.address || user.id;

        const semaphoreIdentity = getOrCreateIdentity(userId);
        setIdentity(semaphoreIdentity);
        setIdentityCommitment(semaphoreIdentity.commitment.toString());
      } catch (error) {
        console.error("Failed to initialize Semaphore identity:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIdentity(null);
      setIdentityCommitment(null);
      setIsLoading(false);
    }
  }, [authenticated, user]);

  const resetIdentity = () => {
    if (user) {
      const userId = user.wallet?.address || user.email?.address || user.id;
      clearIdentity(userId);
      const newIdentity = getOrCreateIdentity(userId);
      setIdentity(newIdentity);
      setIdentityCommitment(newIdentity.commitment.toString());
    }
  };

  return {
    identity,
    identityCommitment,
    isLoading,
    resetIdentity,
    hasIdentity: !!identity,
  };
}

