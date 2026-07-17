import { useEffect, useRef, useState, useLayoutEffect } from "react";
import * as d3                  from "d3";
import type { ComplexNumber }   from "../../types/filter";
import { downloadSVG, downloadPNG } from "../../utils/download";

interface Props {
  poles: ComplexNumber[];
  zeros: ComplexNumber[];
  locusType: string;
  locusParams: Record<string, number>;
  filterType: string;
}

export function PoleZeroPlot({
  poles,
  zeros,
  locusType,
  locusParams,
  filterType,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, null, undefined> | null>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 280 });

  useLayoutEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 280
        });
      }
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDownload = (type: "svg" | "png") => {
    if (!svgRef.current) return;
    if (type === "svg") downloadSVG(svgRef.current, "pole_zero_plot");
    else downloadPNG(svgRef.current, "pole_zero_plot");
  };

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    // Get theme colors from CSS variables
    const style = getComputedStyle(document.documentElement);
    const colorBorder  = style.getPropertyValue("--color-border").trim() || "#262c3a";
    const colorMuted   = style.getPropertyValue("--color-text-muted").trim() || "#5e6679";
    const colorPole    = style.getPropertyValue("--color-error").trim() || "#ff4d6a";
    const colorZero    = style.getPropertyValue("--color-success").trim() || "#4dff9b";
    const colorBg      = style.getPropertyValue("--color-bg-elevated").trim() || "#1f242f";

    const W = dimensions.width;
    const H = dimensions.height;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top  - margin.bottom;

    // Set SVG viewBox and dimensions
    d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("width",  "100%")
      .attr("height", H);

    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Determine axis bounds
    const allX = [...poles, ...zeros].map((p) => p.real);
    const allY = [...poles, ...zeros].map((p) => p.imag);
    const xExtent = d3.extent(allX) as [number, number];
    const yExtent = d3.extent(allY) as [number, number];

    const xPad = Math.max(0.5, (xExtent[1] - (xExtent[0] || 0)) * 0.3);
    const yPad = Math.max(0.5, (yExtent[1] - (yExtent[0] || 0)) * 0.3);

    const xDomain: [number, number] = [
      Math.min(xExtent[0] || -1.2, -1.2) - xPad,
      Math.max(xExtent[1] ||  1.2,  1.2) + xPad,
    ];
    const yDomain: [number, number] = [
      Math.min(yExtent[0] || -1.2, -1.2) - yPad,
      Math.max(yExtent[1] ||  1.2,  1.2) + yPad,
    ];

    const xScale = d3.scaleLinear().domain(xDomain).range([0, innerW]);
    const yScale = d3.scaleLinear().domain(yDomain).range([innerH, 0]);

    // Defs & Grid paper patterns
    const defs = d3.select(svgRef.current).append("defs");
    
    // Minor pattern (10px spacing)
    const patMinor = defs.append("pattern")
      .attr("id", "pz-grid-minor")
      .attr("width", 10)
      .attr("height", 10)
      .attr("patternUnits", "userSpaceOnUse");
    patMinor.append("path")
      .attr("d", "M 10 0 L 0 0 0 10")
      .attr("fill", "none")
      .attr("stroke", colorBorder)
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.15);

    // Major pattern (50px spacing)
    const patMajor = defs.append("pattern")
      .attr("id", "pz-grid-major")
      .attr("width", 50)
      .attr("height", 50)
      .attr("patternUnits", "userSpaceOnUse");
    patMajor.append("rect")
      .attr("width", 50)
      .attr("height", 50)
      .attr("fill", "url(#pz-grid-minor)");
    patMajor.append("path")
      .attr("d", "M 50 0 L 0 0 0 50")
      .attr("fill", "none")
      .attr("stroke", colorBorder)
      .attr("stroke-width", 1)
      .attr("opacity", 0.3);

    // Render background engineering grid rect
    svg.append("rect")
       .attr("width", innerW)
       .attr("height", innerH)
       .attr("fill", "url(#pz-grid-major)");

    // Unit circle (if digital) or jw axis (if analog)
    if (filterType === "digital") {
      const circle = d3.arc()
        .innerRadius(xScale(1) - xScale(0))
        .outerRadius(xScale(1) - xScale(0) + 1)
        .startAngle(0)
        .endAngle(2 * Math.PI);
        
      svg.append("path")
         .attr("d", circle as unknown as (d: unknown) => string)
         .attr("transform", `translate(${xScale(0)},${yScale(0)})`)
         .attr("fill", "var(--color-plot-spec-line)")
         .attr("opacity", 0.3);
    } else {
      svg.append("line")
         .attr("x1", xScale(0)).attr("x2", xScale(0))
         .attr("y1", 0).attr("y2", innerH)
         .attr("stroke", "var(--color-plot-spec-line)")
         .attr("stroke-width", 1)
         .attr("opacity", 0.5);
      svg.append("line")
         .attr("x1", 0).attr("x2", innerW)
         .attr("y1", yScale(0)).attr("y2", yScale(0))
         .attr("stroke", "var(--color-plot-spec-line)")
         .attr("stroke-width", 1)
         .attr("opacity", 0.5);
    }

    // Tooltip
    if (!tooltipRef.current) {
      tooltipRef.current = d3.select(containerRef.current!)
        .append("div")
        .attr("class", "d3-tooltip")
        .style("position", "fixed")
        .style("background", colorBg)
        .style("border", `1px solid ${colorBorder}`)
        .style("border-radius", "8px")
        .style("padding", "8px 12px")
        .style("font-size", "11px")
        .style("font-family", "var(--font-mono)")
        .style("color", "var(--color-text-primary)")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", 100);
    }
    const tooltip = tooltipRef.current;

    // Zeros
    svg.selectAll(".zero")
       .data(zeros)
       .enter()
       .append("circle")
       .attr("class", "zero")
       .attr("cx", d => xScale(d.real))
       .attr("cy", d => yScale(d.imag))
       .attr("r", 5)
       .attr("fill", "none")
       .attr("stroke", colorZero)
       .attr("stroke-width", 2)
       .style("cursor", "pointer")
       .on("mouseover", function(this: SVGCircleElement, _e, d) {
         d3.select(this).attr("r", 7).attr("stroke-width", 3);
         tooltip.style("opacity", 1).html(`<b>Zero</b><br>σ: ${d.real.toFixed(4)}<br>jω: ${d.imag.toFixed(4)}`);
       })
       .on("mousemove", e => tooltip.style("left", (e.clientX + 10) + "px").style("top", (e.clientY - 40) + "px"))
       .on("mouseout", function(this: SVGCircleElement) {
         d3.select(this).attr("r", 5).attr("stroke-width", 2);
         tooltip.style("opacity", 0);
       });

    // Poles
    const poleGroup = svg.selectAll(".pole")
      .data(poles)
      .enter()
      .append("g")
      .attr("class", "pole")
      .attr("transform", d => `translate(${xScale(d.real)}, ${yScale(d.imag)})`)
      .style("cursor", "pointer");

    poleGroup.append("line").attr("x1", -5).attr("y1", -5).attr("x2", 5).attr("y2", 5).attr("stroke", colorPole).attr("stroke-width", 2);
    poleGroup.append("line").attr("x1", 5).attr("y1", -5).attr("x2", -5).attr("y2", 5).attr("stroke", colorPole).attr("stroke-width", 2);

    poleGroup.append("rect")
      .attr("x", -10).attr("y", -10).attr("width", 20).attr("height", 20)
      .attr("fill", "transparent")
      .on("mouseover", function(_e, d) {
        // @ts-expect-error - parentNode typings are not resolved by compile target
        d3.select(this.parentNode).selectAll("line").attr("stroke-width", 3).attr("x1", (v, i) => i === 0 ? -7 : 7).attr("y1", -7).attr("x2", (v, i) => i === 0 ? 7 : -7).attr("y2", 7);
        tooltip.style("opacity", 1).html(`<b>Pole</b><br>σ: ${d.real.toFixed(4)}<br>jω: ${d.imag.toFixed(4)}`);
      })
      .on("mousemove", e => tooltip.style("left", (e.clientX + 10) + "px").style("top", (e.clientY - 40) + "px"))
      .on("mouseout", function() {
        // @ts-expect-error - parentNode typings are not resolved by compile target
        d3.select(this.parentNode).selectAll("line").attr("stroke-width", 2).attr("x1", (v, i) => i === 0 ? -5 : 5).attr("y1", -5).attr("x2", (v, i) => i === 0 ? 5 : -5).attr("y2", 5);
        tooltip.style("opacity", 0);
      });

    // Axis Ticks
    const xAxis = d3.axisBottom(xScale).ticks(8).tickFormat(d => Number(d).toFixed(1));
    const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(d => Number(d).toFixed(1));

    svg.append("g").attr("transform", `translate(0,${innerH})`).call(xAxis).selectAll("text").style("font-size", "10px").attr("fill", colorMuted);
    svg.append("g").call(yAxis).selectAll("text").style("font-size", "10px").attr("fill", colorMuted);
    svg.selectAll(".domain, .tick line").attr("stroke", colorMuted);

    return () => {
      tooltipRef.current?.remove();
      tooltipRef.current = null;
    };
  }, [poles, zeros, locusType, locusParams, filterType, dimensions]);

  return (
    <div className="chart-container" ref={containerRef}>
      <div className="table-actions">
        <button className="icon-btn" onClick={() => handleDownload("svg")}>
          🔻 SVG
        </button>
        <button className="icon-btn" onClick={() => handleDownload("png")}>
          🖼️ PNG
        </button>
      </div>
      <svg ref={svgRef} />
    </div>
  );
}