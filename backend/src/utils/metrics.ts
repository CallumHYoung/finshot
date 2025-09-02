import { Account } from '../types/index.js';

interface MetricsInput {
  currentNetWorth: number;
  previousNetWorth?: number;
  hoursInMonth: number;
  accounts: Account[];
  previousAccounts?: Account[];
}

interface CalculatedMetrics {
  monthlyGain?: number;
  dollarsPerHour?: number;
  portfolioChange?: number;
}

export function calculateMetrics(input: MetricsInput): CalculatedMetrics {
  const { currentNetWorth, previousNetWorth, hoursInMonth, accounts, previousAccounts } = input;
  
  const metrics: CalculatedMetrics = {};

  if (previousNetWorth !== undefined) {
    metrics.monthlyGain = currentNetWorth - previousNetWorth;
    
    if (metrics.monthlyGain !== undefined && hoursInMonth > 0) {
      metrics.dollarsPerHour = metrics.monthlyGain / hoursInMonth;
    }
  }

  // Calculate portfolio change using proper percentage formula
  const currentInvestmentAccounts = accounts.filter(account => 
    account.type === 'investment' || account.type === 'retirement'
  );

  if (previousAccounts && (currentInvestmentAccounts.length > 0)) {
    const previousInvestmentAccounts = previousAccounts.filter(account => 
      account.type === 'investment' || account.type === 'retirement'
    );

    const currentInvestmentValue = currentInvestmentAccounts.reduce((sum, account) => sum + account.balance, 0);
    const previousInvestmentValue = previousInvestmentAccounts.reduce((sum, account) => sum + account.balance, 0);
    
    if (previousInvestmentValue > 0) {
      // Portfolio change = (new - old) / old * 100
      metrics.portfolioChange = ((currentInvestmentValue - previousInvestmentValue) / previousInvestmentValue) * 100;
    }
  }

  return metrics;
}

export function calculateHoursInMonth(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  return daysInMonth * 24;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}