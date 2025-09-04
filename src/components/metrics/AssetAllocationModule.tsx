import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MetricModuleProps } from '../../types';
import { accountCategories } from '../../data/categories';
import { isLiabilityAccount } from '../../utils/finance';

export default function AssetAllocationModule({ snapshots, className, onRemove, onEdit }: MetricModuleProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const calculateAssetAllocation = () => {
    if (!snapshots.length) return null;
    
    const latestSnapshot = snapshots[0];
    if (!latestSnapshot.accounts) return null;

    const allocation = {
      cash: 0,
      investments: 0,
      retirement: 0,
      realEstate: 0,
      vehicles: 0,
      otherAssets: 0
    };

    let totalAssets = 0;

    latestSnapshot.accounts.forEach(account => {
      // Use standardized logic to determine if account is an asset
      if (!isLiabilityAccount(account) && account.balance > 0) {
        totalAssets += account.balance;
        
        const category = accountCategories.find(cat => cat.id === account.categoryId);
        if (category) {
          switch (category.id) {
            case 'cash':
              allocation.cash += account.balance;
              break;
            case 'investments':
              allocation.investments += account.balance;
              break;
            case 'retirement':
              allocation.retirement += account.balance;
              break;
            case 'real-estate':
              allocation.realEstate += account.balance;
              break;
            case 'vehicles':
              allocation.vehicles += account.balance;
              break;
            case 'other-assets':
              allocation.otherAssets += account.balance;
              break;
          }
        }
      }
    });

    if (totalAssets === 0) return null;

    // Convert to percentages
    const percentageAllocation = Object.entries(allocation).map(([key, value]) => ({
      category: key,
      value: (value / totalAssets) * 100,
      amount: value
    })).filter(item => item.value > 0);

    return {
      allocation: percentageAllocation,
      totalAssets,
      raw: allocation
    };
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const data = calculateAssetAllocation();
    if (!data || data.allocation.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 300;
    const height = 250;
    const radius = Math.min(width, height) / 2 - 20;

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal()
      .domain(data.allocation.map(d => d.category))
      .range([
        "#3b82f6", // cash - blue
        "#10b981", // investments - green  
        "#8b5cf6", // retirement - purple
        "#f59e0b", // realEstate - yellow
        "#ef4444", // vehicles - red
        "#6b7280"  // otherAssets - gray
      ]);

    const pie = d3.pie<any>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(40)
      .outerRadius(radius);

    const arcs = g.selectAll(".arc")
      .data(pie(data.allocation))
      .enter().append("g")
      .attr("class", "arc");

    arcs.append("path")
      .attr("d", arc as any)
      .attr("fill", (d: any) => color(d.data.category) as string)
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    // Add percentage labels
    arcs.append("text")
      .attr("transform", (d: any) => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .text((d: any) => d.data.value >= 5 ? `${d.data.value.toFixed(1)}%` : '');

    // Add center text
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-5px")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "#374151")
      .text("Asset");
      
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "15px")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "#374151")
      .text("Allocation");

  }, [snapshots]);

  const data = calculateAssetAllocation();

  const categoryLabels: Record<string, string> = {
    cash: "💰 Cash & Bank",
    investments: "📈 Investments", 
    retirement: "🏦 Retirement",
    realEstate: "🏠 Real Estate",
    vehicles: "🚗 Vehicles",
    otherAssets: "💎 Other Assets"
  };



  return (
    <div className={`metric-module ${className || ''}`}>
      <div className="metric-header">
        <div>
          <h3>Asset Allocation</h3>
          <p className="metric-description">
            Distribution of assets across categories
          </p>
        </div>
        <div className="metric-actions">
          {onEdit && (
            <button onClick={onEdit} className="btn-icon" title="Edit">
              ⚙️
            </button>
          )}
          {onRemove && (
            <button onClick={onRemove} className="btn-icon" title="Remove">
              ✕
            </button>
          )}
        </div>
      </div>
      
      <div className="metric-content">
        {data && data.allocation.length > 0 ? (
          <>
            <div className="metric-visualization">
              <svg ref={svgRef}></svg>
            </div>
            
            <div className="metric-details">
              <div className="allocation-legend">
                {data.allocation.map((item, index) => (
                  <div key={item.category} className="allocation-item">
                    <div 
                      className="allocation-color" 
                      style={{ 
                        backgroundColor: [
                          "#3b82f6", "#10b981", "#8b5cf6", 
                          "#f59e0b", "#ef4444", "#6b7280"
                        ][index] 
                      }}
                    />
                    <span className="allocation-label">
                      {categoryLabels[item.category]}
                    </span>
                    <span className="allocation-value">
                      {item.value.toFixed(1)}% (${item.amount.toLocaleString()})
                    </span>
                  </div>
                ))}
              </div>
              <div className="metric-summary">
                <div>Total Assets: ${data.totalAssets.toLocaleString()}</div>
              </div>

            </div>
          </>
        ) : (
          <div className="metric-no-data">
            <p>Not enough asset data to show allocation.</p>
            <p>Add snapshots with various asset accounts to see this metric.</p>
          </div>
        )}
      </div>
    </div>
  );
}
