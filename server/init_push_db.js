
import pool from './db.js';

const createTableQuery = `
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  subscription JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_user_id ON push_subscriptions(user_id);
`;

async function initDB() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();
        try {
            console.log('Running query...');
            await client.query(createTableQuery);
            console.log('✅ Table push_subscriptions created successfully!');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Error initializing DB:', err);
    } finally {
        await pool.end();
    }
}

initDB();
