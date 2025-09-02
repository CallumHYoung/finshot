import { Account, AccountCategory } from '../types';
import { accountCategories } from '../data/categories';

export function buildCategoriesById(): Record<string, AccountCategory> {
  return Object.fromEntries(accountCategories.map(c => [c.id, c]));
}

export function isLiabilityAccount(account: Account, categoriesById?: Record<string, AccountCategory>): boolean {
  const map = categoriesById ?? buildCategoriesById();
  const catType = map[account.categoryId]?.type;
  if (catType) return catType === 'liability';
  const typeLower = String((account as any).type || '').toLowerCase();
  if ([
    'credit-card', 'loan', 'mortgage', 'other-liability',
    'credit-cards', 'loans', 'mortgages', 'other-liabilities'
  ].includes(typeLower)) {
    return true;
  }
  return (Number(account.balance) || 0) < 0;
}

export function computeTotals(accounts: Account[], categoriesById?: Record<string, AccountCategory>): {
  assetsTotal: number;
  liabilitiesTotal: number;
  netWorth: number;
} {
  const map = categoriesById ?? buildCategoriesById();
  const assetsTotal = (accounts || [])
    .filter(a => !isLiabilityAccount(a, map))
    .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  const liabilitiesTotal = (accounts || [])
    .filter(a => isLiabilityAccount(a, map))
    .reduce((sum, a) => sum + Math.abs(Number(a.balance) || 0), 0);
  return { assetsTotal, liabilitiesTotal, netWorth: assetsTotal - liabilitiesTotal };
}

export interface ConsistentMetrics {
  monthlyGain?: number;
  dollarsPerHour?: number;
  portfolioChange?: number;
}

export function calculateConsistentMetrics(
  currentSnapshot: { accounts?: Account[]; metadata?: any },
  previousSnapshot?: { accounts?: Account[] },
  categoriesById?: Record<string, AccountCategory>
): ConsistentMetrics {
  const categories = categoriesById ?? buildCategoriesById();
  const metrics: ConsistentMetrics = {};

  if (!previousSnapshot) return metrics;

  // Calculate monthly gain using consistent recalculation logic
  const currentAccounts = Array.isArray(currentSnapshot.accounts) ? currentSnapshot.accounts : [];
  const previousAccounts = Array.isArray(previousSnapshot.accounts) ? previousSnapshot.accounts : [];
  const currentTotals = computeTotals(currentAccounts, categories);
  const previousTotals = computeTotals(previousAccounts, categories);
  metrics.monthlyGain = currentTotals.netWorth - previousTotals.netWorth;

  // Calculate dollars per hour
  const hoursInMonth = currentSnapshot.metadata?.hoursInMonth || 744; // Default to 744 hours (31 days * 24 hours)
  if (metrics.monthlyGain !== undefined && hoursInMonth > 0) {
    metrics.dollarsPerHour = metrics.monthlyGain / hoursInMonth;
  }

  // Calculate portfolio change using proper percentage formula
  const currentInvestmentAccounts = currentAccounts.filter(account => 
    account.type === 'investment' || account.type === 'retirement'
  );
  const previousInvestmentAccounts = previousAccounts.filter(account => 
    account.type === 'investment' || account.type === 'retirement'
  );

  if (currentInvestmentAccounts.length > 0 || previousInvestmentAccounts.length > 0) {
    const currentInvestmentValue = currentInvestmentAccounts.reduce((sum, account) => sum + account.balance, 0);
    const previousInvestmentValue = previousInvestmentAccounts.reduce((sum, account) => sum + account.balance, 0);
    
    if (previousInvestmentValue > 0) {
      // Portfolio change = (new - old) / old * 100
      metrics.portfolioChange = ((currentInvestmentValue - previousInvestmentValue) / previousInvestmentValue) * 100;
    }
  }

  return metrics;
}


