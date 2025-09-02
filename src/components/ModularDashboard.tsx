import { useState, useEffect } from 'react';
import { DashboardModule, Snapshot } from '../types';
// Testing imports one by one to identify the problematic component
import EmergencyFundModule from './metrics/EmergencyFundModule';
import AssetAllocationModule from './metrics/AssetAllocationModule';
import SavingsRateModule from './metrics/SavingsRateModule';
import FinancialIndependenceModule from './metrics/FinancialIndependenceModule';
// import DebtToIncomeModule from './metrics/DebtToIncomeModule';
import './metrics/MetricModules.css';

// Debug: Check if all components are imported correctly
console.log('Component imports:', {
  // DebtToIncomeModule,
  EmergencyFundModule,
  AssetAllocationModule,
  SavingsRateModule,
  FinancialIndependenceModule
});

// Temporary placeholder for testing
const DebtToIncomeModule = () => <div>DebtToIncomeModule placeholder</div>;

interface ModularDashboardProps {
  snapshots: Snapshot[];
}

const DEFAULT_MODULES: DashboardModule[] = [
  {
    id: 'emergency-fund',
    title: 'Emergency Fund Coverage',
    component: EmergencyFundModule,
    enabled: true,
    position: 0,
    size: 'medium'
  },
  {
    id: 'asset-allocation',
    title: 'Asset Allocation',
    component: AssetAllocationModule,
    enabled: true,
    position: 1,
    size: 'medium'
  },
  {
    id: 'savings-rate',
    title: 'Savings Rate',
    component: SavingsRateModule,
    enabled: true,
    position: 2,
    size: 'medium'
  },
  {
    id: 'debt-to-income',
    title: 'Debt-to-Income Ratio',
    component: DebtToIncomeModule,
    enabled: false,
    position: 3,
    size: 'medium'
  },
  {
    id: 'financial-independence',
    title: 'Financial Independence',
    component: FinancialIndependenceModule,
    enabled: true,
    position: 4,
    size: 'large'
  }
];

export default function ModularDashboard({ snapshots }: ModularDashboardProps) {
  const [modules, setModules] = useState<DashboardModule[]>(() => {
    // Load from localStorage if available
    const stored = localStorage.getItem('dashboard-modules');
    return stored ? JSON.parse(stored) : DEFAULT_MODULES;
  });
  
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [draggedModule, setDraggedModule] = useState<string | null>(null);

  // Save to localStorage whenever modules change
  useEffect(() => {
    localStorage.setItem('dashboard-modules', JSON.stringify(modules));
  }, [modules]);

  const enabledModules = modules
    .filter(module => module.enabled)
    .sort((a, b) => a.position - b.position);

  const toggleModule = (id: string) => {
    setModules(prev => prev.map(module => 
      module.id === id 
        ? { ...module, enabled: !module.enabled }
        : module
    ));
  };

  const removeModule = (id: string) => {
    setModules(prev => prev.map(module => 
      module.id === id 
        ? { ...module, enabled: false }
        : module
    ));
  };

  const reorderModules = (draggedId: string, targetId: string) => {
    const draggedIndex = enabledModules.findIndex(m => m.id === draggedId);
    const targetIndex = enabledModules.findIndex(m => m.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newModules = [...modules];
    const draggedModule = enabledModules[draggedIndex];
    const targetModule = enabledModules[targetIndex];
    
    // Swap positions
    const draggedModuleIndex = newModules.findIndex(m => m.id === draggedId);
    const targetModuleIndex = newModules.findIndex(m => m.id === targetId);
    
    newModules[draggedModuleIndex] = { ...draggedModule, position: targetModule.position };
    newModules[targetModuleIndex] = { ...targetModule, position: draggedModule.position };
    
    setModules(newModules);
  };

  const resetToDefaults = () => {
    setModules(DEFAULT_MODULES);
  };

  const handleDragStart = (e: React.DragEvent, moduleId: string) => {
    setDraggedModule(moduleId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedModule && draggedModule !== targetId) {
      reorderModules(draggedModule, targetId);
    }
    setDraggedModule(null);
  };

  const getGridClass = (size: string) => {
    switch (size) {
      case 'small': return 'metric-grid-small';
      case 'large': return 'metric-grid-large';
      default: return 'metric-grid-medium';
    }
  };

  return (
    <div className="modular-dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Financial Metrics Dashboard</h2>
          <p>Track the metrics that matter most to your financial health</p>
        </div>
        <div className="dashboard-actions">
          <button 
            onClick={() => setShowCustomizer(!showCustomizer)}
            className="btn btn-secondary"
          >
            🎛️ Customize
          </button>
        </div>
      </div>

      {showCustomizer && (
        <div className="dashboard-customizer">
          <div className="customizer-header">
            <h3>Customize Your Dashboard</h3>
            <button 
              onClick={() => setShowCustomizer(false)}
              className="btn-close"
            >
              ✕
            </button>
          </div>
          
          <div className="customizer-content">
            <div className="module-toggles">
              <h4>Available Metrics:</h4>
              {modules.map(module => (
                <label key={module.id} className="module-toggle">
                  <input
                    type="checkbox"
                    checked={module.enabled}
                    onChange={() => toggleModule(module.id)}
                  />
                  <span>{module.title}</span>
                </label>
              ))}
            </div>
            
            <div className="customizer-actions">
              <button 
                onClick={resetToDefaults}
                className="btn btn-secondary"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="metrics-grid">
        {enabledModules.length > 0 ? (
          enabledModules.map(module => {
            const Component = module.component;
            
            // Debug: Check if component is undefined
            if (!Component) {
              console.error(`Component for module ${module.id} is undefined`);
              return (
                <div key={module.id} className="metric-module">
                  <div className="metric-header">
                    <h3>Error loading {module.title}</h3>
                  </div>
                  <div className="metric-content">
                    Component for {module.id} is undefined
                  </div>
                </div>
              );
            }
            
            return (
              <div
                key={module.id}
                className={`metric-grid-item ${getGridClass(module.size)}`}
                draggable
                onDragStart={(e) => handleDragStart(e, module.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, module.id)}
              >
                <Component
                  snapshots={snapshots}
                  className=""
                  onRemove={() => removeModule(module.id)}
                  onEdit={() => setShowCustomizer(true)}
                />
              </div>
            );
          })
        ) : (
          <div className="no-metrics">
            <h3>No metrics selected</h3>
            <p>Click "Customize" to add financial metrics to your dashboard.</p>
            <button 
              onClick={() => setShowCustomizer(true)}
              className="btn btn-primary"
            >
              Add Metrics
            </button>
          </div>
        )}
      </div>

      {enabledModules.length > 0 && (
        <div className="dashboard-footer">
          <p className="dashboard-note">
            💡 Tip: Drag and drop metrics to reorder them. Click the customize button to add or remove metrics.
          </p>
        </div>
      )}
    </div>
  );
}
