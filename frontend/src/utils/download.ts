/**
 * Download utility functions for plots and tables.
 */

/** Serialize and download an SVG element as an .svg file. */
export function downloadSVG(svgEl: SVGSVGElement, filename: string): void {
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgEl);
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
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgEl);
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
    // Fill background so transparent SVG → white PNG
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-bg-card").trim() || "#1a1e2a";
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
