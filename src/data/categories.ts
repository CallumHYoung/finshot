import { AccountCategory } from '../types';

export const accountCategories: AccountCategory[] = [
  {
    id: 'cash',
    name: 'Cash & Bank Accounts',
    type: 'asset',
    description: 'Checking accounts, savings accounts, money market accounts',
    icon: '💰'
  },
  {
    id: 'investments',
    name: 'Investment Accounts',
    type: 'asset',
    description: 'Brokerage accounts, stocks, bonds, mutual funds',
    icon: '📈'
  },
  {
    id: 'retirement',
    name: 'Retirement Accounts',
    type: 'asset',
    description: '401(k), IRA, Roth IRA, pension accounts',
    icon: '🏦'
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    type: 'asset',
    description: 'Primary residence, rental properties, land',
    icon: '🏠'
  },
  {
    id: 'vehicles',
    name: 'Vehicles',
    type: 'asset',
    description: 'Cars, trucks, motorcycles, boats',
    icon: '🚗'
  },
  {
    id: 'other-assets',
    name: 'Other Assets',
    type: 'asset',
    description: 'Jewelry, collectibles, business assets',
    icon: '💎'
  },
  {
    id: 'credit-cards',
    name: 'Credit Cards',
    type: 'liability',
    description: 'Credit card balances and outstanding debt',
    icon: '💳'
  },
  {
    id: 'loans',
    name: 'Personal Loans',
    type: 'liability',
    description: 'Personal loans, student loans, auto loans',
    icon: '📋'
  },
  {
    id: 'mortgages',
    name: 'Mortgages',
    type: 'liability',
    description: 'Home mortgages, HELOC, second mortgages',
    icon: '🏘️'
  },
  {
    id: 'other-liabilities',
    name: 'Other Liabilities',
    type: 'liability',
    description: 'Other debts and obligations',
    icon: '📄'
  }
];