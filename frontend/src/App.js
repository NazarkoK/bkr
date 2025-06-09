import React, { useEffect, useState } from "react";
import LogsTable from "./components/LogsTable";
import AnomalyCharts from "./components/AnomalyCharts";
import SummaryStats from "./components/SummaryStats";
import ExportButtons from "./components/ExportButtons";
import translations from "./i18n";
import "./styles.css";

function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");
  const [activeTab, setActiveTab] = useState("logs");
  const [logs, setLogs] = useState([]);

  const t = translations[lang];

  const fetchLogs = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/logs");
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to load logs:", err);
    }
  };

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "var(--section-bg)",
          padding: "16px 20px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "28px", margin: 0 }}>🧠 {t.title}</h1>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setActiveTab("logs")}
              style={{
                fontWeight: activeTab === "logs" ? "bold" : "normal",
                textDecoration: activeTab === "logs" ? "underline" : "none"
              }}
            >
              📋 {t.tabs.logs}
            </button>
            <button
              onClick={() => setActiveTab("charts")}
              style={{
                fontWeight: activeTab === "charts" ? "bold" : "normal",
                textDecoration: activeTab === "charts" ? "underline" : "none"
              }}
            >
              📊 {t.tabs.analytics}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <ExportButtons logs={logs} lang={lang} activeTab={activeTab} />
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? t.themeToggle.light : t.themeToggle.dark}
          </button>
          <button onClick={() => setLang(lang === "en" ? "ua" : "en")}>
            🌐 {lang === "en" ? "UA" : "EN"}
          </button>
        </div>
      </header>
 
      {activeTab === "logs" && (
        <>
          <div className="container">
            <div className="section">
              <LogsTable lang={lang} />
            </div>
            <div className="section">
              <LogsTable onlyAnomalies={true} lang={lang} />
            </div>
          </div>
          <div className="section" style={{ margin: "30px 20px" }}>
            <SummaryStats lang={lang} />
          </div>
        </>
      )}

      {activeTab === "charts" && (
        <>
          <div className="section" style={{ margin: "30px 20px" }}>
            <SummaryStats lang={lang} />
          </div>
          <div className="section charts-container" style={{ margin: "30px 20px" }}>
            <AnomalyCharts lang={lang} />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
