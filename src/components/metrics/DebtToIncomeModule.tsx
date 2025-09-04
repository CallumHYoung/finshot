import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MetricModuleProps } from '../../types';
import { isLiabilityAccount, buildCategoriesById, calculateConsistentMetrics } from '../../utils/finance';

export default function DebtToIncomeModule({ snapshots, className, onRemove, onEdit }: MetricModuleProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const calculateDebtToIncomeRatio = () => {
    if (!snapshots.length) return null;
    
    const latestSnapshot = snapshots[0];
    if (!latestSnapshot.accounts) return null;

    // Calculate total monthly debt payments (rough estimate: total liabilities / 360 months = 30 years)
    const totalLiabilities = latestSnapshot.accounts
      .filter(account => isLiabilityAccount(account))
      .reduce((sum, account) => sum + Math.abs(account.balance), 0);

    // Estimate monthly debt payments (simplified calculation)
    // For demonstration: assume 3% monthly interest rate and divide by number of months
    const estimatedMonthlyDebtPayment = totalLiabilities * 0.03;

    // Calculate monthly gain using consistent metrics calculation
    const categoriesById = buildCategoriesById();
    const previousSnapshot = snapshots.length >= 2 ? snapshots[1] : undefined;
    const consistentMetrics = calculateConsistentMetrics(latestSnapshot, previousSnapshot, categoriesById);
    const monthlyGain = consistentMetrics.monthlyGain || 0;
    
    // Estimate monthly income from net worth growth (very rough estimation)
    // This is a placeholder - in real app, user would input their monthly income
    const estimatedMonthlyIncome = Math.abs(monthlyGain) * 3; // Rough multiplier
    
    if (estimatedMonthlyIncome === 0) return null;
    
    const ratio = (estimatedMonthlyDebtPayment / estimatedMonthlyIncome) * 100;
    return {
      ratio: Math.min(ratio, 100), // Cap at 100%
      monthlyDebt: estimatedMonthlyDebtPayment,
      monthlyIncome: estimatedMonthlyIncome,
      totalLiabilities
    };
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const data = calculateDebtToIncomeRatio();
    if (!data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 280;
    const height = 200;
    const radius = Math.min(width, height) / 2 - 20;

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2 + 20})`);

    // Create gauge background
    const gaugeArc = d3.arc()
      .innerRadius(radius - 30)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);

    // Background arc
    g.append("path")
      .attr("d", gaugeArc as any)
      .attr("fill", "#e5e7eb");

    // Color scale for debt-to-income ratio
    const getColor = (ratio: number) => {
      if (ratio <= 20) return "#10b981"; // Green - Excellent
      if (ratio <= 36) return "#f59e0b"; // Yellow - Good  
      if (ratio <= 50) return "#ef4444"; // Red - Poor
      return "#7f1d1d"; // Dark red - Very poor
    };

    // Value arc
    const valueAngle = (data.ratio / 100) * Math.PI;
    const valueArc = d3.arc()
      .innerRadius(radius - 30)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(-Math.PI / 2 + valueAngle);

    g.append("path")
      .attr("d", valueArc as any)
      .attr("fill", getColor(data.ratio));

    // Add text in center
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-10px")
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .style("fill", getColor(data.ratio))
      .text(`${data.ratio.toFixed(1)}%`);

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "10px")
      .style("font-size", "12px")
      .style("fill", "#6b7280")
      .text("Debt-to-Income");

    // Add status labels
    const statusLabels = [
      { angle: -Math.PI / 2, text: "0%", color: "#10b981" },
      { angle: -Math.PI / 4, text: "25%", color: "#f59e0b" },
      { angle: 0, text: "50%", color: "#ef4444" },
      { angle: Math.PI / 4, text: "75%", color: "#7f1d1d" },
      { angle: Math.PI / 2, text: "100%", color: "#7f1d1d" }
    ];

    statusLabels.forEach(label => {
      const x = Math.cos(label.angle) * (radius + 15);
      const y = Math.sin(label.angle) * (radius + 15);
      
      g.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", label.color)
        .text(label.text);
    });

  }, [snapshots]);

  const data = calculateDebtToIncomeRatio();



  return (
    <div className={`metric-module ${className || ''}`}>
      <div className="metric-header">
        <div>
          <h3>Debt-to-Income Ratio</h3>
          <p className="metric-description">
            Percentage of income used for debt payments
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
        {data ? (
          <>
            <div className="metric-visualization">
              <svg ref={svgRef}></svg>
            </div>
            <div className="metric-details">
              <div className="metric-breakdown">
                <div>Total Liabilities: ${data.totalLiabilities.toLocaleString()}</div>
                <div>Est. Monthly Debt: ${data.monthlyDebt.toLocaleString()}</div>
                <div>Est. Monthly Income: ${data.monthlyIncome.toLocaleString()}</div>
              </div>

            </div>
          </>
        ) : (
          <div className="metric-no-data">
            <p>Not enough data to calculate debt-to-income ratio.</p>
            <p>Add more snapshots with liability accounts to see this metric.</p>
          </div>
        )}
      </div>
    </div>
  );
}
