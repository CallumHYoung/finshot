import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MetricModuleProps } from '../../types';
import { buildCategoriesById, calculateConsistentMetrics } from '../../utils/finance';

export default function SavingsRateModule({ snapshots, className, onRemove, onEdit }: MetricModuleProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const calculateSavingsRate = () => {
    if (snapshots.length < 2) return null;
    
    const categoriesById = buildCategoriesById();
    
    // Get recent snapshots for trend analysis
    const recentSnapshots = snapshots.slice(0, 6).reverse(); // Last 6 months
    
    const savingsData = recentSnapshots.map((snapshot, index) => {
      // Calculate monthly gain using consistent metrics calculation
      const previousSnapshot = index > 0 ? recentSnapshots[index - 1] : undefined;
      const consistentMetrics = calculateConsistentMetrics(snapshot, previousSnapshot, categoriesById);
      const monthlyGain = consistentMetrics.monthlyGain || 0;
      
      // Rough estimate of monthly income based on net worth change
      // In real app, user would input their actual income
      const estimatedIncome = Math.abs(monthlyGain) * 3; // Rough multiplier
      
      const savingsRate = estimatedIncome > 0 ? (monthlyGain / estimatedIncome) * 100 : 0;
      
      return {
        date: new Date(snapshot.date),
        monthlyGain,
        estimatedIncome,
        savingsRate: Math.max(0, Math.min(100, savingsRate)) // Clamp between 0-100%
      };
    });

    const latestRate = savingsData[savingsData.length - 1]?.savingsRate || 0;
    const averageRate = savingsData.reduce((sum, d) => sum + d.savingsRate, 0) / savingsData.length;
    
    return {
      current: latestRate,
      average: averageRate,
      trend: savingsData,
      latestIncome: savingsData[savingsData.length - 1]?.estimatedIncome || 0,
      latestSavings: savingsData[savingsData.length - 1]?.monthlyGain || 0
    };
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const data = calculateSavingsRate();
    if (!data || data.trend.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = 350 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(data.trend.map((_, i) => i.toString()))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, Math.max(25, d3.max(data.trend, d => d.savingsRate) || 0)])
      .nice()
      .range([height, 0]);

    // Add bars
    g.selectAll(".bar")
      .data(data.trend)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", (_, i) => xScale(i.toString()) || 0)
      .attr("width", xScale.bandwidth())
      .attr("y", d => yScale(d.savingsRate))
      .attr("height", d => height - yScale(d.savingsRate))
      .attr("fill", d => {
        if (d.savingsRate >= 20) return "#10b981"; // Green - Excellent
        if (d.savingsRate >= 10) return "#f59e0b"; // Yellow - Good
        if (d.savingsRate >= 5) return "#ef4444";  // Red - Fair
        return "#7f1d1d"; // Dark red - Poor
      });

    // Add average line
    g.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", yScale(data.average))
      .attr("y2", yScale(data.average))
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");

    g.append("text")
      .attr("x", width - 5)
      .attr("y", yScale(data.average) - 5)
      .attr("text-anchor", "end")
      .style("font-size", "12px")
      .style("fill", "#3b82f6")
      .text(`Avg: ${data.average.toFixed(1)}%`);

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat((_, i) => {
        const date = data.trend[i]?.date;
        return date ? d3.timeFormat("%b")(date) : '';
      }));

    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`));

    // Y-axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Savings Rate (%)");

  }, [snapshots]);

  const data = calculateSavingsRate();





  return (
    <div className={`metric-module ${className || ''}`}>
      <div className="metric-header">
        <div>
          <h3>Savings Rate</h3>
          <p className="metric-description">
            Percentage of income saved each month
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
        {data && data.trend.length > 0 ? (
          <>
            <div className="metric-main-stat">
              <div 
                className="metric-big-number" 
                style={{ color: '#10b981' }}
              >
                {data.current.toFixed(1)}%
              </div>
              <div className="metric-sub-text">
                Current Savings Rate
              </div>
            </div>
            
            <div className="metric-visualization">
              <svg ref={svgRef}></svg>
            </div>
            
            <div className="metric-details">
              <div className="metric-breakdown">
                <div>Average Rate: {data.average.toFixed(1)}%</div>
                <div>Est. Monthly Income: ${data.latestIncome.toLocaleString()}</div>
                <div>Monthly Savings: ${data.latestSavings.toLocaleString()}</div>
              </div>

            </div>
          </>
        ) : (
          <div className="metric-no-data">
            <p>Not enough data to calculate savings rate.</p>
            <p>Add at least 2 snapshots to see savings trends.</p>
          </div>
        )}
      </div>
    </div>
  );
}
