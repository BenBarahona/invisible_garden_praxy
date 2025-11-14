"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute, useVerification } from "@/components/ProtectedRoute";
import {
  getVerificationSession,
  clearVerificationSession,
  formatSessionDuration,
  getSessionDuration,
} from "@/lib/verificationSession";

/**
 * Protected Chat Page
 *
 * This page is only accessible to users who have successfully verified
 * their zero-knowledge proof. Access is granted based on verification session.
 */

function ChatContent() {
  const router = useRouter();
  const { verified, session } = useVerification();
  const [sessionDuration, setSessionDuration] = useState<number | null>(null);

  // Update session duration display
  useEffect(() => {
    const updateTimer = () => {
      const duration = getSessionDuration();
      setSessionDuration(duration);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    clearVerificationSession();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">💬</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Secure Medical Chat
                </h1>
                <p className="text-sm text-gray-500">
                  Zero-Knowledge Verified Access
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Session Status */}
              <div className="px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-green-700 font-semibold">
                    Active Session
                    {sessionDuration !== null && (
                      <span className="ml-2 text-green-600">
                        ({formatSessionDuration(sessionDuration)})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-3xl">✓</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome, Verified Medical Professional!
              </h2>
              <p className="text-gray-600 mb-4">
                You&apos;ve successfully proven your credentials using
                zero-knowledge proofs. Your identity remains private while your
                group membership has been verified.
              </p>

              {/* Verification Details */}
              {session && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Verified At</p>
                    <p className="text-sm font-mono text-gray-900">
                      {new Date(session.verifiedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Nullifier Hash</p>
                    <p className="text-sm font-mono text-gray-900">
                      {session.nullifier.slice(0, 20)}...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
                <h3 className="text-lg font-semibold">
                  Medical Consultation Chat
                </h3>
                <p className="text-sm text-blue-100 mt-1">
                  End-to-end encrypted · Anonymous verified participants
                </p>
              </div>

              {/* Messages Area */}
              <div className="h-96 overflow-y-auto p-6 bg-gray-50">
                <div className="space-y-4">
                  {/* System Message */}
                  <div className="flex justify-center">
                    <div className="px-4 py-2 bg-gray-200 rounded-full text-sm text-gray-600">
                      🔒 This chat is protected by zero-knowledge verification
                    </div>
                  </div>

                  {/* Sample Message */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                      👤
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-semibold text-gray-900">
                            Anonymous Professional
                          </span>{" "}
                          · Verified ✓
                        </p>
                        <p className="text-gray-800">
                          Welcome to the secure chat. All participants have been
                          verified through ZK proofs.
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-4">
                        Just now
                      </p>
                    </div>
                  </div>

                  {/* Placeholder for more messages */}
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">
                      Start a conversation with other verified professionals
                    </p>
                  </div>
                </div>
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                    Send
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Your messages are end-to-end encrypted
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Active Users */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Active Verified Users
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      Anonymous Professional #1
                    </p>
                    <p className="text-xs text-gray-500">Verified ✓</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      Anonymous Professional #2
                    </p>
                    <p className="text-xs text-gray-500">Verified ✓</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xl">🔒</span>
                Security Features
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    Zero-knowledge proof verification
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <p className="text-gray-700">Anonymous group membership</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <p className="text-gray-700">End-to-end encryption</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    Persistent session (until logout/close)
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <p className="text-gray-700">No identity disclosure</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  📋 View Verification Status
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  ✓ Re-verify Credentials
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-xl">ℹ️</span>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-1">
                How Zero-Knowledge Verification Works
              </h4>
              <p className="text-blue-800 text-sm">
                You gained access to this chat by proving you&apos;re a member
                of the approved medical professionals group{" "}
                <strong>without revealing your identity</strong>. The system
                only knows that you belong to the group, not who you are
                specifically. This ensures both security and privacy.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  );
}
