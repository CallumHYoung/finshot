import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AccountCategory, Account, QuestionnaireState } from '../types';
import { accountCategories } from '../data/categories';

interface QuestionnaireProps {
  onComplete: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function Questionnaire({ onComplete }: QuestionnaireProps) {
  const { token } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<QuestionnaireState>({
    currentStepId: 'start',
    answers: {},
    selectedCategories: [],
    accounts: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    'Welcome',
    'Account Categories',
    'Account Details',
    'Review & Submit'
  ];

  const handleCategoryToggle = (categoryId: string) => {
    setState(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter(id => id !== categoryId)
        : [...prev.selectedCategories, categoryId]
    }));
  };

  const handleAccountChange = (categoryId: string, accounts: Account[]) => {
    setState(prev => ({
      ...prev,
      accounts: [
        ...prev.accounts.filter(acc => acc.categoryId !== categoryId),
        ...accounts
      ]
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const currentDate = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`${API_BASE_URL}/snapshots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: currentDate,
          accounts: state.accounts,
          hoursInMonth: new Date().getDate() === 1 ? 
            new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() * 24 :
            744
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create snapshot');
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderWelcomeStep = () => (
    <div className="questionnaire-step">
      <div>
        <h2>Welcome to Your NetWorth Snapshot</h2>
        <p style={{ fontSize: '18px', marginTop: '20px', lineHeight: '1.6' }}>
          Let's walk through your financial accounts step by step, just like tax software.
          This will help us create a comprehensive snapshot of your current net worth.
        </p>
        <div style={{ 
          background: '#eff6ff', 
          padding: '16px', 
          borderRadius: '8px',
          margin: '24px 0',
          border: '1px solid #bfdbfe'
        }}>
          <h3>What we'll collect:</h3>
          <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
            <li>Your bank accounts and cash</li>
            <li>Investment and retirement accounts</li>
            <li>Real estate and other assets</li>
            <li>Credit cards and loans</li>
          </ul>
        </div>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          This typically takes 5-10 minutes. All data is stored securely and encrypted.
        </p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <button onClick={handleNext} className="btn btn-primary">
          Let's Get Started →
        </button>
      </div>
    </div>
  );

  const renderCategoryStep = () => (
    <div className="questionnaire-step">
      <div>
        <h2>Do you have any of these types of accounts?</h2>
        <p style={{ marginBottom: '24px', color: '#6b7280' }}>
          Select all that apply. Don't worry if you're not sure - you can always skip categories you don't have.
        </p>
        
        <div className="category-grid">
          {accountCategories.map(category => (
            <div
              key={category.id}
              className={`category-card ${state.selectedCategories.includes(category.id) ? 'selected' : ''}`}
              onClick={() => handleCategoryToggle(category.id)}
            >
              <div className="category-icon">{category.icon}</div>
              <h3>{category.name}</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                {category.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={handlePrevious} className="btn btn-secondary">
          ← Previous
        </button>
        <button 
          onClick={handleNext} 
          className="btn btn-primary"
          disabled={state.selectedCategories.length === 0}
        >
          Continue ({state.selectedCategories.length} selected) →
        </button>
      </div>
    </div>
  );

  const renderAccountDetailsStep = () => (
    <div className="questionnaire-step">
      <div>
        <h2>Enter Your Account Details</h2>
        <p style={{ marginBottom: '24px', color: '#6b7280' }}>
          For each category you selected, add your accounts and their current balances.
        </p>

        {state.selectedCategories.map(categoryId => {
          const category = accountCategories.find(c => c.id === categoryId);
          if (!category) return null;

          return (
            <CategoryAccountEntry
              key={categoryId}
              category={category}
              accounts={state.accounts.filter(acc => acc.categoryId === categoryId)}
              onAccountsChange={(accounts) => handleAccountChange(categoryId, accounts)}
            />
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={handlePrevious} className="btn btn-secondary">
          ← Previous
        </button>
        <button 
          onClick={handleNext} 
          className="btn btn-primary"
          disabled={state.accounts.length === 0}
        >
          Review & Submit →
        </button>
      </div>
    </div>
  );

  const renderReviewStep = () => {
    const totalAssets = state.accounts
      .filter(acc => ['checking', 'savings', 'investment', 'retirement', 'real-estate', 'vehicle', 'other-asset'].includes(acc.type))
      .reduce((sum, acc) => sum + acc.balance, 0);

    const totalLiabilities = state.accounts
      .filter(acc => ['credit-card', 'loan', 'mortgage', 'other-liability'].includes(acc.type))
      .reduce((sum, acc) => sum + Math.abs(acc.balance), 0);

    const netWorth = totalAssets - totalLiabilities;

    return (
      <div className="questionnaire-step">
        <div>
          <h2>Review Your Snapshot</h2>
          
          <div className="stats-grid" style={{ margin: '24px 0' }}>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <div className="stat-value">${totalAssets.toLocaleString()}</div>
              <div className="stat-label">Total Assets</div>
            </div>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
              <div className="stat-value">${totalLiabilities.toLocaleString()}</div>
              <div className="stat-label">Total Liabilities</div>
            </div>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
              <div className="stat-value">${netWorth.toLocaleString()}</div>
              <div className="stat-label">Net Worth</div>
            </div>
          </div>

          <div style={{ marginTop: '32px' }}>
            <h3>Account Summary</h3>
            {state.selectedCategories.map(categoryId => {
              const category = accountCategories.find(c => c.id === categoryId);
              const categoryAccounts = state.accounts.filter(acc => acc.categoryId === categoryId);
              
              if (!category || categoryAccounts.length === 0) return null;

              return (
                <div key={categoryId} style={{ margin: '16px 0' }}>
                  <h4>{category.icon} {category.name}</h4>
                  {categoryAccounts.map(account => (
                    <div key={account.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '8px 16px',
                      background: '#f8fafc',
                      marginTop: '4px',
                      borderRadius: '4px'
                    }}>
                      <span>{account.name}</span>
                      <span style={{ fontWeight: 'bold' }}>
                        ${Math.abs(account.balance).toLocaleString()}
                        {category.type === 'liability' && account.balance > 0 ? ' (debt)' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {error && (
            <div style={{ 
              background: '#fee2e2', 
              border: '1px solid #fecaca', 
              color: '#dc2626',
              padding: '12px', 
              borderRadius: '6px', 
              marginTop: '16px' 
            }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={handlePrevious} className="btn btn-secondary">
            ← Previous
          </button>
          <button 
            onClick={handleSubmit} 
            className="btn btn-success"
            disabled={loading}
          >
            {loading ? 'Creating Snapshot...' : 'Create Snapshot ✓'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1>Step {currentStep + 1} of {steps.length}: {steps[currentStep]}</h1>
      </div>

      <div className="card">
        {currentStep === 0 && renderWelcomeStep()}
        {currentStep === 1 && renderCategoryStep()}
        {currentStep === 2 && renderAccountDetailsStep()}
        {currentStep === 3 && renderReviewStep()}
      </div>
    </div>
  );
}

interface CategoryAccountEntryProps {
  category: AccountCategory;
  accounts: Account[];
  onAccountsChange: (accounts: Account[]) => void;
}

function CategoryAccountEntry({ category, accounts, onAccountsChange }: CategoryAccountEntryProps) {
  const [localAccounts, setLocalAccounts] = useState<Account[]>(accounts);

  useEffect(() => {
    onAccountsChange(localAccounts);
  }, [localAccounts, onAccountsChange]);

  const addAccount = () => {
    const newAccount: Account = {
      id: Date.now().toString(),
      name: '',
      type: category.type === 'liability' ? 'other-liability' : 'other-asset',
      balance: 0,
      categoryId: category.id
    };
    setLocalAccounts([...localAccounts, newAccount]);
  };

  const updateAccount = (id: string, field: keyof Account, value: string | number) => {
    setLocalAccounts(accounts =>
      accounts.map(acc =>
        acc.id === id ? { ...acc, [field]: value } : acc
      )
    );
  };

  const removeAccount = (id: string) => {
    setLocalAccounts(accounts => accounts.filter(acc => acc.id !== id));
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      <h3>{category.icon} {category.name}</h3>
      <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '14px' }}>
        {category.description}
      </p>

      {localAccounts.map(account => (
        <div key={account.id} className="account-entry">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: '12px', alignItems: 'end' }}>
            <div>
              <label className="form-label">Account Name</label>
              <input
                type="text"
                className="form-input"
                placeholder={`e.g., ${category.name === 'Cash & Bank Accounts' ? 'Chase Checking' : 
                  category.name === 'Credit Cards' ? 'Chase Sapphire' : 
                  category.name === 'Investment Accounts' ? 'Vanguard 401k' : 
                  'My ' + category.name.split(' ')[0]}`}
                value={account.name}
                onChange={(e) => updateAccount(account.id, 'name', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">
                {category.type === 'liability' ? 'Amount Owed' : 'Balance'}
              </label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                value={account.balance || ''}
                onChange={(e) => updateAccount(account.id, 'balance', parseFloat(e.target.value) || 0)}
              />
            </div>
            <button
              type="button"
              onClick={() => removeAccount(account.id)}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '14px' }}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addAccount}
        className="btn btn-secondary"
        style={{ marginTop: '12px' }}
      >
        + Add {category.name.replace(/s$/, '')}
      </button>
    </div>
  );
}