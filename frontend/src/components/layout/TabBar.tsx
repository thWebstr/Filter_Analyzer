import { useTabStore } from "../../store/tabStore";

export function TabBar() {
  const tabs      = useTabStore((s) => s.tabs);
  const activeId  = useTabStore((s) => s.activeTabId);
  const addTab    = useTabStore((s) => s.addTab);
  const closeTab  = useTabStore((s) => s.closeTab);
  const setActive = useTabStore((s) => s.setActiveTab);

  return (
    <div className="tabbar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${tab.id === activeId ? "active" : ""}`}
          onClick={() => setActive(tab.id)}
        >
          {/* Unsaved dot */}
          {tab.hasUnsavedChanges && (
            <span className="tab__unsaved" />
          )}

          <span>{tab.name}</span>

          {/* Loading indicator */}
          {tab.isLoading && (
            <span className="spinner light spinner--small" />
          )}

          {/* Close button */}
          {tabs.length > 1 && (
            <button
              className="tab__close"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              title="Close tab"
            >
              ×
            </button>
          )}
        </div>
      ))}

      {/* Add tab button */}
      {tabs.length < 8 && (
        <button className="tab__add" onClick={addTab} title="New filter tab">
          +
        </button>
      )}
    </div>
  );
}