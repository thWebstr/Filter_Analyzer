import { useTabStore } from "../../store/tabStore";
import type { FilterRequest, FilterResult } from "../../types/filter";
import { useState } from "react";

interface Props {
  tabId: string;
}

export function SaveLoadBar({ tabId }: Props) {
  const tabs      = useTabStore((s) => s.tabs);
  const markSaved = useTabStore((s) => s.markSaved);
  const loadConfig = useTabStore((s) => s.loadConfig);
  const [saved, setSaved] = useState(false);

  const tab = tabs.find((t) => t.id === tabId);
  if (!tab) return null;

  const handleSave = () => {
    const config = {
      fcfg_version: "1.0",
      created_at:   new Date().toISOString(),
      tab_name:     tab.name,
      parameters:   tab.request,
      last_result:  tab.result ?? undefined,
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${tab.name.replace(/\s+/g, "_")}.fcfg`;
    a.click();
    URL.revokeObjectURL(url);

    markSaved(tabId);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleLoad = () => {
    const input   = document.createElement("input");
    input.type    = "file";
    input.accept  = ".fcfg,application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          const request: FilterRequest = data.parameters;
          const result: FilterResult | undefined = data.last_result;
          loadConfig(tabId, request, result);
        } catch {
          alert("Invalid .fcfg file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="save-load-bar">
      <button className="btn-ghost" onClick={handleLoad}>
        ↑ Load
      </button>
      <button
        className={`btn-ghost ${saved ? "save-btn--saved" : ""}`}
        onClick={handleSave}
      >
        {saved ? "✓ Saved" : "↓ Save"}
      </button>
    </div>
  );
}