import { useTabStore } from "./store/tabStore";

function App() {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div>
      <h1>FilterAnalyzer</h1>
      <p>Active tab: {activeTab?.name}</p>
    </div>
  );
}

export default App;