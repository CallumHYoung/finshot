import { AccountCategory } from '../types/index.js';

// Simplified account interface for calculations
interface SimpleAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  categoryId: string;
}

// Account categories mapping for backend
const accountCategories: AccountCategory[] = [
  { id: 'cash', name: 'Cash & Bank Accounts', type: 'asset', description: 'Checking, savings, and cash accounts', icon: 'Wallet' },
  { id: 'investments', name: 'Investments', type: 'asset', description: 'Stocks, bonds, mutual funds', icon: 'TrendingUp' },
  { id: 'retirement', name: 'Retirement Accounts', type: 'asset', description: '401(k), IRA, pension plans', icon: 'PiggyBank' },
  { id: 'real-estate', name: 'Real Estate', type: 'asset', description: 'Primary residence, rental properties', icon: 'Home' },
  { id: 'vehicles', name: 'Vehicles', type: 'asset', description: 'Cars, motorcycles, boats', icon: 'Car' },
  { id: 'other-assets', name: 'Other Assets', type: 'asset', description: 'Collectibles, jewelry, other valuables', icon: 'Package' },
  { id: 'credit-cards', name: 'Credit Cards', type: 'liability', description: 'Credit card balances', icon: 'CreditCard' },
  { id: 'loans', name: 'Personal Loans', type: 'liability', description: 'Personal loans, student loans', icon: 'FileText' },
  { id: 'mortgages', name: 'Mortgages', type: 'liability', description: 'Home mortgages, property loans', icon: 'Home' },
  { id: 'other-liabilities', name: 'Other Liabilities', type: 'liability', description: 'Other debts and obligations', icon: 'AlertTriangle' },
];

export function buildCategoriesById(): Record<string, AccountCategory> {
  return Object.fromEntries(accountCategories.map(c => [c.id, c]));
}

export function isLiabilityAccount(account: SimpleAccount, categoriesById?: Record<string, AccountCategory>): boolean {
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

export function computeTotals(accounts: SimpleAccount[], categoriesById?: Record<string, AccountCategory>): {
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