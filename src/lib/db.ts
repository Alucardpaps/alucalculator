import { Pool, PoolConfig } from 'pg';

/**
 * Database connection pool for PostgreSQL/Supabase.
 * Optimized Singleton Pattern for Next.js (Turbopack Compatible).
 */

const poolConfig: PoolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// Standard Singleton Pattern to prevent multiple connections during hot-reloads
const globalForPool = global as unknown as { pgPool: Pool };

export const pool = globalForPool.pgPool || new Pool(poolConfig);

if (process.env.NODE_ENV !== 'production') {
    globalForPool.pgPool = pool;
}

/**
 * Utility function to run queries
 */
export async function query(text: string, params?: any[]) {
    try {
        const res = await pool.query(text, params);
        return res;
    } catch (error: any) {
        // If DB is down, we don't throw, we let the repos handle the 'Mock' state
        if (error.code === 'ECONNREFUSED' || error.message.includes('connection')) {
            console.warn("DB_OFFLINE: Switching to local file-based mock mode.");
            return { rows: [], rowCount: 0, isMock: true };
        }
        throw error;
    }
}
