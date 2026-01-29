import crypto from 'crypto';

// Default hash for 'admin123'
const DEFAULT_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || DEFAULT_HASH;

export function adminAuth(req, res, next) {
    const authHeader = req.headers['x-admin-auth']?.trim();

    if (!authHeader) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Compare hash
    const providedHash = crypto.createHash('sha256').update(authHeader).digest('hex');

    if (providedHash !== ADMIN_PASSWORD_HASH) {
        console.warn(`[SECURITY] Failed admin login attempt from ${req.ip}`);
        return res.status(403).json({ error: 'Invalid credentials' });
    }

    next();
}
