import { useState, useMemo } from 'react';
import { Snapshot, Account } from '../types';
// categories imported via finance utils
import { buildCategoriesById, computeTotals, isLiabilityAccount, calculateConsistentMetrics } from '../utils/finance';

interface SnapshotsListProps {
  snapshots: Snapshot[];
  onDelete: (id: string) => void;
}

export default function SnapshotsList({ snapshots, onDelete }: SnapshotsListProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const categoriesById = useMemo(() => buildCategoriesById(), []);
  if (snapshots.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
        No snapshots created yet.
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div>
      {snapshots.map((snapshot, index) => {
        const previousSnapshot = snapshots[index + 1];
        const isGain = previousSnapshot ? snapshot.totalNetWorth > previousSnapshot.totalNetWorth : true;
        const md = (snapshot as any).metadata || {};
        
        // Calculate all metrics consistently using the new utility function
        const consistentMetrics = calculateConsistentMetrics(snapshot, previousSnapshot, categoriesById);
        const mg = consistentMetrics.monthlyGain;
        const dph = consistentMetrics.dollarsPerHour;
        const pc = consistentMetrics.portfolioChange;
        const isExpanded = !!expanded[snapshot.id];

        const groupByCategory = (accounts: Account[]) => {
          const groups: Record<string, { name: string; icon: string; type: 'asset' | 'liability'; total: number; accounts: Account[] }> = {};
          for (const acc of accounts) {
            const cat = categoriesById[acc.categoryId] || { name: acc.categoryId, icon: '•', type: 'asset' as const };
            const key = acc.categoryId;
            if (!groups[key]) {
              groups[key] = { name: cat.name, icon: cat.icon, type: cat.type, total: 0, accounts: [] };
            }
            groups[key].accounts.push(acc);
            const add = cat.type === 'liability' ? Math.abs(acc.balance) : acc.balance;
            groups[key].total += add;
          }
          return groups;
        };
        const accountsForSnapshot = Array.isArray(snapshot.accounts) ? snapshot.accounts : [];
        const assetAccounts = accountsForSnapshot.filter(a => !isLiabilityAccount(a, categoriesById));
        const liabilityAccounts = accountsForSnapshot.filter(a => isLiabilityAccount(a, categoriesById));
        const assetGroups = groupByCategory(assetAccounts);
        const liabilityGroups = groupByCategory(liabilityAccounts);
        const { assetsTotal, liabilitiesTotal, netWorth: computedNetWorth } = computeTotals(accountsForSnapshot, categoriesById);
        
        return (
          <div 
            key={snapshot.id} 
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '16px',
              background: '#fafafa'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, marginRight: '16px' }}>
                    {formatDate(snapshot.date)}
                  </h3>
                  {index === 0 && (
                    <span style={{
                      background: '#3b82f6',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      LATEST
                    </span>
                  )}
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: '16px',
                  marginBottom: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Net Worth</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                      {formatCurrency(Number.isFinite(computedNetWorth) ? computedNetWorth : snapshot.totalNetWorth)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Assets</div>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#059669' }}>
                      {formatCurrency(assetsTotal || snapshot.totalAssets)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Liabilities</div>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#dc2626' }}>
                      {formatCurrency(liabilitiesTotal || snapshot.totalLiabilities)}
                    </div>
                  </div>

                  {mg !== undefined && (
                    <div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>Monthly Change</div>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: '500', 
                        color: mg >= 0 ? '#059669' : '#dc2626'
                      }}>
                        {mg >= 0 ? '+' : ''}
                        {formatCurrency(mg)}
                      </div>
                    </div>
                  )}

                  {dph !== undefined && (
                    <div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>Dollars/Hour</div>
                      <div style={{ fontSize: '16px', fontWeight: '500', color: '#7c3aed' }}>
                        ${dph.toFixed(2)}
                      </div>
                    </div>
                  )}

                  {pc !== undefined && (
                    <div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>Portfolio Change</div>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: '500', 
                        color: pc >= 0 ? '#059669' : '#dc2626'
                      }}>
                        {pc >= 0 ? '+' : ''}
                        {pc.toFixed(2)}%
                      </div>
                    </div>
                  )}
                </div>

                {previousSnapshot && (
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#6b7280',
                    padding: '8px',
                    background: isGain ? '#f0fdf4' : '#fef2f2',
                    borderRadius: '4px',
                    border: `1px solid ${isGain ? '#bbf7d0' : '#fecaca'}`
                  }}>
                    {isGain ? '📈' : '📉'} 
                    {(() => {
                      const prevAccs = Array.isArray((previousSnapshot as any).accounts) ? (previousSnapshot as any).accounts as Account[] : [];
                      const prevTotals = computeTotals(prevAccs, categoriesById);
                      const prevNW = prevAccs.length > 0 ? prevTotals.netWorth : previousSnapshot.totalNetWorth;
                      const diff = Math.abs((Number.isFinite(computedNetWorth) ? computedNetWorth : snapshot.totalNetWorth) - prevNW);
                      return `${isGain ? 'Gained' : 'Lost'} ${formatCurrency(diff)} since last snapshot`;
                    })()}
                  </div>
                )}

                <div style={{ marginTop: '12px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setExpanded(prev => ({ ...prev, [snapshot.id]: !isExpanded }))}
                  >
                    {isExpanded ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '16px' }}>
                    <div className="card" style={{ background: 'white' }}>
                      <h4 style={{ marginBottom: 12 }}>Breakdown</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 8, color: '#059669' }}>Assets</div>
                          {Object.entries(assetGroups).length === 0 && <div style={{ color: '#6b7280' }}>No assets</div>}
                          {Object.entries(assetGroups).map(([id, group]) => (
                            <div key={id} style={{ marginBottom: 8 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500 }}>
                                <span>{group.icon} {group.name}</span>
                                <span>{formatCurrency(group.total)}</span>
                              </div>
                              <div style={{ marginTop: 6, paddingLeft: 8, color: '#374151' }}>
                                {group.accounts.map(acc => (
                                  <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                    <span>{acc.name}</span>
                                    <span>{formatCurrency(acc.balance)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 8, color: '#dc2626' }}>Liabilities</div>
                          {Object.entries(liabilityGroups).length === 0 && <div style={{ color: '#6b7280' }}>No liabilities</div>}
                          {Object.entries(liabilityGroups).map(([id, group]) => (
                            <div key={id} style={{ marginBottom: 8 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500 }}>
                                <span>{group.icon} {group.name}</span>
                                <span>{formatCurrency(group.total)}</span>
                              </div>
                              <div style={{ marginTop: 6, paddingLeft: 8, color: '#374151' }}>
                                {group.accounts.map(acc => (
                                  <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                    <span>{acc.name}</span>
                                    <span>{formatCurrency(acc.balance)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="card" style={{ background: 'white', marginTop: 12 }}>
                      <h4 style={{ marginBottom: 12 }}>Summary</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                        <div>
                          <div style={{ color: '#6b7280' }}>Accounts</div>
                          <div style={{ fontWeight: 600 }}>{accountsForSnapshot.length}</div>
                        </div>
                        <div>
                          <div style={{ color: '#6b7280' }}>Assets</div>
                          <div style={{ fontWeight: 600, color: '#059669' }}>{formatCurrency(assetsTotal || snapshot.totalAssets)}</div>
                        </div>
                        <div>
                          <div style={{ color: '#6b7280' }}>Liabilities</div>
                          <div style={{ fontWeight: 600, color: '#dc2626' }}>{formatCurrency(liabilitiesTotal || snapshot.totalLiabilities)}</div>
                        </div>
                        {mg !== undefined && (
                          <div>
                            <div style={{ color: '#6b7280' }}>Monthly Gain</div>
                            <div style={{ fontWeight: 600, color: mg >= 0 ? '#059669' : '#dc2626' }}>{mg >= 0 ? '+' : ''}{formatCurrency(mg)}</div>
                          </div>
                        )}
                        {dph !== undefined && (
                          <div>
                            <div style={{ color: '#6b7280' }}>Dollars Per Hour</div>
                            <div style={{ fontWeight: 600 }}>${dph.toFixed(2)} {md && md.hoursInMonth ? `(x ${md.hoursInMonth} hrs)` : ''}</div>
                          </div>
                        )}
                        {pc !== undefined && (
                          <div>
                            <div style={{ color: '#6b7280' }}>Portfolio Change</div>
                            <div style={{ fontWeight: 600, color: pc >= 0 ? '#059669' : '#dc2626' }}>{pc >= 0 ? '+' : ''}{pc.toFixed(2)}%</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this snapshot? This action cannot be undone.')) {
                    onDelete(snapshot.id);
                  }
                }}
                style={{
                  background: 'none',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '14px',
                  marginLeft: '16px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fef2f2';
                  e.currentTarget.style.borderColor = '#fecaca';
                  e.currentTarget.style.color = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}