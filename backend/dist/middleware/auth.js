import jwt from 'jsonwebtoken';
import { database } from '../database/connection.js';
const JWT_SECRET = process.env.JWT_SECRET || 'your-development-secret-key';
export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Auth middleware - Headers:', req.headers.authorization ? 'Authorization header present' : 'No auth header');
    console.log('Auth middleware - Token:', token ? 'Token extracted' : 'No token');
    if (!token) {
        console.log('Auth middleware - Rejecting: No token');
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Auth middleware - Token decoded successfully, userId:', decoded.userId);
        const user = await database.get('SELECT id, email, created_at, updated_at FROM users WHERE id = ?', [decoded.userId]);
        if (!user) {
            console.log('Auth middleware - User not found for userId:', decoded.userId);
            return res.status(403).json({ error: 'Invalid token' });
        }
        console.log('Auth middleware - User found:', user.email);
        req.user = user;
        next();
    }
    catch (error) {
        console.log('Auth middleware - Token verification failed:', error instanceof Error ? error.message : error);
        return res.status(403).json({ error: 'Invalid token' });
    }
};
export const generateToken = (user) => {
    const payload = {
        userId: user.id,
        email: user.email
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};
//# sourceMappingURL=auth.js.map