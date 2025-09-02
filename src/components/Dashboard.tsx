import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Snapshot } from '../types';
import SnapshotsList from './SnapshotsList';
import Sparkline from './charts/Sparkline.tsx';
import { computeTotals, buildCategoriesById, calculateConsistentMetrics } from '../utils/finance';
// Backend now handles totals computation

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function Dashboard() {
  const { token, logout } = useAuth();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSparkline, setShowSparkline] = useState(false);

  useEffect(() => {
    if (token) {
      fetchSnapshots();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchSnapshots = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/snapshots`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log('Token expired or invalid, logging out');
          logout();
          return;
        }
        throw new Error('Failed to fetch snapshots');
      }

      const data = await response.json();

      // Fetch detailed snapshots with accounts and normalize fields
      const detailed = await Promise.all(
        (Array.isArray(data) ? data : []).map(async (s: any) => {
          try {
            const res = await fetch(`${API_BASE_URL}/snapshots/${s.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return s;
            const full = await res.json();
            const normalizedAccounts = Array.isArray(full.accounts)
              ? full.accounts.map((a: any) => ({
                  id: a.id,
                  name: a.name,
                  type: a.type,
                  balance: Number(a.balance) || 0,
                  categoryId: a.categoryId ?? a.category_id ?? '',
                }))
              : [];
            return { ...s, accounts: normalizedAccounts } as Snapshot;
          } catch {
            return s as Snapshot;
          }
        })
      );

      setSnapshots(detailed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deleteSnapshot = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/snapshots/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete snapshot');
      }

      setSnapshots(snapshots.filter(s => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete snapshot');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '18px' }}>Loading your financial data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>Error Loading Data</h2>
        <p style={{ color: '#ef4444', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchSnapshots} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>Welcome to Your NetWorth Dashboard!</h2>
        <p style={{ fontSize: '18px', margin: '20px 0', color: '#6b7280' }}>
          You haven't created any snapshots yet. Let's start tracking your financial progress!
        </p>
        <div style={{ 
          background: '#eff6ff', 
          padding: '20px', 
          borderRadius: '8px',
          margin: '20px 0',
          border: '1px solid #bfdbfe'
        }}>
          <h3>Get Started:</h3>
          <ol style={{ textAlign: 'left', marginTop: '12px', paddingLeft: '20px' }}>
            <li>Click "New Snapshot" to create your first financial snapshot</li>
            <li>Enter your account balances for the current month</li>
            <li>View charts and metrics as you add more snapshots over time</li>
          </ol>
        </div>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Create Your First Snapshot
        </button>
      </div>
    );
  }

  const latestSnapshot = snapshots[0];
  const categoriesById = buildCategoriesById();
  
  // Recalculate totals using consistent logic (same as SnapshotsList)
  const latestAccounts = Array.isArray(latestSnapshot.accounts) ? latestSnapshot.accounts : [];
  const latestTotals = computeTotals(latestAccounts, categoriesById);
  
  // Calculate all metrics consistently using the new utility function
  const previousSnapshot = snapshots.length >= 2 ? snapshots[1] : undefined;
  const consistentMetrics = calculateConsistentMetrics(latestSnapshot, previousSnapshot, categoriesById);
  
  const monthlyGain = consistentMetrics.monthlyGain;
  const dollarsPerHour = consistentMetrics.dollarsPerHour;
  const portfolioChange = consistentMetrics.portfolioChange;
 
   return (
     <div>
      <div className="stats-grid">
        <div 
          className="stat-card" 
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', position: 'relative' }}
          onMouseEnter={() => setShowSparkline(true)}
          onMouseLeave={() => setShowSparkline(false)}
        >
          <div className="stat-value">${latestTotals.netWorth.toLocaleString()}</div>
          <div className="stat-label">Current Net Worth</div>
          {showSparkline && (
            <div style={{ position: 'absolute', zIndex: 10, right: 12, top: 12, background: 'white', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: 8 }}>
              <Sparkline snapshots={snapshots} width={420} height={140} />
            </div>
          )}
        </div>
        
        {monthlyGain !== undefined && (
          <div className="stat-card" style={{ 
            background: monthlyGain >= 0 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
          }}>
            <div className="stat-value">
              {monthlyGain >= 0 ? '+' : ''}
              ${monthlyGain.toLocaleString()}
            </div>
            <div className="stat-label">Monthly Change</div>
          </div>
        )}

        {dollarsPerHour !== undefined && (
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
            <div className="stat-value">
              ${dollarsPerHour.toFixed(2)}
            </div>
            <div className="stat-label">Dollars Per Hour</div>
          </div>
        )}

        {portfolioChange !== undefined && (
          <div className="stat-card" style={{ 
            background: portfolioChange >= 0 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
          }}>
            <div className="stat-value">
              {portfolioChange >= 0 ? '+' : ''}
              {portfolioChange.toFixed(2)}%
            </div>
            <div className="stat-label">Portfolio Change</div>
          </div>
        )}
      </div>

      {/* Charts removed from Dashboard; available in Charts page */}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Your Snapshots</h2>
          <button onClick={logout} className="btn btn-secondary">
            Logout
          </button>
        </div>
        <SnapshotsList 
          snapshots={snapshots} 
          onDelete={deleteSnapshot}
        />
      </div>
    </div>
  );
}