import { useTabStore }        from "../../store/tabStore";
import { useFilterDesign }    from "../../hooks/useFilterDesign";
import { FilterTypeSelector } from "../inputs/FilterTypeSelector";
import { ApproxSelector }     from "../inputs/ApproxSelector";
import { FreqUnitToggle }     from "../inputs/FreqUnitToggle";
import { ParameterInputs }    from "../inputs/ParameterInputs";
import { BandConfigSelector } from "../inputs/BandConfigSelector";
import { SaveLoadBar }        from "../workspace/SaveLoadBar";
import { Spinner }            from "../layout/Spinner";
import type { BandConfig }    from "../../types/filter";

interface Props {
  tabId: string;
}

export function Sidebar({ tabId }: Props) {
  const tabs          = useTabStore((s) => s.tabs);
  const updateRequest = useTabStore((s) => s.updateRequest);
  const setFreqUnit   = useTabStore((s) => s.setFreqUnit);
  const setBandConfig = useTabStore((s) => s.setBandConfig);

  const { run } = useFilterDesign(tabId);

  const tab = tabs.find((t) => t.id === tabId);
  if (!tab) return null;

  const bc   = tab.request.band_config;

  const handleDesign = () => {
    run(tab.request);
  };

  // Band-config-aware pre-flight check
  const baseOk =
    !tab.isLoading &&
    tab.request.a_stop < tab.request.a_pass &&
    tab.request.a_pass < 0 &&
    tab.request.w_pass > 0 &&
    tab.request.w_stop > 0 &&
    (tab.request.filter_type === "analog" ||
      (tab.request.sampling_freq ?? 0) > 0);

  const freqOk = (() => {
    if (bc === "lowpass")  return tab.request.w_stop > tab.request.w_pass;
    if (bc === "highpass") return tab.request.w_stop < tab.request.w_pass;
    if (bc === "bandpass" || bc === "bandstop") {
      return (
        tab.request.w_pass2 !== null &&
        tab.request.w_stop2 !== null &&
        tab.request.w_pass2 > 0 &&
        tab.request.w_stop2 > 0
      );
    }
    return false;
  })();

  const canDesign = baseOk && freqOk;

  return (
    <aside className="sidebar">

      {/* Band configuration */}
      <div className="sidebar__section">
        <BandConfigSelector
          value={bc}
          onChange={(v: BandConfig) => setBandConfig(tabId, v)}
        />
      </div>

      {/* Domain */}
      <div className="sidebar__section">
        <FilterTypeSelector
          value={tab.request.filter_type}
          onChange={(v) => updateRequest(tabId, { filter_type: v })}
        />
      </div>

      {/* Approximation */}
      <div className="sidebar__section">
        <ApproxSelector
          value={tab.request.approximation}
          onChange={(v) => updateRequest(tabId, { approximation: v })}
        />
      </div>

      {/* Frequency unit */}
      <div className="sidebar__section">
        <FreqUnitToggle
          value={tab.freqUnit}
          onChange={(v) => setFreqUnit(tabId, v)}
        />
      </div>

      {/* Parameters */}
      <div className="sidebar__section">
        <p className="sidebar__label">Specifications</p>
        <ParameterInputs
          request={tab.request}
          freqUnit={tab.freqUnit}
          onChange={(patch) => updateRequest(tabId, patch)}
        />
      </div>

      {/* Design button */}
      <div className="sidebar__section">
        <button
          className="design-btn"
          onClick={handleDesign}
          disabled={!canDesign}
        >
          {tab.isLoading ? (
            <>
              <Spinner />
              Computing…
            </>
          ) : (
            "Design Filter"
          )}
        </button>
      </div>

      {/* Save / Load */}
      <SaveLoadBar tabId={tabId} />
    </aside>
  );
}