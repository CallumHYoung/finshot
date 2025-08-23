import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Snapshot } from '../../types';
// no totals needed here currently

interface MetricsChartProps {
  snapshots: Snapshot[];
}

export default function MetricsChart({ snapshots }: MetricsChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  type DataPoint = { date: Date; dollarsPerHour: number; monthlyGain: number; portfolioChange: number };

  useEffect(() => {
    if (!snapshots.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 80, bottom: 40, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const data: DataPoint[] = [...snapshots]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .filter(snapshot => snapshot.metadata && snapshot.metadata.dollarsPerHour !== undefined)
      .map(snapshot => ({
        date: new Date(snapshot.date),
        dollarsPerHour: snapshot.metadata.dollarsPerHour || 0,
        monthlyGain: snapshot.metadata.monthlyGain || 0,
        portfolioChange: snapshot.metadata.portfolioChange || 0
      }));

    // Nothing to do with totals here directly, but keeping computeTotals available

    if (data.length === 0) {
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "#6b7280")
        .text("No metrics data available yet. Add more snapshots to see trends.");
      return;
    }

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(data, d => d.dollarsPerHour) as [number, number])
      .nice()
      .range([height, 0]);

    const line = d3
      .line<DataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.dollarsPerHour))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#8b5cf6")
      .attr("stroke-width", 3)
      .attr("d", line);

    g.selectAll(".dot")
      .data<DataPoint>(data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.dollarsPerHour))
      .attr("r", 5)
      .attr("fill", "#8b5cf6")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2);

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none");

    g.selectAll<SVGCircleElement, DataPoint>(".dot")
      .on("mouseover", function(event, d: DataPoint) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(`
          <div>Date: ${d.date.toLocaleDateString()}</div>
          <div>$/Hour: $${d.dollarsPerHour.toFixed(2)}</div>
          <div>Monthly Gain: $${d.monthlyGain.toLocaleString()}</div>
          <div>Portfolio Change: ${d.portfolioChange.toFixed(2)}%</div>
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %Y") as any) as any);

    const yAxis = d3.axisLeft(yScale).tickFormat((d: any) => `$${Number(d).toFixed(2)}`) as any;
    g.append("g").call(yAxis as any);

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Dollars Per Hour");

    const avgDollarsPerHour = d3.mean(data, d => d.dollarsPerHour) || 0;
    
    g.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", yScale(avgDollarsPerHour))
      .attr("y2", yScale(avgDollarsPerHour))
      .attr("stroke", "#10b981")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("opacity", 0.7);

    g.append("text")
      .attr("x", width - 5)
      .attr("y", yScale(avgDollarsPerHour) - 5)
      .attr("text-anchor", "end")
      .style("font-size", "12px")
      .style("fill", "#10b981")
      .text(`Avg: $${avgDollarsPerHour.toFixed(2)}/hr`);

    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  }, [snapshots]);

  return <svg ref={svgRef}></svg>;
}