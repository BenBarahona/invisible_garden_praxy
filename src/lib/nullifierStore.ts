/**
 * Nullifier Store - Database Layer for Production
 * 
 * This file provides the database schema and helper functions for storing
 * and checking nullifiers in production. Replace the in-memory Map with this
 * when deploying.
 * 
 * MIGRATION GUIDE:
 * 
 * 1. Set up PostgreSQL database
 * 2. Run the SQL schema below
 * 3. Install: npm install pg
 * 4. Set DATABASE_URL in your .env file
 * 5. Replace the in-memory functions in route.ts with these functions
 */

/**
 * PostgreSQL Schema
 * 
 * Run this SQL to create the nullifiers table:
 * 
 * ```sql
 * CREATE TABLE nullifiers (
 *   id SERIAL PRIMARY KEY,
 *   nullifier VARCHAR(255) NOT NULL,
 *   scope VARCHAR(255) NOT NULL,
 *   used_at TIMESTAMP NOT NULL DEFAULT NOW(),
 *   ip_address VARCHAR(45),
 *   user_agent TEXT,
 *   additional_data JSONB,
 *   
 *   -- Composite unique constraint to prevent duplicate nullifier+scope
 *   CONSTRAINT unique_nullifier_scope UNIQUE (nullifier, scope),
 *   
 *   -- Indexes for performance
 *   INDEX idx_nullifier_scope ON nullifiers(nullifier, scope),
 *   INDEX idx_used_at ON nullifiers(used_at)
 * );
 * 
 * -- Optional: Create audit log table for security monitoring
 * CREATE TABLE verification_audit_log (
 *   id SERIAL PRIMARY KEY,
 *   action VARCHAR(100) NOT NULL,
 *   success BOOLEAN NOT NULL,
 *   nullifier VARCHAR(255),
 *   scope VARCHAR(255),
 *   error TEXT,
 *   verification_time_ms INTEGER,
 *   ip_address VARCHAR(45),
 *   user_agent TEXT,
 *   created_at TIMESTAMP NOT NULL DEFAULT NOW(),
 *   
 *   INDEX idx_created_at ON verification_audit_log(created_at),
 *   INDEX idx_nullifier ON verification_audit_log(nullifier)
 * );
 * ```
 */

// Uncomment this section when ready to use PostgreSQL:
/*
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export interface NullifierRecord {
  id?: number;
  nullifier: string;
  scope: string;
  usedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  additionalData?: Record<string, any>;
}

**
 * Checks if a nullifier has been used for a given scope
 *
export async function isNullifierUsed(
  nullifier: string,
  scope: string
): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id FROM nullifiers WHERE nullifier = $1 AND scope = $2 LIMIT 1',
      [nullifier, scope]
    );
    return result.rows.length > 0;
  } finally {
    client.release();
  }
}

**
 * Records a nullifier as used
 *
export async function recordNullifier(
  nullifier: string,
  scope: string,
  ipAddress?: string,
  userAgent?: string,
  additionalData?: Record<string, any>
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO nullifiers (nullifier, scope, ip_address, user_agent, additional_data)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (nullifier, scope) DO NOTHING`,
      [nullifier, scope, ipAddress, userAgent, JSON.stringify(additionalData || {})]
    );
  } finally {
    client.release();
  }
}

**
 * Gets all nullifiers for a specific scope (for analytics/debugging)
 *
export async function getNullifiersByScope(
  scope: string,
  limit: number = 100
): Promise<NullifierRecord[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, nullifier, scope, used_at as "usedAt", ip_address as "ipAddress"
       FROM nullifiers
       WHERE scope = $1
       ORDER BY used_at DESC
       LIMIT $2`,
      [scope, limit]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

**
 * Cleans up old nullifiers (optional - for privacy)
 * Call this periodically to remove old records
 *
export async function cleanupOldNullifiers(
  daysOld: number = 30
): Promise<number> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `DELETE FROM nullifiers
       WHERE used_at < NOW() - INTERVAL '${daysOld} days'`,
    );
    return result.rowCount || 0;
  } finally {
    client.release();
  }
}

**
 * Logs verification attempts for security auditing
 *
export async function logVerificationAttempt(
  action: string,
  success: boolean,
  details: {
    nullifier?: string;
    scope?: string;
    error?: string;
    verificationTimeMs?: number;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO verification_audit_log 
       (action, success, nullifier, scope, error, verification_time_ms, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        action,
        success,
        details.nullifier,
        details.scope,
        details.error,
        details.verificationTimeMs,
        details.ipAddress,
        details.userAgent,
      ]
    );
  } finally {
    client.release();
  }
}

**
 * Gets verification statistics for monitoring
 *
export async function getVerificationStats(
  startDate: Date,
  endDate: Date
): Promise<{
  totalAttempts: number;
  successfulVerifications: number;
  failedVerifications: number;
  uniqueNullifiers: number;
  averageVerificationTime: number;
}> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
         COUNT(*) as total_attempts,
         SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_verifications,
         SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_verifications,
         COUNT(DISTINCT nullifier) as unique_nullifiers,
         AVG(verification_time_ms) as average_verification_time
       FROM verification_audit_log
       WHERE created_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    );
    
    const row = result.rows[0];
    return {
      totalAttempts: parseInt(row.total_attempts),
      successfulVerifications: parseInt(row.successful_verifications),
      failedVerifications: parseInt(row.failed_verifications),
      uniqueNullifiers: parseInt(row.unique_nullifiers),
      averageVerificationTime: parseFloat(row.average_verification_time) || 0,
    };
  } finally {
    client.release();
  }
}
*/

// Redis Alternative (for high-performance scenarios)
/**
 * Redis Schema Alternative
 * 
 * For high-throughput applications, you might prefer Redis:
 * 
 * ```typescript
 * import Redis from 'ioredis';
 * 
 * const redis = new Redis(process.env.REDIS_URL);
 * 
 * export async function isNullifierUsed(
 *   nullifier: string,
 *   scope: string
 * ): Promise<boolean> {
 *   const key = `nullifier:${scope}:${nullifier}`;
 *   const exists = await redis.exists(key);
 *   return exists === 1;
 * }
 * 
 * export async function recordNullifier(
 *   nullifier: string,
 *   scope: string,
 *   ttlSeconds: number = 86400 * 30 // 30 days
 * ): Promise<void> {
 *   const key = `nullifier:${scope}:${nullifier}`;
 *   const data = JSON.stringify({
 *     nullifier,
 *     scope,
 *     usedAt: new Date().toISOString(),
 *   });
 *   await redis.setex(key, ttlSeconds, data);
 * }
 * ```
 */

export {};

