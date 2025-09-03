import { useState, useEffect } from 'react';
import { DashboardModule, Snapshot, MetricModuleProps } from '../types';
import EmergencyFundModule from './metrics/EmergencyFundModule';
import AssetAllocationModule from './metrics/AssetAllocationModule';
import SavingsRateModule from './metrics/SavingsRateModule';
import FinancialIndependenceModule from './metrics/FinancialIndependenceModule';
import DebtToIncomeModule from './metrics/DebtToIncomeModule';
import './metrics/MetricModules.css';

// Component mapping to resolve component IDs to actual components
const COMPONENT_MAP: Record<string, React.ComponentType<MetricModuleProps>> = {
  'emergency-fund': EmergencyFundModule,
  'asset-allocation': AssetAllocationModule,
  'savings-rate': SavingsRateModule,
  'debt-to-income': DebtToIncomeModule,
  'financial-independence': FinancialIndependenceModule,
};

// Function to get component by ID
const getComponentById = (componentId: string) => {
  console.log('Looking for component with ID:', componentId, 'Type:', typeof componentId);
  
  // Handle undefined or invalid componentId
  if (!componentId || typeof componentId !== 'string' || componentId === 'undefined') {
    console.error(`Invalid componentId: "${componentId}"`);
    return null;
  }
  
  const Component = COMPONENT_MAP[componentId];
  if (!Component) {
    console.error(`Component with ID "${componentId}" not found`);
    console.log('Available component IDs:', Object.keys(COMPONENT_MAP));
    return null;
  }
  return Component;
};

interface ModularDashboardProps {
  snapshots: Snapshot[];
}

const DEFAULT_MODULES: DashboardModule[] = [
  {
    id: 'emergency-fund',
    title: 'Emergency Fund Coverage',
    componentId: 'emergency-fund',
    enabled: true,
    position: 0,
    size: 'medium'
  },
  {
    id: 'asset-allocation',
    title: 'Asset Allocation',
    componentId: 'asset-allocation',
    enabled: true,
    position: 1,
    size: 'medium'
  },
  {
    id: 'savings-rate',
    title: 'Savings Rate',
    componentId: 'savings-rate',
    enabled: true,
    position: 2,
    size: 'medium'
  },
  {
    id: 'debt-to-income',
    title: 'Debt-to-Income Ratio',
    componentId: 'debt-to-income',
    enabled: false,
    position: 3,
    size: 'medium'
  },
  {
    id: 'financial-independence',
    title: 'Financial Independence',
    componentId: 'financial-independence',
    enabled: true,
    position: 4,
    size: 'large'
  }
];

export default function ModularDashboard({ snapshots }: ModularDashboardProps) {
  const [modules, setModules] = useState<DashboardModule[]>(() => {
    // Load from localStorage if available
    const stored = localStorage.getItem('dashboard-modules');
    console.log('Raw stored data:', stored);
    if (stored) {
      try {
        const parsedModules = JSON.parse(stored);
        console.log('Parsed modules:', parsedModules);
        
        // Check if this is the old format or has invalid data
        if (parsedModules.length > 0) {
          const hasInvalidData = parsedModules.some((module: any) => {
            // Check for old format (component property) or missing/invalid componentId
            return (
              module.component !== undefined || 
              !module.componentId || 
              module.componentId === 'undefined' ||
              typeof module.componentId !== 'string'
            );
          });
          
          if (hasInvalidData) {
            console.log('Old format or invalid data detected, using defaults');
            localStorage.removeItem('dashboard-modules');
            return DEFAULT_MODULES;
          }
        }
        return parsedModules;
      } catch {
        console.log('Failed to parse stored modules, using defaults');
        localStorage.removeItem('dashboard-modules');
        return DEFAULT_MODULES;
      }
    }
    console.log('No stored data, using defaults');
    return DEFAULT_MODULES;
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

  // Debug: Log the modules data
  console.log('Current modules:', modules);
  console.log('Enabled modules:', enabledModules);

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
    console.log('Resetting to defaults');
    localStorage.removeItem('dashboard-modules');
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
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="btn btn-danger"
            style={{ marginRight: '10px' }}
            title="Clear all localStorage and reload (dev helper)"
          >
            🗑️ Clear Storage
          </button>
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
            const Component = getComponentById(module.componentId);
            
            // Check if component was found
            if (!Component) {
              return (
                <div key={module.id} className="metric-module">
                  <div className="metric-header">
                    <h3>Error loading {module.title}</h3>
                  </div>
                  <div className="metric-content">
                    Component "{module.componentId}" not found
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
