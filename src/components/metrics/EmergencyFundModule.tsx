import { MetricModuleProps } from '../../types';
import { accountCategories } from '../../data/categories';
import { buildCategoriesById, calculateConsistentMetrics } from '../../utils/finance';

export default function EmergencyFundModule({ snapshots, className, onRemove, onEdit }: MetricModuleProps) {
  
  const calculateEmergencyFund = () => {
    if (!snapshots.length) return null;
    
    const latestSnapshot = snapshots[0];
    if (!latestSnapshot.accounts) return null;

    // Calculate liquid assets (cash, checking, savings)
    const liquidAssets = latestSnapshot.accounts
      .filter(account => {
        const category = accountCategories.find(cat => cat.id === account.categoryId);
        return category?.id === 'cash'; // Cash & Bank Accounts
      })
      .reduce((sum, account) => sum + account.balance, 0);

    // Calculate monthly gain using consistent metrics calculation
    const categoriesById = buildCategoriesById();
    const previousSnapshot = snapshots.length >= 2 ? snapshots[1] : undefined;
    const consistentMetrics = calculateConsistentMetrics(latestSnapshot, previousSnapshot, categoriesById);
    const monthlyGain = consistentMetrics.monthlyGain || 0;
    
    // Estimate monthly expenses from net worth change and total assets
    // This is a rough calculation - in a real app, user would input monthly expenses
    const totalAssets = latestSnapshot.totalAssets || 0;
    
    // Rough estimate: assume 3-5% of total assets as monthly expenses
    const estimatedMonthlyExpenses = Math.max(
      totalAssets * 0.03, // 3% of assets per month
      Math.abs(monthlyGain) * 2, // or 2x the monthly change
      2000 // minimum $2000/month
    );

    const monthsCovered = estimatedMonthlyExpenses > 0 ? liquidAssets / estimatedMonthlyExpenses : 0;
    const targetMonths = 6; // Standard recommendation is 6 months
    const progressPercentage = Math.min((monthsCovered / targetMonths) * 100, 100);

    return {
      liquidAssets,
      monthsCovered,
      estimatedMonthlyExpenses,
      targetMonths,
      progressPercentage,
      shortfall: Math.max(0, (targetMonths * estimatedMonthlyExpenses) - liquidAssets)
    };
  };

  const data = calculateEmergencyFund();

  const getStatusColor = (monthsCovered: number) => {
    if (monthsCovered >= 6) return "#10b981"; // Green - Excellent
    if (monthsCovered >= 3) return "#f59e0b"; // Yellow - Good
    if (monthsCovered >= 1) return "#ef4444"; // Red - Poor
    return "#7f1d1d"; // Dark red - Critical
  };

  const getStatusText = (monthsCovered: number) => {
    if (monthsCovered >= 6) return "Excellent";
    if (monthsCovered >= 3) return "Good";
    if (monthsCovered >= 1) return "Fair";
    return "Critical";
  };

  const getRecommendation = (monthsCovered: number, shortfall: number) => {
    if (monthsCovered >= 6) {
      return "✅ You have a solid emergency fund! Consider investing excess cash.";
    } else if (monthsCovered >= 3) {
      return `💡 You're halfway there! Try to save an additional $${shortfall.toLocaleString()}.`;
    } else if (monthsCovered >= 1) {
      return `⚠️ Build your emergency fund. You need $${shortfall.toLocaleString()} more.`;
    } else {
      return `🚨 Critical: Start building an emergency fund immediately. Target: $${shortfall.toLocaleString()}.`;
    }
  };

  return (
    <div className={`metric-module ${className || ''}`}>
      <div className="metric-header">
        <div>
          <h3>Emergency Fund Coverage</h3>
          <p className="metric-description">
            Months of expenses covered by liquid assets
          </p>
        </div>
        <div className="metric-actions">
          {onEdit && (
            <button onClick={onEdit} className="btn-icon" title="Edit">
              ⚙️
            </button>
          )}
          {onRemove && (
            <button onClick={onRemove} className="btn-icon" title="Remove">
              ✕
            </button>
          )}
        </div>
      </div>
      
      <div className="metric-content">
        {data ? (
          <>
            <div className="metric-visualization">
              <div className="progress-container">
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${data.progressPercentage}%`,
                      backgroundColor: getStatusColor(data.monthsCovered)
                    }}
                  />
                  <div className="progress-markers">
                    {[1, 2, 3, 4, 5, 6].map(month => (
                      <div 
                        key={month} 
                        className="progress-marker"
                        style={{ 
                          left: `${(month / 6) * 100}%`,
                          opacity: data.monthsCovered >= month ? 1 : 0.3
                        }}
                      >
                        {month}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="progress-value">
                  <span style={{ 
                    fontSize: '28px', 
                    fontWeight: 'bold',
                    color: getStatusColor(data.monthsCovered)
                  }}>
                    {data.monthsCovered.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '16px', color: '#6b7280' }}>
                    / {data.targetMonths} months
                  </span>
                </div>
              </div>
            </div>
            
            <div className="metric-details">
              <div className="metric-status" style={{ color: getStatusColor(data.monthsCovered) }}>
                Status: {getStatusText(data.monthsCovered)}
              </div>
              <div className="metric-breakdown">
                <div>Liquid Assets: ${data.liquidAssets.toLocaleString()}</div>
                <div>Est. Monthly Expenses: ${data.estimatedMonthlyExpenses.toLocaleString()}</div>
                <div>Target Fund: ${(data.targetMonths * data.estimatedMonthlyExpenses).toLocaleString()}</div>
                {data.shortfall > 0 && (
                  <div style={{ color: '#ef4444' }}>
                    Shortfall: ${data.shortfall.toLocaleString()}
                  </div>
                )}
              </div>
              <div className="metric-recommendation">
                {getRecommendation(data.monthsCovered, data.shortfall)}
              </div>
            </div>
          </>
        ) : (
          <div className="metric-no-data">
            <p>Not enough data to calculate emergency fund coverage.</p>
            <p>Add snapshots with cash and bank accounts to see this metric.</p>
          </div>
        )}
      </div>
    </div>
  );
}
