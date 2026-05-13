import { create } from "zustand";
import type {
  TabState,
  FilterRequest,
  FilterResult,
  FreqUnit,
} from "../types/filter";

const DEFAULT_REQUEST: FilterRequest = {
  approximation: "butterworth",
  filter_type: "analog",
  w_pass: 1.0,
  w_stop: 2.0,
  a_pass: -1.0,
  a_stop: -40.0,
  freq_unit: "rad_s",
  sampling_freq: null,
};

function makeTab(id: string, overrides?: Partial<FilterRequest>): TabState {
  return {
    id,
    name: "New Filter",
    request: { ...DEFAULT_REQUEST, ...overrides },
    result: null,
    isLoading: false,
    error: null,
    hasUnsavedChanges: false,
    freqUnit: "rad_s",
  };
}

interface TabStore {
  tabs: TabState[];
  activeTabId: string;
  compareTabId: string | null;

  // Tab management
  addTab: () => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  renameTab: (id: string, name: string) => void;
  setCompareTab: (id: string | null) => void;

  // Per-tab state updates
  updateRequest: (id: string, patch: Partial<FilterRequest>) => void;
  setLoading: (id: string, loading: boolean) => void;
  setResult: (id: string, result: FilterResult) => void;
  setError: (id: string, error: string | null) => void;
  setFreqUnit: (id: string, unit: FreqUnit) => void;
  markSaved: (id: string) => void;
  loadConfig: (id: string, request: FilterRequest, result?: FilterResult) => void;
}

let tabCounter = 1;

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [makeTab("tab-1")],
  activeTabId: "tab-1",
  compareTabId: null,

  addTab: () => {
    const MAX_TABS = 8;
    if (get().tabs.length >= MAX_TABS) return;
    tabCounter += 1;
    const id = `tab-${tabCounter}`;
    set((s) => ({
      tabs: [...s.tabs, makeTab(id)],
      activeTabId: id,
    }));
  },

  closeTab: (id) => {
    const { tabs, activeTabId } = get();
    if (tabs.length === 1) return; // always keep one tab
    const idx = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);
    const newActive =
      activeTabId === id
        ? newTabs[Math.max(0, idx - 1)].id
        : activeTabId;
    set({ tabs: newTabs, activeTabId: newActive });
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  renameTab: (id, name) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, name } : t)),
    })),

  setCompareTab: (id) => set({ compareTabId: id }),

  updateRequest: (id, patch) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id
          ? {
              ...t,
              request: { ...t.request, ...patch },
              hasUnsavedChanges: true,
              error: null,
            }
          : t
      ),
    })),

  setLoading: (id, loading) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id ? { ...t, isLoading: loading } : t
      ),
    })),

  setResult: (id, result) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id
          ? {
              ...t,
              result,
              isLoading: false,
              error: null,
              name: `${result.approximation.slice(0, 3).toUpperCase()}-n${result.order}`,
            }
          : t
      ),
    })),

  setError: (id, error) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id ? { ...t, error, isLoading: false } : t
      ),
    })),

  setFreqUnit: (id, unit) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id
          ? { ...t, freqUnit: unit, request: { ...t.request, freq_unit: unit } }
          : t
      ),
    })),

  markSaved: (id) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id ? { ...t, hasUnsavedChanges: false } : t
      ),
    })),

  loadConfig: (id, request, result) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id
          ? {
              ...t,
              request,
              result: result ?? null,
              hasUnsavedChanges: false,
              error: null,
            }
          : t
      ),
    })),
}));