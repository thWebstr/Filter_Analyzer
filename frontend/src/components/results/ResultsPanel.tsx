import { useState }                   from "react";
import type { FilterResult } from "../../types/filter";
import { ErrorBanner }                from "../layout/ErrorBanner";
import { MagnitudeResponsePlot }      from "./MagnitudeResponsePlot";
import { PhaseResponsePlot }          from "./PhaseResponsePlot";
import { GroupDelayPlot }             from "./GroupDelayPlot";
import { PoleZeroPlot }               from "./PoleZeroPlot";
import { PoleZeroTable }              from "./PoleZeroTable";
import { TransferFunctionDisplay }    from "./TransferFunctionDisplay";

type PlotTab = "magnitude" | "phase" | "group_delay" | "pole_zero";

const PLOT_TABS: { key: PlotTab; label: string }[] = [
  { key: "magnitude",   label: "Magnitude"   },
  { key: "phase",       label: "Phase"       },
  { key: "group_delay", label: "Group Delay" },
  { key: "pole_zero",   label: "Pole-Zero"   },
];

interface Props {
  result:         FilterResult | null;
  isLoading:      boolean;
  error:          string | null;
  onDismissError: () => void;
  freqUnit:       string;
  request:        { w_pass: number; w_stop: number; a_pass: number; a_stop: number };
}

export function ResultsPanel({
  result,
  isLoading,
  error,
  onDismissError,
  freqUnit,
  request,
}: Props) {
  const [activePlot, setActivePlot] = useState<PlotTab>("magnitude");

  // ── Loading skeleton ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="main">
        <div className="skeleton skel-header" />
        <div className="chart-card">
          <div className="skeleton skel-title-short" />
          <div className="skeleton skel-plot-area" />
        </div>
        <div className="chart-card">
          <div className="skeleton skel-subtitle-mid" />
          <div className="skeleton skel-line-full" />
          <div className="skeleton skel-divider" />
          <div className="skeleton skel-line-80" />
        </div>
        <div className="chart-card">
          <div className="skeleton skel-subtitle-short" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton skel-line-full" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="main">
        <ErrorBanner message={error} onDismiss={onDismissError} />
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────
  if (!result) {
    return (
      <div className="main results-empty-container">
        <div className="results-empty">
          <div className="results-empty__icon">⌇</div>
          <p className="results-empty__text">
            Set your filter specifications<br />and click{" "}
            <strong>
              Design Filter
            </strong>
          </p>
        </div>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────
  return (
    <div className="main fade-in">

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="warning-banner">
          <span>⚠</span>
          <span>{result.warnings.join(" · ")}</span>
        </div>
      )}

      {/* Order badge */}
      <div className="order-badge">
        <span className="order-badge__label">Order</span>
        <span className="order-badge__value">n = {result.order}</span>
        <span className="order-badge__approx">
          {result.approximation.replace(/_/g, " ")}
          &nbsp;·&nbsp;
          {result.filter_type}
        </span>
        <span className="order-badge__epsilon">
          ε = {result.epsilon.toFixed(4)}
        </span>
      </div>

      {/* Plot tabs + chart */}
      <div className="chart-card">
        <div className="plot-tabs">
          {PLOT_TABS.map((t) => (
            <button
              key={t.key}
              className={`plot-tab ${activePlot === t.key ? "active" : ""}`}
              onClick={() => setActivePlot(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activePlot === "magnitude" && (
          <MagnitudeResponsePlot
            freqResponse={result.freq_response}
            wPass={request.w_pass}
            wStop={request.w_stop}
            aPass={request.a_pass}
            aStop={request.a_stop}
            freqUnit={freqUnit}
          />
        )}
        {activePlot === "phase" && (
          <PhaseResponsePlot
            freqResponse={result.freq_response}
            freqUnit={freqUnit}
          />
        )}
        {activePlot === "group_delay" && (
          <GroupDelayPlot
            freqResponse={result.freq_response}
            freqUnit={freqUnit}
          />
        )}
        {activePlot === "pole_zero" && (
          <PoleZeroPlot
            poles={result.poles}
            zeros={result.zeros}
            locusType={result.locus_type}
            locusParams={result.locus_params}
            filterType={result.filter_type}
          />
        )}
      </div>

      {/* Transfer function */}
      <TransferFunctionDisplay result={result} />

      {/* Pole-zero table */}
      <div className="chart-card">
        <p className="chart-card__title">Poles & Zeros</p>
        <PoleZeroTable poles={result.poles} zeros={result.zeros} />
      </div>

    </div>
  );
}