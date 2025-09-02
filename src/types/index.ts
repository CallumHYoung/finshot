export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  categoryId: string;
}

export interface AccountCategory {
  id: string;
  name: string;
  type: 'asset' | 'liability';
  description: string;
  icon: string;
}

export interface Snapshot {
  id: string;
  date: string;
  accounts: Account[];
  totalNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  metadata: {
    monthlyGain?: number;
    dollarsPerHour?: number;
    portfolioChange?: number;
    hoursInMonth: number;
  };
}

export type AccountType = 
  | 'checking'
  | 'savings'
  | 'investment'
  | 'retirement'
  | 'real-estate'
  | 'vehicle'
  | 'credit-card'
  | 'loan'
  | 'mortgage'
  | 'other-asset'
  | 'other-liability';

export interface QuestionnaireStep {
  id: string;
  question: string;
  type: 'yes-no' | 'category-selection' | 'account-entry';
  categoryId?: string;
  nextStepId?: string;
  yesNextStepId?: string;
  noNextStepId?: string;
}

export interface QuestionnaireState {
  currentStepId: string;
  answers: Record<string, any>;
  selectedCategories: string[];
  accounts: Account[];
}

// Enhanced financial metrics interfaces
export interface FinancialMetrics {
  // Existing metrics
  monthlyGain?: number;
  dollarsPerHour?: number;
  portfolioChange?: number;
  
  // New comprehensive metrics
  debtToIncomeRatio?: number;
  emergencyFundCoverage?: number; // months of expenses covered
  savingsRate?: number; // percentage
  liquidityRatio?: number;
  assetAllocation?: AssetAllocation;
  financialIndependenceRatio?: number; // net worth / FI target
}

export interface AssetAllocation {
  cash: number;
  investments: number;
  retirement: number;
  realEstate: number;
  vehicles: number;
  otherAssets: number;
}

export interface MetricModuleProps {
  snapshots: Snapshot[];
  className?: string;
  onRemove?: () => void;
  onEdit?: () => void;
}

export interface DashboardModule {
  id: string;
  title: string;
  component: React.ComponentType<MetricModuleProps>;
  enabled: boolean;
  position: number;
  size: 'small' | 'medium' | 'large';
}