/**
 * Download utility functions for plots and tables.
 */

/** Helper to clone SVG and resolve active document CSS variables to static colors. */
function cloneAndResolveSVG(svgEl: SVGSVGElement): SVGSVGElement {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  
  const origElements = Array.from(svgEl.querySelectorAll("*")) as SVGElement[];
  const cloneElements = Array.from(clone.querySelectorAll("*")) as SVGElement[];
  origElements.unshift(svgEl);
  cloneElements.unshift(clone);

  const docStyle = getComputedStyle(document.documentElement);
  const style = window.getComputedStyle(svgEl);
  let bg = style.backgroundColor;
  // If background is transparent/not defined, look up parent hierarchy or fallback to theme card color
  if (!bg || bg === "rgba(0, 0, 0, 0)" || bg === "transparent") {
    const parentStyle = svgEl.parentElement ? window.getComputedStyle(svgEl.parentElement) : null;
    bg = parentStyle?.backgroundColor || docStyle.getPropertyValue("--color-bg-card").trim() || "#181c25";
  }
  clone.style.backgroundColor = bg;

  origElements.forEach((orig, idx) => {
    const cloned = cloneElements[idx];
    if (!cloned) return;

    const elStyle = window.getComputedStyle(orig);
    const attrs = [
      "stroke",
      "fill",
      "color",
      "background-color",
      "border-color",
      "stop-color",
      "flood-color",
      "lighting-color"
    ];

    attrs.forEach((attr) => {
      let val = orig.getAttribute(attr);
      if (!val) {
        val = orig.style.getPropertyValue(attr);
      }
      if (val && val.includes("var(")) {
        const varNameMatch = val.match(/var\(([^)]+)\)/);
        if (varNameMatch) {
          const varName = varNameMatch[1].trim();
          const resolved = elStyle.getPropertyValue(varName).trim();
          if (resolved) {
            cloned.setAttribute(attr, resolved);
          }
        }
      }
    });

    const styleAttr = orig.getAttribute("style");
    if (styleAttr && styleAttr.includes("var(")) {
      const props = ["stroke", "fill", "background-color", "color"];
      props.forEach((prop) => {
        const resolved = elStyle.getPropertyValue(prop);
        if (resolved) {
          cloned.style.setProperty(prop, resolved);
        }
      });
    }
  });

  return clone;
}

/** Serialize and download an SVG element as an .svg file. */
export function downloadSVG(svgEl: SVGSVGElement, filename: string): void {
  const resolvedSvg = cloneAndResolveSVG(svgEl);
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(resolvedSvg);
  const svgBlob = new Blob(
    ['<?xml version="1.0" standalone="no"?>\r\n', source],
    { type: "image/svg+xml;charset=utf-8" }
  );
  const url = URL.createObjectURL(svgBlob);
  _triggerDownload(url, filename + ".svg");
  URL.revokeObjectURL(url);
}

/** Render an SVG element to canvas and download as a .png file. */
export function downloadPNG(svgEl: SVGSVGElement, filename: string): void {
  const resolvedSvg = cloneAndResolveSVG(svgEl);
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(resolvedSvg);
  const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const w = svgEl.clientWidth  || svgEl.viewBox.baseVal.width  || 800;
    const h = svgEl.clientHeight || svgEl.viewBox.baseVal.height || 300;
    const canvas = document.createElement("canvas");
    canvas.width  = w * 2;   // 2× for retina
    canvas.height = h * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(2, 2);
    // Fill background so transparent SVG → white/theme PNG
    ctx.fillStyle = resolvedSvg.style.backgroundColor || "#1a1e2a";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const pngUrl = URL.createObjectURL(blob);
      _triggerDownload(pngUrl, filename + ".png");
      URL.revokeObjectURL(pngUrl);
    }, "image/png");
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

/** Build and download a CSV file from a 2-D array of string values. */
export function downloadCSV(rows: (string | number)[][], filename: string): void {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell);
          // Wrap in quotes if it contains comma, quote, or newline
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(",")
    )
    .join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  _triggerDownload(url, filename + ".csv");
  URL.revokeObjectURL(url);
}

function _triggerDownload(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
