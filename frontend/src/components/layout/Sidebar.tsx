import { useTabStore }        from "../../store/tabStore";
import { useFilterDesign }    from "../../hooks/useFilterDesign";
import { FilterTypeSelector } from "../inputs/FilterTypeSelector";
import { ApproxSelector }     from "../inputs/ApproxSelector";
import { FreqUnitToggle }     from "../inputs/FreqUnitToggle";
import { ParameterInputs }    from "../inputs/ParameterInputs";
import { SaveLoadBar }        from "../workspace/SaveLoadBar";
import { Spinner }            from "../layout/Spinner";

interface Props {
  tabId: string;
}

export function Sidebar({ tabId }: Props) {
  const tabs          = useTabStore((s) => s.tabs);
  const updateRequest = useTabStore((s) => s.updateRequest);
  const setFreqUnit   = useTabStore((s) => s.setFreqUnit);

  const { run } = useFilterDesign(tabId);

  const tab = tabs.find((t) => t.id === tabId);
  if (!tab) return null;

  const handleDesign = () => {
    run(tab.request);
  };

  // Basic pre-flight check before enabling the button
  const canDesign =
    !tab.isLoading &&
    tab.request.w_stop > tab.request.w_pass &&
    tab.request.a_stop < tab.request.a_pass &&
    tab.request.a_pass < 0 &&
    (tab.request.filter_type === "analog" ||
      (tab.request.sampling_freq ?? 0) > 0);

  return (
    <aside className="sidebar">

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