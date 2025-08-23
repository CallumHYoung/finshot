import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { AuthRequest, Snapshot, Account, DbSnapshot } from '../types/index.js';
import { calculateMetrics } from '../utils/metrics.js';
import { computeTotals } from '../utils/finance.js';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const dbSnapshots = await database.all<DbSnapshot>(
      `SELECT 
        id, user_id, date, total_net_worth, total_assets, total_liabilities,
        monthly_gain, dollars_per_hour, portfolio_change, hours_in_month,
        created_at, updated_at
       FROM snapshots 
       WHERE user_id = ? 
       ORDER BY date DESC`,
      [userId]
    );

    // Recompute totals for the list view using standardized finance utility logic
    const snapshots: Snapshot[] = await Promise.all(dbSnapshots.map(async (snapshot) => {
      const accounts = await database.all<any>('SELECT * FROM accounts WHERE snapshot_id = ?', [snapshot.id]);
      
      // Normalize accounts for finance utility compatibility
      const normalizedAccounts = (accounts || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: Number(a.balance) || 0,
        categoryId: a.category_id
      }));

      // Use the same logic as frontend finance utility
      const totals = computeTotals(normalizedAccounts);
      
      return {
        id: snapshot.id,
        userId: snapshot.user_id,
        date: snapshot.date,
        totalNetWorth: totals.netWorth,
        totalAssets: totals.assetsTotal,
        totalLiabilities: totals.liabilitiesTotal,
        metadata: {
          monthlyGain: snapshot.monthly_gain,
          dollarsPerHour: snapshot.dollars_per_hour,
          portfolioChange: snapshot.portfolio_change,
          hoursInMonth: snapshot.hours_in_month
        },
        createdAt: snapshot.created_at,
        updatedAt: snapshot.updated_at
      } as Snapshot;
    }));

    res.json(snapshots);
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    res.status(500).json({ error: 'Failed to fetch snapshots' });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const dbSnapshot = await database.get<DbSnapshot>(
      `SELECT 
        id, user_id, date, total_net_worth, total_assets, total_liabilities,
        monthly_gain, dollars_per_hour, portfolio_change, hours_in_month,
        created_at, updated_at
       FROM snapshots 
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!dbSnapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    const accounts = await database.all<Account>(
      'SELECT * FROM accounts WHERE snapshot_id = ?',
      [id]
    );

    // Normalize accounts and use standardized finance utility logic  
    const normalizedAccounts = (accounts || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      balance: Number(a.balance) || 0,
      categoryId: a.category_id
    }));

    // Re-compute totals using consistent logic
    const totals = computeTotals(normalizedAccounts);

    const snapshot: Snapshot = {
      id: dbSnapshot.id,
      userId: dbSnapshot.user_id,
      date: dbSnapshot.date,
      totalNetWorth: totals.netWorth,
      totalAssets: totals.assetsTotal,
      totalLiabilities: totals.liabilitiesTotal,
      metadata: {
        monthlyGain: dbSnapshot.monthly_gain,
        dollarsPerHour: dbSnapshot.dollars_per_hour,
        portfolioChange: dbSnapshot.portfolio_change,
        hoursInMonth: dbSnapshot.hours_in_month
      },
      createdAt: dbSnapshot.created_at,
      updatedAt: dbSnapshot.updated_at
    };

    const result = {
      ...snapshot,
      accounts
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching snapshot:', error);
    res.status(500).json({ error: 'Failed to fetch snapshot' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { date, accounts, hoursInMonth = 744 } = req.body;

    if (!date || !accounts || !Array.isArray(accounts)) {
      return res.status(400).json({ error: 'Date and accounts array are required' });
    }

    const snapshotId = uuidv4();

    // Use consistent calculation logic
    const totals = computeTotals(accounts);
    const totalAssets = totals.assetsTotal;
    const totalLiabilities = totals.liabilitiesTotal;
    const totalNetWorth = totals.netWorth;

    const previousSnapshot = await database.get<DbSnapshot>(
      'SELECT * FROM snapshots WHERE user_id = ? AND date < ? ORDER BY date DESC LIMIT 1',
      [userId, date]
    );

    const metrics = calculateMetrics({
      currentNetWorth: totalNetWorth,
      previousNetWorth: previousSnapshot?.total_net_worth,
      hoursInMonth,
      accounts
    });

    await database.run(
      `INSERT INTO snapshots (
        id, user_id, date, total_net_worth, total_assets, total_liabilities,
        monthly_gain, dollars_per_hour, portfolio_change, hours_in_month
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        snapshotId, userId, date, totalNetWorth, totalAssets, totalLiabilities,
        metrics.monthlyGain, metrics.dollarsPerHour, metrics.portfolioChange, hoursInMonth
      ]
    );

    for (const account of accounts) {
      const accountId = uuidv4();
      await database.run(
        `INSERT INTO accounts (
          id, snapshot_id, user_id, name, type, balance, category_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          accountId, snapshotId, userId, account.name, account.type,
          account.balance, account.categoryId
        ]
      );
    }

    const createdDbSnapshot = await database.get<DbSnapshot>(
      `SELECT 
        id, user_id, date, total_net_worth, total_assets, total_liabilities,
        monthly_gain, dollars_per_hour, portfolio_change, hours_in_month,
        created_at, updated_at
       FROM snapshots 
       WHERE id = ?`,
      [snapshotId]
    );

    const createdAccounts = await database.all<Account>(
      'SELECT * FROM accounts WHERE snapshot_id = ?',
      [snapshotId]
    );

    if (!createdDbSnapshot) {
      return res.status(500).json({ error: 'Failed to create snapshot' });
    }

    const createdSnapshot: Snapshot = {
      id: createdDbSnapshot.id,
      userId: createdDbSnapshot.user_id,
      date: createdDbSnapshot.date,
      totalNetWorth: createdDbSnapshot.total_net_worth,
      totalAssets: createdDbSnapshot.total_assets,
      totalLiabilities: createdDbSnapshot.total_liabilities,
      metadata: {
        monthlyGain: createdDbSnapshot.monthly_gain,
        dollarsPerHour: createdDbSnapshot.dollars_per_hour,
        portfolioChange: createdDbSnapshot.portfolio_change,
        hoursInMonth: createdDbSnapshot.hours_in_month
      },
      createdAt: createdDbSnapshot.created_at,
      updatedAt: createdDbSnapshot.updated_at
    };

    const result = {
      ...createdSnapshot,
      accounts: createdAccounts
    };

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating snapshot:', error);
    res.status(500).json({ error: 'Failed to create snapshot' });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const snapshot = await database.get<DbSnapshot>(
      'SELECT id FROM snapshots WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!snapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    await database.run('DELETE FROM snapshots WHERE id = ?', [id]);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting snapshot:', error);
    res.status(500).json({ error: 'Failed to delete snapshot' });
  }
});

export default router;