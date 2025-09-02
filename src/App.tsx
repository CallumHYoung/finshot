import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Questionnaire from './components/Questionnaire';
import Charts from './components/Charts.tsx';
import MetricsPage from './components/MetricsPage';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'questionnaire' | 'charts' | 'metrics'>('dashboard');

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div>
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">NetWorth Advisor</div>
            <nav className="nav">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`btn ${currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setCurrentView('metrics')}
                className={`btn ${currentView === 'metrics' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Metrics
              </button>
              <button 
                onClick={() => setCurrentView('charts')}
                className={`btn ${currentView === 'charts' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Charts
              </button>
              <button 
                onClick={() => setCurrentView('questionnaire')}
                className={`btn ${currentView === 'questionnaire' ? 'btn-primary' : 'btn-secondary'}`}
              >
                New Snapshot
              </button>
            </nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>
                {user?.email}
              </span>
              <button 
                onClick={logout}
                className="btn btn-secondary"
                style={{ fontSize: '14px', padding: '6px 12px' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'metrics' && <MetricsPage />}
        {currentView === 'charts' && <Charts />}
        {currentView === 'questionnaire' && (
          <Questionnaire onComplete={() => setCurrentView('dashboard')} />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;