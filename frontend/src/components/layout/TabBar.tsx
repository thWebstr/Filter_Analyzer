import { useState, useRef, useEffect } from "react";
import { useTabStore } from "../../store/tabStore";

export function TabBar() {
  const tabs      = useTabStore((s) => s.tabs);
  const activeId  = useTabStore((s) => s.activeTabId);
  const addTab    = useTabStore((s) => s.addTab);
  const closeTab  = useTabStore((s) => s.closeTab);
  const setActive = useTabStore((s) => s.setActiveTab);
  const renameTab = useTabStore((s) => s.renameTab);

  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editValue, setEditValue]   = useState("");
  const inputRef                    = useRef<HTMLInputElement>(null);

  // Focus input when editing begins
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName);
  };

  const commitEdit = () => {
    if (editingId) {
      const trimmed = editValue.trim();
      if (trimmed) renameTab(editingId, trimmed);
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter")  commitEdit();
    if (e.key === "Escape") setEditingId(null);
  };

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

          {/* Inline rename input or label */}
          {editingId === tab.id ? (
            <input
              ref={inputRef}
              className="tab__rename-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              maxLength={32}
              title="Rename tab"
              aria-label="Rename tab"
            />
          ) : (
            <span
              className="tab__name"
              onDoubleClick={(e) => {
                e.stopPropagation();
                startEdit(tab.id, tab.name);
              }}
              title="Double-click to rename"
            >
              {tab.name}
            </span>
          )}

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