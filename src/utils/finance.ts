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


