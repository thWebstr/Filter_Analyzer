import { useEffect, useRef }       from "react";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, null, undefined> | null>(null);

  const handleDownload = (type: "svg" | "png") => {
    if (!svgRef.current) return;
    if (type === "svg") downloadSVG(svgRef.current, "pole_zero_plot");
    else downloadPNG(svgRef.current, "pole_zero_plot");
  };

  useEffect(() => {
    if (!svgRef.current) return;

    // Get theme colors from CSS variables
    const style = getComputedStyle(document.documentElement);
    const colorBorder  = style.getPropertyValue("--color-border").trim() || "#262c3a";
    const colorMuted   = style.getPropertyValue("--color-text-muted").trim() || "#5e6679";
    const colorPole    = style.getPropertyValue("--color-error").trim() || "#ff4d6a";
    const colorZero    = style.getPropertyValue("--color-success").trim() || "#4dff9b";
    const colorLocus   = style.getPropertyValue("--color-warning").trim() || "#ffb347";
    const colorBg      = style.getPropertyValue("--color-bg-elevated").trim() || "#1f242f";

    const W = containerRef.current?.clientWidth || 400;
    const H = 280;
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

    const xPad = Math.max(0.5, (xExtent[1] - xExtent[0]) * 0.3);
    const yPad = Math.max(0.5, (yExtent[1] - yExtent[0]) * 0.3);

    const xDomain: [number, number] = [
      Math.min(xExtent[0] - xPad, -1.2),
      Math.max(xExtent[1] + xPad,  1.2),
    ];
    const yDomain: [number, number] = [
      Math.min(yExtent[0] - yPad, -1.2),
      Math.max(yExtent[1] + yPad,  1.2),
    ];

    const xScale = d3.scaleLinear().domain(xDomain).range([0, innerW]);
    const yScale = d3.scaleLinear().domain(yDomain).range([innerH, 0]);

    // Grid
    const makeGrid = (scale: d3.AxisScale<any>, orient: "bottom" | "left") =>
      (orient === "bottom" ? d3.axisBottom(scale) : d3.axisLeft(scale))
        .ticks(8)
        .tickSize(- (orient === "bottom" ? innerH : innerW))
        .tickFormat(() => "");

    svg.append("g")
       .attr("class", "pz-grid")
       .attr("transform", `translate(0,${innerH})`)
       .call(makeGrid(xScale, "bottom"))
       .attr("stroke", colorBorder)
       .attr("opacity", 0.3);

    svg.append("g")
       .attr("class", "pz-grid")
       .call(makeGrid(yScale, "left"))
       .attr("stroke", colorBorder)
       .attr("opacity", 0.3);

    // Axes through origin
    const x0 = xScale(0);
    const y0 = yScale(0);

    svg.append("line")
       .attr("x1", 0).attr("x2", innerW)
       .attr("y1", y0).attr("y2", y0)
       .attr("stroke", colorMuted)
       .attr("stroke-width", 1);

    svg.append("line")
       .attr("x1", x0).attr("x2", x0)
       .attr("y1", 0) .attr("y2", innerH)
       .attr("stroke", colorMuted)
       .attr("stroke-width", 1);

    // Unit circle (Digital)
    if (filterType === "digital") {
      const r = Math.abs(xScale(1) - xScale(0));
      svg.append("circle")
         .attr("cx", x0)
         .attr("cy", y0)
         .attr("r",  r)
         .attr("fill", "none")
         .attr("stroke", colorMuted)
         .attr("stroke-width", 1.5)
         .attr("stroke-dasharray", "4,4")
         .attr("opacity", 0.6);
    }

    // Locus (Analog Chebyshev/Elliptic)
    if (locusType === "circle" && locusParams.radius) {
      const r = Math.abs(xScale(locusParams.radius) - xScale(0));
      svg.append("circle")
         .attr("cx", x0).attr("cy", y0).attr("r", r)
         .attr("fill", "none").attr("stroke", colorLocus)
         .attr("stroke-width", 1).attr("stroke-dasharray", "3,3")
         .attr("opacity", 0.5);
    } else if (locusType === "ellipse" && locusParams.minor_axis) {
      const rx = Math.abs(xScale(locusParams.minor_axis) - xScale(0));
      const ry = Math.abs(yScale(locusParams.major_axis) - yScale(0));
      svg.append("ellipse")
         .attr("cx", x0).attr("cy", y0).attr("rx", rx).attr("ry", ry)
         .attr("fill", "none").attr("stroke", colorLocus)
         .attr("stroke-width", 1).attr("stroke-dasharray", "3,3")
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
       .on("mouseover", function(e, d) {
         d3.select(this).attr("r", 7).attr("stroke-width", 3);
         tooltip.style("opacity", 1).html(`<b>Zero</b><br>σ: ${d.real.toFixed(4)}<br>jω: ${d.imag.toFixed(4)}`);
       })
       .on("mousemove", e => tooltip.style("left", (e.clientX + 10) + "px").style("top", (e.clientY - 40) + "px"))
       .on("mouseout", function() {
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
      .on("mouseover", function(e, d) {
        d3.select(this.parentNode as any).selectAll("line").attr("stroke-width", 3).attr("x1", (v, i) => i === 0 ? -7 : 7).attr("y1", -7).attr("x2", (v, i) => i === 0 ? 7 : -7).attr("y2", 7);
        tooltip.style("opacity", 1).html(`<b>Pole</b><br>σ: ${d.real.toFixed(4)}<br>jω: ${d.imag.toFixed(4)}`);
      })
      .on("mousemove", e => tooltip.style("left", (e.clientX + 10) + "px").style("top", (e.clientY - 40) + "px"))
      .on("mouseout", function() {
        d3.select(this.parentNode as any).selectAll("line").attr("stroke-width", 2).attr("x1", (v, i) => i === 0 ? -5 : 5).attr("y1", -5).attr("x2", (v, i) => i === 0 ? 5 : -5).attr("y2", 5);
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
  }, [poles, zeros, locusType, locusParams, filterType]);

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