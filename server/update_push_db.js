
import pool from './db.js';

async function updateDB() {
    try {
        console.log('Connecting to database for update...');
        const client = await pool.connect();
        try {
            console.log('Checking push_subscriptions columns...');

            // Add username if missing
            await client.query(`
        ALTER TABLE push_subscriptions 
        ADD COLUMN IF NOT EXISTS username VARCHAR(100);
      `);
            console.log('✓ Checked/Added username column');

            // Add created_at if missing
            await client.query(`
        ALTER TABLE push_subscriptions 
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
      `);
            console.log('✓ Checked/Added created_at column');

            // Add updated_at if missing
            await client.query(`
        ALTER TABLE push_subscriptions 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
      `);
            console.log('✓ Checked/Added updated_at column');

            // Fix primary key if it was just user_id (optional, but my script used id SERIAL)
            // Existing migration in index.js used user_id as PK. 
            // My script used id SERIAL PRIMARY KEY and user_id UNIQUE.
            // This is a conflict in schema design.
            // If table exists with user_id PK, adding 'id SERIAL' might be tricky if data exists.
            // For now, I'll stick to user_id as unique identifier which is fine.
            // My routes use user_id to look up.

        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Error updating DB:', err);
    } finally {
        await pool.end();
    }
}

updateDB();
