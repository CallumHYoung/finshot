import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Snapshot } from '../../types';
// Backend now handles totals computation

interface NetWorthChartProps {
  snapshots: Snapshot[];
}

export default function NetWorthChart({ snapshots }: NetWorthChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  type DataPoint = { date: Date; netWorth: number; assets: number; liabilities: number };

  useEffect(() => {
    if (!svgRef.current || snapshots.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const sortedSnapshots = [...snapshots]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const data: DataPoint[] = sortedSnapshots.map(snapshot => {
      // Backend now recomputes totals, so use those directly
      return {
        date: new Date(snapshot.date),
        netWorth: snapshot.totalNetWorth,
        assets: snapshot.totalAssets,
        liabilities: snapshot.totalLiabilities
      };
    });

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const yExtent = d3.extent(data, d => d.netWorth) as [number, number];
    const yMin = Math.min(0, yExtent[0] ?? 0);
    const yMax = yExtent[1] ?? 0;
    const yScale = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .nice()
      .range([height, 0]);

    const line = d3
      .line<DataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.netWorth))
      .curve(d3.curveMonotoneX);

    const area = d3
      .area<DataPoint>()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.netWorth))
      .curve(d3.curveMonotoneX);

    const gradient = g
      .append("defs")
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", height)
      .attr("x2", 0).attr("y2", 0);

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#3b82f6")
      .attr("stop-opacity", 0.1);

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#3b82f6")
      .attr("stop-opacity", 0.8);

    g.append("path")
      .datum(data)
      .attr("fill", "url(#gradient)")
      .attr("d", area);

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 3)
      .attr("d", line);

    g.selectAll(".dot")
      .data<DataPoint>(data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.netWorth))
      .attr("r", 5)
      .attr("fill", "#3b82f6")
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
          <div>Net Worth: $${d.netWorth.toLocaleString()}</div>
          <div>Assets: $${d.assets.toLocaleString()}</div>
          <div>Liabilities: $${d.liabilities.toLocaleString()}</div>
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

    const yAxis = d3.axisLeft(yScale).tickFormat((d: any) => `$${(Number(d) / 1000).toFixed(0)}k`) as any;
    g.append("g").call(yAxis as any);

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Net Worth");

    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  }, [snapshots]);

  return <svg ref={svgRef}></svg>;
}