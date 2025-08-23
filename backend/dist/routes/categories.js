import { Router } from 'express';
import { database } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
const router = Router();
router.get('/', authenticateToken, async (req, res) => {
    try {
        const categories = await database.all('SELECT * FROM account_categories ORDER BY type, name');
        res.json(categories);
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});
export default router;
//# sourceMappingURL=categories.js.map