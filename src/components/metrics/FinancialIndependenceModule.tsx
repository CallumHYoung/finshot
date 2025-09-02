import { MetricModuleProps } from '../../types';
import { buildCategoriesById, calculateConsistentMetrics } from '../../utils/finance';

export default function FinancialIndependenceModule({ snapshots, className, onRemove, onEdit }: MetricModuleProps) {
  
  const calculateFinancialIndependence = () => {
    if (!snapshots.length) return null;
    
    const categoriesById = buildCategoriesById();
    const latestSnapshot = snapshots[0];
    const currentNetWorth = latestSnapshot.totalNetWorth || 0;
    
    // Calculate monthly gain using consistent metrics calculation
    const previousSnapshot = snapshots.length >= 2 ? snapshots[1] : undefined;
    const consistentMetrics = calculateConsistentMetrics(latestSnapshot, previousSnapshot, categoriesById);
    const monthlyGain = consistentMetrics.monthlyGain || 0;
    
    // Calculate estimated annual expenses
    // This is a rough calculation - in real app, user would input their target expenses
    const totalAssets = latestSnapshot.totalAssets || 0;
    
    // Rough estimate: assume 4% of net worth as annual expenses (reverse of 4% rule)
    const estimatedAnnualExpenses = Math.max(
      totalAssets * 0.04, // 4% of assets
      Math.abs(monthlyGain) * 12 * 2, // or 2x the annual change
      50000 // minimum $50k/year
    );

    // Financial Independence target (25x annual expenses - the 4% rule)
    const fiTarget = estimatedAnnualExpenses * 25;
    
    // Current progress as percentage
    const progressPercentage = Math.min((currentNetWorth / fiTarget) * 100, 100);
    
    // Time to FI calculation based on current savings rate
    let yearsToFI = null;
    if (snapshots.length >= 2 && monthlyGain > 0) {
      const annualSavings = monthlyGain * 12;
      const remaining = fiTarget - currentNetWorth;
      
      if (remaining > 0 && annualSavings > 0) {
        // Simple calculation (doesn't account for investment growth)
        yearsToFI = remaining / annualSavings;
      }
    }

    // Calculate passive income potential (4% of net worth)
    const passiveIncomeMonthly = (currentNetWorth * 0.04) / 12;
    const passiveIncomeWeekly = passiveIncomeMonthly / 4.33; // average weeks per month
    const passiveIncomeDaily = passiveIncomeMonthly / 30;

    return {
      currentNetWorth,
      fiTarget,
      progressPercentage,
      estimatedAnnualExpenses,
      yearsToFI,
      passiveIncomeMonthly,
      passiveIncomeWeekly,
      passiveIncomeDaily,
      shortfall: Math.max(0, fiTarget - currentNetWorth)
    };
  };

  const data = calculateFinancialIndependence();

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "#10b981"; // Green - Achieved FI
    if (percentage >= 75) return "#3b82f6";  // Blue - Close to FI
    if (percentage >= 50) return "#f59e0b";  // Yellow - Halfway
    if (percentage >= 25) return "#ef4444";  // Red - Quarter way
    return "#6b7280"; // Gray - Starting out
  };

  const getStatusText = (percentage: number) => {
    if (percentage >= 100) return "Financially Independent! 🎉";
    if (percentage >= 75) return "Almost There! 🚀";
    if (percentage >= 50) return "Halfway Point 💪";
    if (percentage >= 25) return "Good Progress 📈";
    return "Getting Started 🌱";
  };

  const getMilestones = (target: number) => [
    { label: "Lean FI", amount: target * 0.5, description: "Basic expenses covered" },
    { label: "Flex FI", amount: target * 0.75, description: "Some flexibility in spending" },
    { label: "Full FI", amount: target, description: "Complete financial independence" },
    { label: "Fat FI", amount: target * 1.5, description: "Comfortable lifestyle maintained" }
  ];

  const getRecommendation = (data: any) => {
    if (data.progressPercentage >= 100) {
      return "🎉 Congratulations! You've achieved financial independence!";
    } else if (data.progressPercentage >= 75) {
      return "🚀 You're so close! Stay the course for just a bit longer.";
    } else if (data.progressPercentage >= 50) {
      return "💪 Great progress! You're over halfway to financial independence.";
    } else if (data.progressPercentage >= 25) {
      return "📈 Solid foundation! Consider increasing your savings rate to accelerate progress.";
    } else {
      return "🌱 Every journey starts with a single step. Focus on building your savings rate!";
    }
  };

  return (
    <div className={`metric-module ${className || ''}`}>
      <div className="metric-header">
        <div>
          <h3>Financial Independence Progress</h3>
          <p className="metric-description">
            Progress toward complete financial freedom
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
            <div className="metric-main-stat">
              <div 
                className="metric-big-number" 
                style={{ color: getProgressColor(data.progressPercentage) }}
              >
                {data.progressPercentage.toFixed(1)}%
              </div>
              <div className="metric-sub-text">
                {getStatusText(data.progressPercentage)}
              </div>
            </div>

            <div className="metric-visualization">
              <div className="fi-progress-container">
                <div className="fi-progress-bar">
                  <div 
                    className="fi-progress-fill"
                    style={{ 
                      width: `${data.progressPercentage}%`,
                      backgroundColor: getProgressColor(data.progressPercentage)
                    }}
                  />
                </div>
                <div className="fi-milestones">
                  {getMilestones(data.fiTarget).map((milestone) => {
                    const progress = (data.currentNetWorth / milestone.amount) * 100;
                    const isAchieved = progress >= 100;
                    
                    return (
                      <div 
                        key={milestone.label} 
                        className={`fi-milestone ${isAchieved ? 'achieved' : ''}`}
                      >
                        <div className="milestone-marker" />
                        <div className="milestone-label">{milestone.label}</div>
                        <div className="milestone-amount">${(milestone.amount / 1000000).toFixed(1)}M</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="metric-details">
              <div className="metric-breakdown">
                <div>Current Net Worth: ${data.currentNetWorth.toLocaleString()}</div>
                <div>FI Target (25x expenses): ${data.fiTarget.toLocaleString()}</div>
                <div>Est. Annual Expenses: ${data.estimatedAnnualExpenses.toLocaleString()}</div>
                {data.shortfall > 0 && (
                  <div style={{ color: '#ef4444' }}>
                    Remaining: ${data.shortfall.toLocaleString()}
                  </div>
                )}
                {data.yearsToFI && (
                  <div style={{ color: '#3b82f6' }}>
                    Est. Time to FI: {data.yearsToFI.toFixed(1)} years
                  </div>
                )}
              </div>
              
              <div className="passive-income-section">
                <h4>Current Passive Income Potential (4% rule):</h4>
                <div className="passive-income-grid">
                  <div>Daily: ${data.passiveIncomeDaily.toFixed(0)}</div>
                  <div>Weekly: ${data.passiveIncomeWeekly.toFixed(0)}</div>
                  <div>Monthly: ${data.passiveIncomeMonthly.toFixed(0)}</div>
                </div>
              </div>

              <div className="metric-recommendation">
                {getRecommendation(data)}
              </div>
            </div>
          </>
        ) : (
          <div className="metric-no-data">
            <p>Not enough data to calculate FI progress.</p>
            <p>Add snapshots to track your journey to financial independence.</p>
          </div>
        )}
      </div>
    </div>
  );
}
