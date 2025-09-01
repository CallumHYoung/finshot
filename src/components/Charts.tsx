import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Snapshot } from '../types';
import NetWorthChart from './charts/NetWorthChart';
import MetricsChart from './charts/MetricsChart';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function Charts() {
  const { token, logout } = useAuth();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/snapshots`, {
          headers: { 'Authorization': `Bearer ${token}` }
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
        const detailed = await Promise.all(
          (Array.isArray(data) ? data : []).map(async (s: any) => {
            try {
              const res = await fetch(`${API_BASE_URL}/snapshots/${s.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (!res.ok) return s as Snapshot;
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

    if (token) {
      fetchSnapshots();
    } else {
      setLoading(false);
    }
  }, [token, logout]);

  if (loading) {
    return <div className="card">Loading charts…</div>;
  }

  if (error) {
    return (
      <div className="card">
        <h2>Error Loading Charts</h2>
        <p style={{ color: '#ef4444' }}>{error}</p>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="card">
        <h2>No data yet</h2>
        <p>Add a snapshot to see charts.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>Net Worth Over Time</h2>
        <div className="chart-container">
          <NetWorthChart snapshots={snapshots} />
        </div>
      </div>

      <div className="card">
        <h2>Financial Metrics</h2>
        <div className="chart-container">
          <MetricsChart snapshots={snapshots} />
        </div>
      </div>
    </div>
  );
}


