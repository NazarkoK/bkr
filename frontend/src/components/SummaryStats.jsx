import React, { useEffect, useState } from "react";
import axios from "axios";
import translations from "../i18n";

function SummaryStats({ lang = "en" }) {
  const t = translations[lang];
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchData = () => {
      axios.get("http://127.0.0.1:8000/logs")
        .then(res => setLogs(res.data))
        .catch(err => console.error(err));
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const total = logs.length;
  const anomalies = logs.filter(log => log.is_anomaly).length;
  const users = new Set(logs.map(log => log.user_id)).size;
  const tables = new Set(logs.map(log => log.table_name)).size;
  const ips = new Set(logs.map(log => log.ip_address)).size;

  const cards = [
    { icon: "📋", label: t.totalQueries || "Total Queries", value: total },
    { icon: "⚠️", label: t.totalAnomalies || "Anomalies", value: anomalies },
    { icon: "👥", label: t.uniqueUsers || "Users", value: users },
    { icon: "💾", label: t.uniqueTables || "Tables", value: tables },
    { icon: "🌐", label: t.uniqueIPs || "IPs", value: ips },
  ];

  return (
    <div className="summary-grid">
      {cards.map((item, index) => (
        <div key={index} className="section" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "28px" }}>{item.icon}</div>
          <div style={{ fontSize: "14px", margin: "6px 0" }}>{item.label}</div>
          <div style={{ fontSize: "20px", fontWeight: "bold" }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

export default SummaryStats;
