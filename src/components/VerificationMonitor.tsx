"use client";

import { useState, useEffect } from "react";

/**
 * Verification Monitor Component
 *
 * This component provides real-time monitoring of proof verification attempts.
 * Useful for admins to track system usage and security.
 *
 * NOTE: In production, you'd want to:
 * 1. Add proper authentication (admin-only access)
 * 2. Create a dedicated API endpoint for fetching stats
 * 3. Use a real-time connection (WebSocket, SSE, or polling)
 * 4. Store data in a database instead of in-memory
 */

interface VerificationAttempt {
  timestamp: string;
  action: string;
  success: boolean;
  nullifier?: string;
  scope?: string;
  error?: string;
  verificationTimeMs?: number;
  ipAddress?: string;
}

interface VerificationStats {
  totalAttempts: number;
  successfulVerifications: number;
  failedVerifications: number;
  averageVerificationTime: number;
  uniqueNullifiers: Set<string>;
}

export function VerificationMonitor() {
  const [stats, setStats] = useState<VerificationStats>({
    totalAttempts: 0,
    successfulVerifications: 0,
    failedVerifications: 0,
    averageVerificationTime: 0,
    uniqueNullifiers: new Set(),
  });
  const [recentAttempts, setRecentAttempts] = useState<VerificationAttempt[]>(
    []
  );
  const [isLive, setIsLive] = useState(false);

  // Simulated data fetching - replace with real API calls
  useEffect(() => {
    if (!isLive) return;

    // In production, replace with:
    // const interval = setInterval(async () => {
    //   const response = await fetch('/api/admin/verification-stats');
    //   const data = await response.json();
    //   setStats(data.stats);
    //   setRecentAttempts(data.recentAttempts);
    // }, 2000);

    const interval = setInterval(() => {
      // Simulated data update
      console.log("Fetching verification stats...");
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  const successRate =
    stats.totalAttempts > 0
      ? ((stats.successfulVerifications / stats.totalAttempts) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Verification Monitor
          </h2>
          <p className="text-gray-600 mt-1">
            Real-time monitoring of proof verification attempts
          </p>
        </div>

        <button
          onClick={() => setIsLive(!isLive)}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            isLive
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {isLive ? "● Live" : "○ Paused"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Attempts */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Attempts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalAttempts}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        {/* Successful */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.successfulVerifications}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">✓</span>
            </div>
          </div>
        </div>

        {/* Failed */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.failedVerifications}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <span className="text-2xl">✗</span>
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {successRate}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">Performance</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Avg. Verification Time:
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {stats.averageVerificationTime.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Unique Nullifiers:</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats.uniqueNullifiers.size}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">System Status</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">
                Verification API: Online
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">
                Nullifier Store: Operational
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attempts Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            Recent Verification Attempts
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Nullifier
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Scope
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentAttempts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No verification attempts yet. Start monitoring by clicking
                    &quot;Live&quot; above.
                  </td>
                </tr>
              ) : (
                recentAttempts.map((attempt, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(attempt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          attempt.success
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {attempt.success ? "✓ Success" : "✗ Failed"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                      {attempt.nullifier
                        ? `${attempt.nullifier.slice(0, 10)}...`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                      {attempt.scope ? `${attempt.scope.slice(0, 15)}...` : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {attempt.verificationTimeMs
                        ? `${attempt.verificationTimeMs}ms`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {attempt.ipAddress || "unknown"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Implementation Note */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-yellow-600 text-xl">⚠️</span>
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-900">
              Implementation Required
            </h4>
            <p className="text-yellow-800 text-sm mt-1">
              This is a UI mockup. To make it functional, create an API endpoint
              at{" "}
              <code className="bg-yellow-100 px-1 rounded">
                /api/admin/verification-stats
              </code>{" "}
              that returns verification data from your audit log database.
            </p>
            <p className="text-yellow-800 text-sm mt-2">
              See{" "}
              <code className="bg-yellow-100 px-1 rounded">
                src/lib/nullifierStore.ts
              </code>{" "}
              for database schema examples.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example API endpoint implementation:
 *
 * // app/api/admin/verification-stats/route.ts
 * export async function GET(req: NextRequest) {
 *   // Add authentication check here
 *
 *   const stats = await getVerificationStats(
 *     new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
 *     new Date()
 *   );
 *
 *   const recentAttempts = await getRecentVerificationAttempts(50);
 *
 *   return NextResponse.json({
 *     stats,
 *     recentAttempts,
 *   });
 * }
 */
