import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import translations from "../i18n";
import Modal from "./Modal";

function LogsTable({ onlyAnomalies = false, lang = "en" }) {
  const t = translations[lang];
  const [logs, setLogs] = useState([]);
  const [queryType, setQueryType] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [newestId, setNewestId] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [compactView, setCompactView] = useState(false);
  const timeoutRef = useRef(null);

  const fetchData = () => {
    const baseUrl = onlyAnomalies ? "/logs/anomalies" : "/logs";
    const params = new URLSearchParams();

    if (queryType) params.append("query_type", queryType);
    if (userFilter) params.append("user_id", userFilter);
    if (searchTerm) params.append("search", searchTerm);
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);

    axios.get(`http://127.0.0.1:8000${baseUrl}?${params.toString()}`)
      .then(res => {
        const newData = res.data;
        const maxNew = Math.max(...newData.map(log => log.id), 0);
        if (logs.length && maxNew > Math.max(...logs.map(log => log.id), 0)) {
          setNewestId(maxNew);
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => setNewestId(null), 3000);
        }
        setLogs(newData);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [onlyAnomalies, queryType, userFilter, searchTerm, dateFrom, dateTo]);

  const queryTypes = [...new Set(logs.map(log => log.query_type))];
  const users = [...new Set(logs.map(log => log.user_id))];

  const sortedLogs = [...logs].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    return typeof aVal === "string"
      ? (sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal))
      : (sortDesc ? bVal - aVal : aVal - bVal);
  });

  const handleSort = (field) => {
    setSortField(field);
    setSortDesc(prev => field === sortField ? !prev : true);
  };

  const exportToCSV = () => {
    const headers = [
      "id", "timestamp", "user_id", "query_type", "table_name",
      "affected_rows", "execution_time_ms", "ip_address", "is_anomaly"
    ];
    const rows = sortedLogs.map(log =>
      headers.map(h => `"${log[h]}"`).join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const label = onlyAnomalies ? "ANOMALIES" : "ALL";
    const filename = `logs_${label}_${new Date().toISOString().slice(0, 16).replace(/:/g, "-")}.csv`;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  };

  return (
    <div>
      <h2>{onlyAnomalies ? t.anomalies : t.allQueries}</h2>

      <div style={{ marginBottom: "10px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <label>🔎 {t.user}:</label>
          <select value={userFilter} onChange={e => setUserFilter(e.target.value)}>
            <option value="">{t.all}</option>
            {users.map(user => <option key={user} value={user}>{user}</option>)}
          </select>

          <label>{t.queryType}:</label>
          <select value={queryType} onChange={e => setQueryType(e.target.value)}>
            <option value="">{t.all}</option>
            {queryTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>

          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          <button onClick={exportToCSV}>⬇️ {t.export || "Export CSV"}</button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "10px", alignItems: "center" }}>
          <label>{t.from || "From"}:</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <label>{t.to || "To"}:</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          <button onClick={() => setCompactView(!compactView)}>
            {compactView ? "📦" : "🧱"} {t.viewMode}: {compactView ? t.compact : t.standard}
          </button>
        </div>
      </div>

      <div className="table-wrapper" style={{ maxHeight: "430px" }}>
        <table className={compactView ? "compact-table" : ""}>
          <thead>
            <tr>
              {[
                "id", "timestamp", "user_id", "query_type", "table_name",
                "affected_rows", "execution_time_ms", "ip_address", "is_anomaly"
              ].map(key => (
                <th key={key} onClick={() => handleSort(key)}>
                  {t.fields?.[key] || key} {sortField === key ? (sortDesc ? "↓" : "↑") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedLogs.map(log => (
              <tr
                key={log.id}
                className={`${log.is_anomaly ? "anomaly-row" : ""} ${log.id === newestId ? "new-row" : ""}`}
                onClick={() => setSelectedLog(log)}
                style={{ cursor: "pointer" }}
              >
                <td>{log.id}</td>
                <td>{log.timestamp}</td>
                <td>{log.user_id}</td>
                <td>{log.query_type}</td>
                <td>{log.table_name}</td>
                <td>{log.affected_rows}</td>
                <td>{log.execution_time_ms}</td>
                <td>{log.ip_address}</td>
                <td>{log.is_anomaly ? t.yes : t.no}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal log={selectedLog} onClose={() => setSelectedLog(null)} t={t} />
    </div>
  );
}

export default LogsTable;
