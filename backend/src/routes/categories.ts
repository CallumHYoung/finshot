import { Router, Response } from 'express';
import { database } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { AccountCategory, AuthRequest } from '../types/index.js';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const categories = await database.all<AccountCategory>(
      'SELECT * FROM account_categories ORDER BY type, name'
    );

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;