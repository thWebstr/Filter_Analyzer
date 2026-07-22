import { useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SplashScreen } from "./components/layout/SplashScreen";
import { Header } from "./components/layout/Header";
import { TabBar } from "./components/layout/TabBar";
import { Sidebar } from "./components/layout/Sidebar";
import { ResultsPanel } from "./components/results/ResultsPanel";
import { useTabStore } from "./store/tabStore";
import { useThemeInit } from "./utils/theme";

const SPLASH_KEY = "fa_splash_shown";

export default function App() {
  useThemeInit();
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem(SPLASH_KEY)
  );


  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs = useTabStore((s) => s.tabs);
  const activeId = useTabStore((s) => s.activeTabId);
  const setError = useTabStore((s) => s.setError);

  const activeTab = tabs.find((t) => t.id === activeId)!;

  return (
    <>
      {showSplash && (
        <SplashScreen
          onComplete={() => {
            sessionStorage.setItem(SPLASH_KEY, "1");
            setShowSplash(false);
          }}
        />
      )}

      <div className={`app-shell ${showSplash ? "is-hidden" : ""} ${sidebarOpen ? "sidebar-open" : ""}`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        <TabBar />
        <Sidebar tabId={activeId} onClose={() => setSidebarOpen(false)} />
        <ResultsPanel
          result={activeTab.result}
          isLoading={activeTab.isLoading}
          error={activeTab.error}
          onDismissError={() => setError(activeId, null)}
          freqUnit={activeTab.freqUnit}
          request={activeTab.request}
        />
      </div>
      <Analytics />
    </>
  );
}