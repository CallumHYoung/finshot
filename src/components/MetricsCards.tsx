
import { Snapshot } from '../types';
import { buildCategoriesById, calculateConsistentMetrics } from '../utils/finance';

interface MetricsCardsProps {
  latestSnapshot: Snapshot;
  previousSnapshot?: Snapshot;
}

export default function MetricsCards({ latestSnapshot, previousSnapshot }: MetricsCardsProps) {
  const categoriesById = buildCategoriesById();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatChange = (current: number, previous?: number) => {
    if (previous === undefined) return null;
    const change = current - previous;
    const isPositive = change >= 0;
    return {
      value: change,
      percentage: previous !== 0 ? (change / Math.abs(previous)) * 100 : 0,
      isPositive,
      formatted: `${isPositive ? '+' : ''}${formatCurrency(change)}`
    };
  };

  // Calculate all metrics consistently using the new utility function
  const consistentMetrics = calculateConsistentMetrics(latestSnapshot, previousSnapshot, categoriesById);
  const monthlyGain = consistentMetrics.monthlyGain;

  const netWorthChange = formatChange(latestSnapshot.totalNetWorth, previousSnapshot?.totalNetWorth);
  const assetsChange = formatChange(latestSnapshot.totalAssets, previousSnapshot?.totalAssets);
  const liabilitiesChange = formatChange(latestSnapshot.totalLiabilities, previousSnapshot?.totalLiabilities);

  return (
    <div className="stats-grid" style={{ marginBottom: '32px' }}>
      <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
        <div className="stat-value">{formatCurrency(latestSnapshot.totalNetWorth)}</div>
        <div className="stat-label">Net Worth</div>
        {netWorthChange && (
          <div style={{ 
            fontSize: '14px', 
            marginTop: '8px',
            color: netWorthChange.isPositive ? '#dcfce7' : '#fee2e2'
          }}>
            {netWorthChange.formatted} ({netWorthChange.percentage.toFixed(1)}%)
          </div>
        )}
      </div>

      <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
        <div className="stat-value">{formatCurrency(latestSnapshot.totalAssets)}</div>
        <div className="stat-label">Total Assets</div>
        {assetsChange && (
          <div style={{ 
            fontSize: '14px', 
            marginTop: '8px',
            color: assetsChange.isPositive ? '#dcfce7' : '#fee2e2'
          }}>
            {assetsChange.formatted} ({assetsChange.percentage.toFixed(1)}%)
          </div>
        )}
      </div>

      <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
        <div className="stat-value">{formatCurrency(latestSnapshot.totalLiabilities)}</div>
        <div className="stat-label">Total Liabilities</div>
        {liabilitiesChange && (
          <div style={{ 
            fontSize: '14px', 
            marginTop: '8px',
            color: !liabilitiesChange.isPositive ? '#dcfce7' : '#fee2e2'
          }}>
            {liabilitiesChange.formatted} ({Math.abs(liabilitiesChange.percentage).toFixed(1)}%)
          </div>
        )}
      </div>

      {consistentMetrics.dollarsPerHour !== undefined && (
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
          <div className="stat-value">${consistentMetrics.dollarsPerHour.toFixed(2)}</div>
          <div className="stat-label">Dollars Per Hour</div>
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.9 }}>
            Based on {latestSnapshot.metadata?.hoursInMonth || 744} hours
          </div>
        </div>
      )}

      {consistentMetrics.portfolioChange !== undefined && (
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
          <div className="stat-value">{consistentMetrics.portfolioChange.toFixed(2)}%</div>
          <div className="stat-label">Portfolio Change</div>
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.9 }}>
            Investment performance
          </div>
        </div>
      )}

      {monthlyGain !== undefined && (
        <div className="stat-card" style={{ 
          background: monthlyGain >= 0 ? 
            'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
            'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
        }}>
          <div className="stat-value">
            {monthlyGain >= 0 ? '+' : ''}{formatCurrency(monthlyGain)}
          </div>
          <div className="stat-label">Monthly Gain/Loss</div>
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.9 }}>
            vs previous month
          </div>
        </div>
      )}
    </div>
  );
}