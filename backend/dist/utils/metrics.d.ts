import { Account } from '../types/index.js';
interface MetricsInput {
    currentNetWorth: number;
    previousNetWorth?: number;
    hoursInMonth: number;
    accounts: Account[];
}
interface CalculatedMetrics {
    monthlyGain?: number;
    dollarsPerHour?: number;
    portfolioChange?: number;
}
export declare function calculateMetrics(input: MetricsInput): CalculatedMetrics;
export declare function calculateHoursInMonth(year: number, month: number): number;
export declare function formatCurrency(amount: number): string;
export declare function formatPercentage(value: number, decimals?: number): string;
export {};
//# sourceMappingURL=metrics.d.ts.map