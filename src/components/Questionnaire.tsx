import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AccountCategory, Account, AccountType, QuestionnaireState, Snapshot } from '../types';
import { accountCategories } from '../data/categories';
import { computeTotals } from '../utils/finance';

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
  const [previousSnapshot, setPreviousSnapshot] = useState<Snapshot | null>(null);
  const [loadingPrevious, setLoadingPrevious] = useState(true);

  const steps = [
    'Welcome',
    'Review Categories',
    'Review Existing Accounts',
    'Add New Accounts',
    'Review & Submit'
  ];

  // Fetch previous snapshot data on component mount
  useEffect(() => {
    if (token) {
      fetchPreviousSnapshot();
    }
  }, [token]);

  const fetchPreviousSnapshot = async () => {
    try {
      setLoadingPrevious(true);
      const response = await fetch(`${API_BASE_URL}/snapshots`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // No previous snapshots is fine, just proceed without pre-filling
        setLoadingPrevious(false);
        return;
      }

      const snapshots = await response.json();
      if (snapshots && snapshots.length > 0) {
        const latest = snapshots[0];
        
        // Fetch detailed snapshot with accounts
        const detailResponse = await fetch(`${API_BASE_URL}/snapshots/${latest.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (detailResponse.ok) {
          const detailedSnapshot = await detailResponse.json();
          const normalizedAccounts = Array.isArray(detailedSnapshot.accounts)
            ? detailedSnapshot.accounts.map((a: any) => ({
                id: a.id,
                name: a.name,
                type: a.type,
                balance: Number(a.balance) || 0,
                categoryId: a.categoryId ?? a.category_id ?? '',
              }))
            : [];
          
          const snapshotWithAccounts = { ...latest, accounts: normalizedAccounts };
          setPreviousSnapshot(snapshotWithAccounts);
          
          // Pre-fill state with previous data
          const usedCategories = [...new Set(normalizedAccounts.map((acc: Account) => acc.categoryId))].filter((id): id is string => typeof id === 'string');
          setState(prev => ({
            ...prev,
            selectedCategories: usedCategories,
            accounts: normalizedAccounts.map((acc: Account) => ({
              ...acc,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9) // New ID for new snapshot
            }))
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching previous snapshot:', err);
      // Not a critical error, just proceed without pre-filling
    } finally {
      setLoadingPrevious(false);
    }
  };

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

  const renderWelcomeStep = () => {
    if (loadingPrevious) {
      return (
        <div className="questionnaire-step">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '18px' }}>Loading your previous data...</div>
          </div>
        </div>
      );
    }

    return (
      <div className="questionnaire-step">
        <div>
          <h2>
            {previousSnapshot ? 'Update Your NetWorth Snapshot' : 'Welcome to Your NetWorth Snapshot'}
          </h2>
          <p style={{ fontSize: '18px', marginTop: '20px', lineHeight: '1.6' }}>
            {previousSnapshot
              ? `We've found your previous snapshot from ${new Date(previousSnapshot.date).toLocaleDateString()}. We'll help you quickly update your balances and add any new accounts.`
              : 'Let\'s walk through your financial accounts step by step, just like tax software. This will help us create a comprehensive snapshot of your current net worth.'
            }
          </p>
          
          {previousSnapshot && (
            <div style={{ 
              background: '#f0f9ff', 
              padding: '16px', 
              borderRadius: '8px',
              margin: '24px 0',
              border: '1px solid #bae6fd'
            }}>
              <h3>Previous Snapshot Summary:</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Net Worth</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>${previousSnapshot.totalNetWorth?.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Assets</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>${previousSnapshot.totalAssets?.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Liabilities</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>${previousSnapshot.totalLiabilities?.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ 
            background: '#eff6ff', 
            padding: '16px', 
            borderRadius: '8px',
            margin: '24px 0',
            border: '1px solid #bfdbfe'
          }}>
            <h3>{previousSnapshot ? 'We\'ll help you:' : 'What we\'ll collect:'}</h3>
            <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
              {previousSnapshot ? (
                <>
                  <li>Review your account categories</li>
                  <li>Update existing account balances</li>
                  <li>Add any new accounts you've opened</li>
                  <li>Remove accounts you've closed</li>
                </>
              ) : (
                <>
                  <li>Your bank accounts and cash</li>
                  <li>Investment and retirement accounts</li>
                  <li>Real estate and other assets</li>
                  <li>Credit cards and loans</li>
                </>
              )}
            </ul>
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            {previousSnapshot
              ? 'This should only take 2-3 minutes since we have your previous data.'
              : 'This typically takes 5-10 minutes. All data is stored securely and encrypted.'
            }
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button onClick={handleNext} className="btn btn-primary">
            {previousSnapshot ? 'Update Snapshot →' : 'Let\'s Get Started →'}
          </button>
        </div>
      </div>
    );
  };

  const renderCategoryReviewStep = () => {
    const usedCategories = previousSnapshot 
      ? [...new Set(previousSnapshot.accounts?.map(acc => acc.categoryId) || [])]
      : [];
    
    const hasUnusedCategories = accountCategories.some(cat => !state.selectedCategories.includes(cat.id));

    return (
      <div className="questionnaire-step">
        <div>
          <h2>
            {previousSnapshot ? 'Review Your Account Categories' : 'Select Your Account Categories'}
          </h2>
          <p style={{ marginBottom: '24px', color: '#6b7280' }}>
            {previousSnapshot 
              ? 'Here are the categories from your previous snapshot. Add or remove categories as needed.'
              : 'Select all account types that apply to you. Don\'t worry if you\'re not sure - you can always adjust later.'
            }
          </p>

          {previousSnapshot && usedCategories.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Currently Used Categories:</h3>
              <div className="category-grid">
                {usedCategories.map(categoryId => {
                  const category = accountCategories.find(c => c.id === categoryId);
                  if (!category) return null;
                  
                  return (
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
                      <div style={{ fontSize: '12px', color: '#10b981', marginTop: '8px', fontWeight: 'bold' }}>
                        ✓ From previous snapshot
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {hasUnusedCategories && (
            <div>
              <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>
                {previousSnapshot ? 'Additional Categories Available:' : 'Available Categories:'}
              </h3>
              <div className="category-grid">
                {accountCategories
                  .filter(category => !usedCategories.includes(category.id))
                  .map(category => (
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
          )}
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
  };

  const renderExistingAccountsStep = () => {
    const existingAccounts = state.accounts.filter(acc => 
      previousSnapshot?.accounts?.some(prevAcc => 
        prevAcc.name === acc.name && prevAcc.categoryId === acc.categoryId
      )
    );

    if (!previousSnapshot || existingAccounts.length === 0) {
      // Skip this step if no previous data or no existing accounts
      setCurrentStep(3); // Go to "Add New Accounts" step
      return null;
    }

    return (
      <div className="questionnaire-step">
        <div>
          <h2>Update Your Existing Accounts</h2>
          <p style={{ marginBottom: '24px', color: '#6b7280' }}>
            Here are your accounts from the previous snapshot. Update the balances to reflect your current amounts.
          </p>

          {state.selectedCategories.map(categoryId => {
            const category = accountCategories.find(c => c.id === categoryId);
            const categoryExistingAccounts = existingAccounts.filter(acc => acc.categoryId === categoryId);
            
            if (!category || categoryExistingAccounts.length === 0) return null;

            return (
              <ExistingAccountsEntry
                key={categoryId}
                category={category}
                accounts={categoryExistingAccounts}
                previousAccounts={previousSnapshot.accounts?.filter(acc => acc.categoryId === categoryId) || []}
                onAccountsChange={(accounts) => handleAccountChange(categoryId, accounts)}
              />
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={handlePrevious} className="btn btn-secondary">
            ← Previous
          </button>
          <button onClick={handleNext} className="btn btn-primary">
            Add New Accounts →
          </button>
        </div>
      </div>
    );
  };

  const renderNewAccountsStep = () => {
    const newAccountsByCategory = state.selectedCategories.reduce((acc, categoryId) => {
      const existingAccountsForCategory = previousSnapshot?.accounts?.filter(acc => acc.categoryId === categoryId) || [];
      const currentAccountsForCategory = state.accounts.filter(acc => acc.categoryId === categoryId);
      const newAccounts = currentAccountsForCategory.filter(acc => 
        !existingAccountsForCategory.some(prevAcc => 
          prevAcc.name === acc.name && prevAcc.categoryId === acc.categoryId
        )
      );
      if (newAccounts.length > 0 || existingAccountsForCategory.length === 0) {
        acc[categoryId] = newAccounts;
      }
      return acc;
    }, {} as Record<string, Account[]>);

    return (
      <div className="questionnaire-step">
        <div>
          <h2>Add New Accounts</h2>
          <p style={{ marginBottom: '24px', color: '#6b7280' }}>
            {previousSnapshot 
              ? 'Add any new accounts you\'ve opened since your last snapshot, or accounts for categories you didn\'t have before.'
              : 'Enter your account details for each category you selected.'
            }
          </p>

          {state.selectedCategories.map(categoryId => {
            const category = accountCategories.find(c => c.id === categoryId);
            if (!category) return null;

            const existingAccountsForCategory = previousSnapshot?.accounts?.filter(acc => acc.categoryId === categoryId) || [];
            const currentAccountsForCategory = state.accounts.filter(acc => acc.categoryId === categoryId);
            
            // Show this category if:
            // 1. No previous snapshot (first time)
            // 2. No existing accounts in this category from previous snapshot
            // 3. User has added new accounts to this category
            const shouldShow = !previousSnapshot || 
                              existingAccountsForCategory.length === 0 || 
                              currentAccountsForCategory.length > existingAccountsForCategory.length;

            if (!shouldShow) return null;

            return (
              <CategoryAccountEntry
                key={categoryId}
                category={category}
                accounts={newAccountsByCategory[categoryId] || []}
                onAccountsChange={(accounts) => {
                  // Merge with existing accounts for this category
                  const existingAccounts = state.accounts.filter(acc => 
                    acc.categoryId === categoryId && 
                    previousSnapshot?.accounts?.some(prevAcc => 
                      prevAcc.name === acc.name && prevAcc.categoryId === acc.categoryId
                    )
                  );
                  handleAccountChange(categoryId, [...existingAccounts, ...accounts]);
                }}
                isNewAccountsOnly={!!previousSnapshot}
              />
            );
          })}

          {state.selectedCategories.every(categoryId => {
            const category = accountCategories.find(c => c.id === categoryId);
            const existingAccountsForCategory = previousSnapshot?.accounts?.filter(acc => acc.categoryId === categoryId) || [];
            return !category || (previousSnapshot && existingAccountsForCategory.length > 0);
          }) && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <h3>No new accounts to add</h3>
              <p style={{ color: '#6b7280', marginTop: '8px' }}>
                All your selected categories already have accounts from your previous snapshot.
                You can skip to the review step or go back to add more categories.
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={handlePrevious} className="btn btn-secondary">
            ← Previous
          </button>
          <button 
            onClick={handleNext} 
            className="btn btn-primary"
            disabled={!previousSnapshot && state.accounts.length === 0}
          >
            Review & Submit →
          </button>
        </div>
      </div>
    );
  };

  const renderReviewStep = () => {
    // Use the standardized finance utility functions for consistency
    const { assetsTotal, liabilitiesTotal, netWorth } = computeTotals(state.accounts);

    return (
      <div className="questionnaire-step">
        <div>
          <h2>Review Your Snapshot</h2>
          
          <div className="stats-grid" style={{ margin: '24px 0' }}>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <div className="stat-value">${assetsTotal.toLocaleString()}</div>
              <div className="stat-label">Total Assets</div>
            </div>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
              <div className="stat-value">${liabilitiesTotal.toLocaleString()}</div>
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
        {currentStep === 1 && renderCategoryReviewStep()}
        {currentStep === 2 && renderExistingAccountsStep()}
        {currentStep === 3 && renderNewAccountsStep()}
        {currentStep === 4 && renderReviewStep()}
      </div>
    </div>
  );
}

interface CategoryAccountEntryProps {
  category: AccountCategory;
  accounts: Account[];
  onAccountsChange: (accounts: Account[]) => void;
  isNewAccountsOnly?: boolean;
}

interface ExistingAccountsEntryProps {
  category: AccountCategory;
  accounts: Account[];
  previousAccounts: Account[];
  onAccountsChange: (accounts: Account[]) => void;
}

function CategoryAccountEntry({ category, accounts, onAccountsChange, isNewAccountsOnly = false }: CategoryAccountEntryProps) {
  const [localAccounts, setLocalAccounts] = useState<Account[]>(accounts);

  useEffect(() => {
    onAccountsChange(localAccounts);
  }, [localAccounts, onAccountsChange]);

  const addAccount = () => {
    // Map category to specific account type
    const getAccountTypeFromCategory = (categoryId: string, isLiability: boolean): AccountType => {
      if (isLiability) {
        switch (categoryId) {
          case 'credit-cards': return 'credit-card';
          case 'loans': return 'loan';
          case 'mortgages': return 'mortgage';
          case 'other-liabilities': return 'other-liability';
          default: return 'other-liability';
        }
      } else {
        switch (categoryId) {
          case 'cash': return 'checking'; // Default bank accounts to checking
          case 'investments': return 'investment';
          case 'retirement': return 'retirement';
          case 'real-estate': return 'real-estate';
          case 'vehicles': return 'vehicle';
          case 'other-assets': return 'other-asset';
          default: return 'other-asset';
        }
      }
    };

    const newAccount: Account = {
      id: Date.now().toString(),
      name: '',
      type: getAccountTypeFromCategory(category.id, category.type === 'liability'),
      balance: 0,
      categoryId: category.id
    };
    setLocalAccounts([...localAccounts, newAccount]);
  };

  const updateAccount = (id: string, field: keyof Account, value: string | number) => {
    setLocalAccounts(accounts =>
      accounts.map(acc => {
        if (acc.id === id) {
          // Auto-convert negative values to positive for liability accounts
          if (field === 'balance' && category.type === 'liability' && typeof value === 'number' && value < 0) {
            value = Math.abs(value);
          }
          return { ...acc, [field]: value };
        }
        return acc;
      })
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
          <div style={{ display: 'grid', gridTemplateColumns: category.id === 'cash' ? '1fr 120px 150px auto' : '1fr 150px auto', gap: '12px', alignItems: 'end' }}>
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
            {category.id === 'cash' && (
              <div>
                <label className="form-label">Account Type</label>
                <select
                  className="form-input"
                  value={account.type}
                  onChange={(e) => updateAccount(account.id, 'type', e.target.value as AccountType)}
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </div>
            )}
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
        + Add {isNewAccountsOnly ? 'New ' : ''}{category.name.replace(/s$/, '')}
      </button>
    </div>
  );
}

function ExistingAccountsEntry({ category, accounts, previousAccounts, onAccountsChange }: ExistingAccountsEntryProps) {
  const [localAccounts, setLocalAccounts] = useState<Account[]>(accounts);

  useEffect(() => {
    onAccountsChange(localAccounts);
  }, [localAccounts, onAccountsChange]);

  const updateAccount = (id: string, field: keyof Account, value: string | number) => {
    setLocalAccounts(accounts =>
      accounts.map(acc => {
        if (acc.id === id) {
          // Auto-convert negative values to positive for liability accounts
          if (field === 'balance' && category.type === 'liability' && typeof value === 'number' && value < 0) {
            value = Math.abs(value);
          }
          return { ...acc, [field]: value };
        }
        return acc;
      })
    );
  };

  const removeAccount = (id: string) => {
    setLocalAccounts(accounts => accounts.filter(acc => acc.id !== id));
  };

  const getPreviousBalance = (accountName: string) => {
    const prevAccount = previousAccounts.find(acc => acc.name === accountName);
    return prevAccount?.balance || 0;
  };

  const getBalanceChange = (account: Account) => {
    const prevBalance = getPreviousBalance(account.name);
    const change = account.balance - prevBalance;
    return { change, prevBalance };
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      <h3>{category.icon} {category.name}</h3>
      <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '14px' }}>
        Update the current balances for your existing accounts. Previous balances are shown for reference.
      </p>

      {localAccounts.map(account => {
        const { change, prevBalance } = getBalanceChange(account);
        const hasChanged = change !== 0;
        
        return (
          <div key={account.id} className="account-entry">
            <div style={{ display: 'grid', gridTemplateColumns: category.id === 'cash' ? '1fr 120px 150px 150px auto' : '1fr 150px 150px auto', gap: '12px', alignItems: 'end' }}>
              <div>
                <label className="form-label">Account Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={account.name}
                  onChange={(e) => updateAccount(account.id, 'name', e.target.value)}
                />
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  From previous snapshot
                </div>
              </div>
              {category.id === 'cash' && (
                <div>
                  <label className="form-label">Account Type</label>
                  <select
                    className="form-input"
                    value={account.type}
                    onChange={(e) => updateAccount(account.id, 'type', e.target.value as AccountType)}
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                  </select>
                </div>
              )}
              <div>
                <label className="form-label">Previous Balance</label>
                <div style={{ 
                  padding: '8px 12px', 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  ${prevBalance.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="form-label">
                  Current {category.type === 'liability' ? 'Amount Owed' : 'Balance'}
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  value={account.balance || ''}
                  onChange={(e) => updateAccount(account.id, 'balance', parseFloat(e.target.value) || 0)}
                  style={{
                    borderColor: hasChanged ? (change > 0 ? '#10b981' : '#ef4444') : undefined
                  }}
                />
                {hasChanged && (
                  <div style={{ 
                    fontSize: '12px', 
                    marginTop: '4px',
                    color: change > 0 ? '#10b981' : '#ef4444',
                    fontWeight: 'bold'
                  }}>
                    {change > 0 ? '+' : ''}${change.toLocaleString()} change
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeAccount(account.id)}
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: '14px' }}
                title="Remove this account (it won't appear in this snapshot)"
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}

      {localAccounts.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          background: '#fef2f2',
          borderRadius: '8px',
          border: '1px solid #fecaca',
          color: '#dc2626'
        }}>
          All accounts from this category have been removed. They won't appear in this snapshot.
        </div>
      )}
    </div>
  );
}