import { useState } from 'react';
import { Snapshot, DashboardModule } from '../../types';
import './MetricModules.css';

interface InsightsModuleProps {
  snapshots: Snapshot[];
  enabledModules: DashboardModule[];
}

interface Insight {
  moduleId: string;
  title: string;
  status: string;
  statusColor: string;
  recommendation: string;
  breakdown?: string[];
  priority: 'high' | 'medium' | 'low';
}

export default function InsightsModule({ snapshots, enabledModules }: InsightsModuleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Generate insights from all enabled modules
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];

    if (!snapshots.length) {
      return [{
        moduleId: 'no-data',
        title: 'No Data Available',
        status: 'No snapshots found',
        statusColor: '#6b7280',
        recommendation: 'Add financial snapshots to see insights and recommendations.',
        priority: 'medium'
      }];
    }

    // Check if we have any enabled modules
    if (enabledModules.length === 0) {
      return [{
        moduleId: 'no-modules',
        title: 'No Metrics Enabled',
        status: 'No modules enabled',
        statusColor: '#6b7280',
        recommendation: 'Enable some metric modules in the dashboard customizer to see insights.',
        priority: 'medium'
      }];
    }

    // Emergency Fund insights
    if (enabledModules.some(m => m.componentId === 'emergency-fund')) {
      const liquidAssets = snapshots[0]?.accounts
        ?.filter(account => account.categoryId === 'cash')
        ?.reduce((sum, account) => sum + account.balance, 0) || 0;
      
      const estimatedMonthlyExpenses = Math.max(
        (snapshots[0]?.totalAssets || 0) * 0.03,
        2000
      );
      const monthsCovered = estimatedMonthlyExpenses > 0 ? liquidAssets / estimatedMonthlyExpenses : 0;
      
      let status, statusColor, recommendation, priority;
      if (monthsCovered >= 6) {
        status = 'Excellent';
        statusColor = '#10b981';
        recommendation = '✅ You have a solid emergency fund! Consider investing excess cash.';
        priority = 'low';
      } else if (monthsCovered >= 3) {
        status = 'Good';
        statusColor = '#f59e0b';
        recommendation = '💡 You\'re halfway there! Try to save an additional $' + 
          Math.max(0, (6 * estimatedMonthlyExpenses) - liquidAssets).toLocaleString() + '.';
        priority = 'medium';
      } else if (monthsCovered >= 1) {
        status = 'Fair';
        statusColor = '#ef4444';
        recommendation = '⚠️ Build your emergency fund. You need $' + 
          Math.max(0, (6 * estimatedMonthlyExpenses) - liquidAssets).toLocaleString() + ' more.';
        priority = 'high';
      } else {
        status = 'Critical';
        statusColor = '#7f1d1d';
        recommendation = '🚨 Critical: Start building an emergency fund immediately. Target: $' + 
          Math.max(0, (6 * estimatedMonthlyExpenses) - liquidAssets).toLocaleString() + '.';
        priority = 'high';
      }

      insights.push({
        moduleId: 'emergency-fund',
        title: 'Emergency Fund',
        status,
        statusColor,
        recommendation,
        breakdown: [
          `Liquid Assets: $${liquidAssets.toLocaleString()}`,
          `Months Covered: ${monthsCovered.toFixed(1)}/6`,
          `Est. Monthly Expenses: $${estimatedMonthlyExpenses.toLocaleString()}`
        ],
        priority
      });
    }

    // Savings Rate insights
    if (enabledModules.some(m => m.componentId === 'savings-rate') && snapshots.length >= 2) {
      const latestSnapshot = snapshots[0];
      const previousSnapshot = snapshots[1];
      const monthlyGain = (latestSnapshot.totalNetWorth || 0) - (previousSnapshot.totalNetWorth || 0);
      const estimatedIncome = Math.abs(monthlyGain) * 3;
      const savingsRate = estimatedIncome > 0 ? (monthlyGain / estimatedIncome) * 100 : 0;
      
      let status, statusColor, recommendation, priority;
      if (savingsRate >= 20) {
        status = 'Excellent';
        statusColor = '#10b981';
        recommendation = '🌟 Outstanding savings rate! You\'re on track for early retirement.';
        priority = 'low';
      } else if (savingsRate >= 10) {
        status = 'Good';
        statusColor = '#f59e0b';
        recommendation = '✅ Good savings rate! Consider increasing to 20% for faster wealth building.';
        priority = 'medium';
      } else if (savingsRate >= 5) {
        status = 'Fair';
        statusColor = '#ef4444';
        recommendation = '💡 Aim to increase your savings rate to at least 10% of income.';
        priority = 'high';
      } else {
        status = 'Needs Improvement';
        statusColor = '#7f1d1d';
        recommendation = '⚠️ Focus on reducing expenses and increasing savings. Start with 5%.';
        priority = 'high';
      }

      insights.push({
        moduleId: 'savings-rate',
        title: 'Savings Rate',
        status,
        statusColor,
        recommendation,
        breakdown: [
          `Current Rate: ${savingsRate.toFixed(1)}%`,
          `Monthly Savings: $${Math.max(0, monthlyGain).toLocaleString()}`,
          `Est. Monthly Income: $${estimatedIncome.toLocaleString()}`
        ],
        priority
      });
    }

    // Asset Allocation insights
    if (enabledModules.some(m => m.componentId === 'asset-allocation')) {
      const latestSnapshot = snapshots[0];
      if (latestSnapshot?.accounts) {
        const totalAssets = latestSnapshot.totalAssets || 0;
        const cashPercentage = (latestSnapshot.accounts
          .filter(account => account.categoryId === 'cash')
          .reduce((sum, account) => sum + account.balance, 0) / totalAssets) * 100;
        
        let status, statusColor, recommendation, priority;
        if (cashPercentage <= 10) {
          status = 'Good';
          statusColor = '#10b981';
          recommendation = '✅ Good asset allocation! Low cash percentage suggests proper investment.';
          priority = 'low';
        } else if (cashPercentage <= 20) {
          status = 'Fair';
          statusColor = '#f59e0b';
          recommendation = '💡 Consider investing some excess cash for better returns.';
          priority = 'medium';
        } else {
          status = 'High Cash';
          statusColor = '#ef4444';
          recommendation = '⚠️ High cash percentage. Consider investing excess funds.';
          priority = 'medium';
        }

        insights.push({
          moduleId: 'asset-allocation',
          title: 'Asset Allocation',
          status,
          statusColor,
          recommendation,
          breakdown: [
            `Cash: ${cashPercentage.toFixed(1)}%`,
            `Total Assets: $${totalAssets.toLocaleString()}`,
            `Cash Amount: $${(latestSnapshot.accounts
              .filter(account => account.categoryId === 'cash')
              .reduce((sum, account) => sum + account.balance, 0)).toLocaleString()}`
          ],
          priority
        });
      }
    }

    // Financial Independence insights
    if (enabledModules.some(m => m.componentId === 'financial-independence')) {
      const latestSnapshot = snapshots[0];
      if (latestSnapshot?.totalNetWorth && latestSnapshot?.totalAssets) {
        const netWorth = latestSnapshot.totalNetWorth;
        const totalAssets = latestSnapshot.totalAssets;
        const fiRatio = totalAssets > 0 ? netWorth / totalAssets : 0;
        
        let status, statusColor, recommendation, priority;
        if (fiRatio >= 0.8) {
          status = 'Excellent';
          statusColor = '#10b981';
          recommendation = '🎉 You\'re close to financial independence!';
          priority = 'low';
        } else if (fiRatio >= 0.6) {
          status = 'Good';
          statusColor = '#f59e0b';
          recommendation = '💪 Good progress! Focus on debt reduction and asset building.';
          priority = 'medium';
        } else if (fiRatio >= 0.4) {
          status = 'Fair';
          statusColor = '#ef4444';
          recommendation = '📈 Build assets and reduce debt to improve your FI ratio.';
          priority = 'high';
        } else {
          status = 'Needs Work';
          statusColor = '#7f1d1d';
          recommendation = '🚨 Focus on building assets and reducing debt significantly.';
          priority = 'high';
        }

        insights.push({
          moduleId: 'financial-independence',
          title: 'Financial Independence',
          status,
          statusColor,
          recommendation,
          breakdown: [
            `FI Ratio: ${(fiRatio * 100).toFixed(1)}%`,
            `Net Worth: $${netWorth.toLocaleString()}`,
            `Total Assets: $${totalAssets.toLocaleString()}`
          ],
          priority
        });
      }
    }

    // Debt-to-Income insights
    if (enabledModules.some(m => m.componentId === 'debt-to-income')) {
      const latestSnapshot = snapshots[0];
      if (latestSnapshot?.accounts) {
        const totalDebt = latestSnapshot.accounts
          .filter(account => account.balance < 0)
          .reduce((sum, account) => sum + Math.abs(account.balance), 0);
        
        if (totalDebt > 0) {
          let status, statusColor, recommendation, priority;
          if (totalDebt <= 10000) {
            status = 'Low Debt';
            statusColor = '#10b981';
            recommendation = '✅ Low debt level. You\'re in good financial shape.';
            priority = 'low';
          } else if (totalDebt <= 50000) {
            status = 'Moderate Debt';
            statusColor = '#f59e0b';
            recommendation = '💡 Moderate debt. Consider debt reduction strategies.';
            priority = 'medium';
          } else {
            status = 'High Debt';
            statusColor = '#ef4444';
            recommendation = '⚠️ High debt level. Prioritize debt reduction.';
            priority = 'high';
          }

          insights.push({
            moduleId: 'debt-to-income',
            title: 'Debt Level',
            status,
            statusColor,
            recommendation,
            breakdown: [
              `Total Debt: $${totalDebt.toLocaleString()}`,
              `Net Worth: $${(latestSnapshot.totalNetWorth || 0).toLocaleString()}`,
              `Debt-to-Net-Worth: ${((totalDebt / (latestSnapshot.totalNetWorth || 1)) * 100).toFixed(1)}%`
            ],
            priority
          });
        }
      }
    }

    // Sort insights by priority (high first, then medium, then low)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return insights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  };

  const insights = generateInsights();

  if (!isVisible) {
    return (
      <div className="insights-toggle-button">
        <button 
          onClick={() => setIsVisible(true)}
          className="btn btn-primary"
          title="Show Insights"
        >
          💡 Show Insights
        </button>
      </div>
    );
  }

  return (
    <div className={`insights-module ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="insights-header">
        <div className="insights-title">
          <h3>💡 Financial Insights</h3>
          <span className="insights-count">{insights.length}</span>
        </div>
        <div className="insights-actions">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-icon"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '−' : '+'}
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="btn-icon"
            title="Hide Insights"
          >
            ✕
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="insights-content">
          {insights.length > 0 ? (
            <div className="insights-list">
              {insights.map((insight, index) => (
                <div key={insight.moduleId} className={`insight-item priority-${insight.priority}`}>
                  <div className="insight-header">
                    <h4>{insight.title}</h4>
                    <span 
                      className="insight-status"
                      style={{ color: insight.statusColor }}
                    >
                      {insight.status}
                    </span>
                  </div>
                  
                  <div className="insight-recommendation">
                    {insight.recommendation}
                  </div>
                  
                  {insight.breakdown && (
                    <div className="insight-breakdown">
                      {insight.breakdown.map((item, i) => (
                        <div key={i} className="breakdown-item">
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {index < insights.length - 1 && <div className="insight-divider" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="insights-empty">
              <p>No insights available</p>
              <p>Enable some metric modules to see insights</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
