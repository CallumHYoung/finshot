import { AccountCategory } from '../types/index.js';
interface SimpleAccount {
    id: string;
    name: string;
    type: string;
    balance: number;
    categoryId: string;
}
export declare function buildCategoriesById(): Record<string, AccountCategory>;
export declare function isLiabilityAccount(account: SimpleAccount, categoriesById?: Record<string, AccountCategory>): boolean;
export declare function computeTotals(accounts: SimpleAccount[], categoriesById?: Record<string, AccountCategory>): {
    assetsTotal: number;
    liabilitiesTotal: number;
    netWorth: number;
};
export {};
//# sourceMappingURL=finance.d.ts.map