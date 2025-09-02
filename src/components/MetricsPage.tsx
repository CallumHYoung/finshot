import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Snapshot } from '../types';
import ModularDashboard from './ModularDashboard';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function MetricsPage() {
  const { token, logout } = useAuth();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '18px' }}>Loading your financial metrics...</div>
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
        <h2>No Financial Data Available</h2>
        <p style={{ fontSize: '18px', margin: '20px 0', color: '#6b7280' }}>
          You need to create at least one financial snapshot to view metrics.
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
            <li>Go to the Dashboard page</li>
            <li>Click "New Snapshot" to create your first financial snapshot</li>
            <li>Return here to view detailed financial metrics and analysis</li>
          </ol>
        </div>
        <button onClick={() => window.location.href = '/dashboard'} className="btn btn-primary">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <ModularDashboard snapshots={snapshots} />
    </div>
  );
}
