import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { ComplexNumber } from "../../types/filter";

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, null, undefined> | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const W = svgRef.current.clientWidth  || 400;
    const H = svgRef.current.clientHeight || 280;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top  - margin.bottom;

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
      Math.min(xExtent[0] - xPad, -1.5),
      Math.max(xExtent[1] + xPad,  1.5),
    ];
    const yDomain: [number, number] = [
      Math.min(yExtent[0] - yPad, -1.5),
      Math.max(yExtent[1] + yPad,  1.5),
    ];

    const xScale = d3.scaleLinear().domain(xDomain).range([0, innerW]);
    const yScale = d3.scaleLinear().domain(yDomain).range([innerH, 0]);

    // Grid
    svg
      .append("g")
      .attr("class", "grid")
      .selectAll("line.vertical")
      .data(xScale.ticks(6))
      .enter()
      .append("line")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
      .attr("y1", 0)
      .attr("y2", innerH)
      .attr("stroke", "#252A3A")
      .attr("stroke-width", 0.5);

    svg
      .append("g")
      .selectAll("line.horizontal")
      .data(yScale.ticks(6))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerW)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "#252A3A")
      .attr("stroke-width", 0.5);

    // Axes through origin
    const x0 = xScale(0);
    const y0 = yScale(0);

    svg
      .append("line")
      .attr("x1", 0).attr("x2", innerW)
      .attr("y1", y0).attr("y2", y0)
      .attr("stroke", "#4A5068")
      .attr("stroke-width", 1);

    svg
      .append("line")
      .attr("x1", x0).attr("x2", x0)
      .attr("y1", 0) .attr("y2", innerH)
      .attr("stroke", "#4A5068")
      .attr("stroke-width", 1);

    // Axis labels
    svg
      .append("text")
      .attr("x", innerW - 4)
      .attr("y", y0 - 6)
      .attr("fill", "#4A5068")
      .attr("font-size", 9)
      .attr("text-anchor", "end")
      .text("σ");

    svg
      .append("text")
      .attr("x", x0 + 6)
      .attr("y", 10)
      .attr("fill", "#4A5068")
      .attr("font-size", 9)
      .text("jω");

    // Unit circle for digital filters
    if (filterType === "digital") {
      const r = Math.abs(xScale(1) - xScale(0));
      svg
        .append("circle")
        .attr("cx", x0)
        .attr("cy", y0)
        .attr("r",  r)
        .attr("fill", "none")
        .attr("stroke", "#252A3A")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,3");
    }

    // Locus (circle or ellipse)
    if (locusType === "circle" && locusParams.radius) {
      const r = Math.abs(xScale(locusParams.radius) - xScale(0));
      svg
        .append("circle")
        .attr("cx", x0)
        .attr("cy", y0)
        .attr("r",  r)
        .attr("fill", "none")
        .attr("stroke", "#FFB347")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,3")
        .attr("opacity", 0.5);
    } else if (locusType === "ellipse" && locusParams.minor_axis) {
      const rx = Math.abs(xScale(locusParams.minor_axis) - xScale(0));
      const ry = Math.abs(yScale(0) - yScale(locusParams.major_axis));
      svg
        .append("ellipse")
        .attr("cx", x0)
        .attr("cy", y0)
        .attr("rx", rx)
        .attr("ry", ry)
        .attr("fill", "none")
        .attr("stroke", "#FFB347")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,3")
        .attr("opacity", 0.5);
    }

    // Tooltip div — created once, reused across re-renders to prevent DOM accumulation
    if (!tooltipRef.current) {
      tooltipRef.current = d3
        .select(wrapperRef.current!)
        .append("div")
        .style("position",   "fixed")
        .style("background", "var(--color-bg-elevated)")
        .style("border",     "1px solid var(--color-border)")
        .style("border-radius", "6px")
        .style("padding",    "6px 10px")
        .style("font-size",  "11px")
        .style("font-family","IBM Plex Mono, monospace")
        .style("color",      "var(--color-text-primary)")
        .style("pointer-events", "none")
        .style("opacity", "0")
        .style("transition", "opacity 150ms ease")
        .style("z-index", "1000");
    }
    const tooltip = tooltipRef.current;

    // Zeros — open circles
    svg
      .selectAll("circle.zero")
      .data(zeros)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.real))
      .attr("cy", (d) => yScale(d.imag))
      .attr("r",  5)
      .attr("fill",   "none")
      .attr("stroke", "#4DFF9B")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function (_event, d) {
        d3.select(this).attr("r", 7);
        tooltip
          .style("opacity", "1")
          .html(`Zero<br>σ = ${d.real.toFixed(4)}<br>jω = ${d.imag.toFixed(4)}`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.clientX + 12}px`)
          .style("top",  `${event.clientY - 28}px`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 5);
        tooltip.style("opacity", "0");
      });

    // Poles — × markers
    svg
      .selectAll("g.pole")
      .data(poles)
      .enter()
      .append("g")
      .attr("class", "pole")
      .attr("transform", (d) => `translate(${xScale(d.real)},${yScale(d.imag)})`)
      .style("cursor", "pointer")
      .each(function (d) {
        const g = d3.select(this);
        const s = 5;
        g.append("line")
          .attr("x1", -s).attr("y1", -s)
          .attr("x2",  s).attr("y2",  s)
          .attr("stroke", "#FF4D6A")
          .attr("stroke-width", 2)
          .attr("stroke-linecap", "round");
        g.append("line")
          .attr("x1",  s).attr("y1", -s)
          .attr("x2", -s).attr("y2",  s)
          .attr("stroke", "#FF4D6A")
          .attr("stroke-width", 2)
          .attr("stroke-linecap", "round");

        // Invisible hit area
        g.append("circle")
          .attr("r", 10)
          .attr("fill", "transparent")
          .on("mouseover", function () {
            g.selectAll("line")
              .attr("stroke-width", 3)
              .attr("x1", (_, i) => i === 0 ? -7 :  7)
              .attr("y1", (_, i) => i === 0 ? -7 : -7)
              .attr("x2", (_, i) => i === 0 ?  7 : -7)
              .attr("y2", (_, i) => i === 0 ?  7 :  7);
            tooltip
              .style("opacity", "1")
              .html(`Pole<br>σ = ${d.real.toFixed(4)}<br>jω = ${d.imag.toFixed(4)}`);
          })
          .on("mousemove", (event) => {
            tooltip
              .style("left", `${event.clientX + 12}px`)
              .style("top",  `${event.clientY - 28}px`);
          })
          .on("mouseout", function () {
            g.selectAll("line")
              .attr("stroke-width", 2)
              .attr("x1", (_, i) => i === 0 ? -5 :  5)
              .attr("y1", (_, i) => i === 0 ? -5 : -5)
              .attr("x2", (_, i) => i === 0 ?  5 : -5)
              .attr("y2", (_, i) => i === 0 ?  5 :  5);
            tooltip.style("opacity", "0");
          });
      });

    // X axis ticks
    svg
      .append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickSize(3)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .tickFormat((d: any) => Number(d).toFixed(1))
      )
      .call((g) => {
        g.select(".domain").attr("stroke", "#4A5068");
        g.selectAll("text")
          .attr("fill", "#4A5068")
          .attr("font-size", 9);
        g.selectAll(".tick line").attr("stroke", "#4A5068");
      });

    // Y axis ticks
    svg
      .append("g")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(6)
          .tickSize(3)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .tickFormat((d: any) => Number(d).toFixed(1))
      )
      .call((g) => {
        g.select(".domain").attr("stroke", "#4A5068");
        g.selectAll("text")
          .attr("fill", "#4A5068")
          .attr("font-size", 9);
        g.selectAll(".tick line").attr("stroke", "#4A5068");
      });

    // Only remove tooltip on true component unmount (no-op on deps change)
    return () => {
      tooltipRef.current?.remove();
      tooltipRef.current = null;
    };
  }, [poles, zeros, locusType, locusParams, filterType]);

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        width="100%"
        height={280}
        className="pz-plot-svg"
      />
    </div>
  );
}