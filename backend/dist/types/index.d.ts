import { Request } from 'express';
export interface User {
    id: string;
    email: string;
    passwordHash: string;
    createdAt: string;
    updatedAt: string;
}
export interface Account {
    id: string;
    name: string;
    type: AccountType;
    balance: number;
    categoryId: string;
    userId: string;
    snapshotId: string;
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
    userId: string;
    date: string;
    totalNetWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    metadata: {
        monthlyGain?: number;
        dollarsPerHour?: number;
        portfolioChange?: number;
        hoursInMonth: number;
    };
    createdAt: string;
    updatedAt: string;
}
export interface DbSnapshot {
    id: string;
    user_id: string;
    date: string;
    total_net_worth: number;
    total_assets: number;
    total_liabilities: number;
    monthly_gain?: number;
    dollars_per_hour?: number;
    portfolio_change?: number;
    hours_in_month: number;
    created_at: string;
    updated_at: string;
}
export type AccountType = 'checking' | 'savings' | 'investment' | 'retirement' | 'real-estate' | 'vehicle' | 'credit-card' | 'loan' | 'mortgage' | 'other-asset' | 'other-liability';
export interface AuthRequest extends Request {
    user?: User;
}
export interface JWTPayload {
    userId: string;
    email: string;
}
//# sourceMappingURL=index.d.ts.map