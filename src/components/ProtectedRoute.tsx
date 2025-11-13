"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isVerified, getVerificationSession } from "@/lib/verificationSession";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Protected Route Component
 *
 * Wraps content that requires proof verification.
 * Redirects to home page if user hasn't been verified.
 */
export function ProtectedRoute({
  children,
  redirectTo = "/",
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkVerification = () => {
      const verified = isVerified();

      if (!verified) {
        // Store intended destination for redirect after verification
        sessionStorage.setItem(
          "verification_redirect",
          window.location.pathname
        );
        router.push(redirectTo);
      } else {
        setHasAccess(true);
      }

      setIsChecking(false);
    };

    checkVerification();
  }, [router, redirectTo]);

  if (isChecking) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Checking verification status...</p>
          </div>
        </div>
      )
    );
  }

  if (!hasAccess) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}

/**
 * Hook for checking verification status
 */
export function useVerification() {
  const [verified, setVerified] = useState(false);
  const [session, setSession] = useState(getVerificationSession());

  useEffect(() => {
    const checkStatus = () => {
      const currentSession = getVerificationSession();
      setSession(currentSession);
      setVerified(currentSession !== null);
    };

    checkStatus();

    // Check every 10 seconds for session expiry
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  return { verified, session };
}
