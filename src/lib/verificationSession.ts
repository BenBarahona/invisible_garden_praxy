"use client";

/**
 * Verification Session Management
 * 
 * Manages user verification status for gated access to protected routes.
 * Uses sessionStorage - automatically clears when browser tab/window closes.
 * Session persists indefinitely until user logs out or closes browser.
 */

export interface VerificationSession {
  verified: boolean;
  nullifier: string;
  groupRoot: string;
  verifiedAt: string;
}

const VERIFICATION_SESSION_KEY = "zk_verification_session";

/**
 * Stores verification session after successful proof verification
 * Session persists until browser tab/window closes or user logs out
 */
export function setVerificationSession(data: {
  nullifier: string;
  groupRoot: string;
  verifiedAt: string;
}): void {
  const session: VerificationSession = {
    verified: true,
    nullifier: data.nullifier,
    groupRoot: data.groupRoot,
    verifiedAt: data.verifiedAt,
  };

  sessionStorage.setItem(VERIFICATION_SESSION_KEY, JSON.stringify(session));
}

/**
 * Retrieves current verification session
 */
export function getVerificationSession(): VerificationSession | null {
  if (typeof window === "undefined") return null;

  try {
    const sessionData = sessionStorage.getItem(VERIFICATION_SESSION_KEY);
    if (!sessionData) return null;

    const session: VerificationSession = JSON.parse(sessionData);
    return session;
  } catch (error) {
    console.error("Failed to retrieve verification session:", error);
    return null;
  }
}

/**
 * Checks if user has a valid verification session
 */
export function isVerified(): boolean {
  const session = getVerificationSession();
  return session !== null && session.verified;
}

/**
 * Clears verification session (logout)
 */
export function clearVerificationSession(): void {
  sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
}

/**
 * Gets session duration (time since verification)
 * @returns milliseconds since verification, or null if no session
 */
export function getSessionDuration(): number | null {
  const session = getVerificationSession();
  if (!session) return null;

  const verifiedAt = new Date(session.verifiedAt).getTime();
  const now = Date.now();
  return now - verifiedAt;
}

/**
 * Formats session duration for display
 */
export function formatSessionDuration(milliseconds: number): string {
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

