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