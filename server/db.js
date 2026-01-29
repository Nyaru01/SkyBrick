import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

// Construct connection string if missing but individual vars exist (Railway/Postgres standard)
// Fallback priority: DATABASE_URL (Private) -> DATABASE_PUBLIC_URL (Public) -> PG* vars -> null
const connectionString = process.env.DATABASE_URL ||
    process.env.DATABASE_PUBLIC_URL ||
    (process.env.PGHOST ? `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE}` : null);

if (!connectionString) {
    console.error('❌ [DB CRITICAL] No DATABASE_URL or PG* variables found. App will crash or fail to connect.');
    console.log('ℹ️  Available Env Vars:', Object.keys(process.env).filter(k => !k.includes('KEY') && !k.includes('SECRET')).join(', '));
} else {
    // Mask password for logging
    const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':****@');
    console.log('✅ [DB] Connecting to:', maskedUrl.split('@')[1] || 'Unknown Host');
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

export default pool;
