export function calculateMetrics(input) {
    const { currentNetWorth, previousNetWorth, hoursInMonth, accounts } = input;
    const metrics = {};
    if (previousNetWorth !== undefined) {
        metrics.monthlyGain = currentNetWorth - previousNetWorth;
        if (metrics.monthlyGain !== undefined && hoursInMonth > 0) {
            metrics.dollarsPerHour = metrics.monthlyGain / hoursInMonth;
        }
    }
    const investmentAccounts = accounts.filter(account => account.type === 'investment' || account.type === 'retirement');
    if (investmentAccounts.length > 0) {
        const totalInvestmentValue = investmentAccounts.reduce((sum, account) => sum + account.balance, 0);
        if (previousNetWorth !== undefined && metrics.monthlyGain !== undefined) {
            const investmentGain = metrics.monthlyGain;
            if (totalInvestmentValue > 0) {
                metrics.portfolioChange = (investmentGain / totalInvestmentValue) * 100;
            }
        }
    }
    return metrics;
}
export function calculateHoursInMonth(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    return daysInMonth * 24;
}
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}
export function formatPercentage(value, decimals = 2) {
    return `${value.toFixed(decimals)}%`;
}
//# sourceMappingURL=metrics.js.map