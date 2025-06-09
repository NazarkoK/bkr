import React, { useEffect, useState } from "react";
import axios from "axios";
import translations from "../i18n";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  ResponsiveContainer, Legend
} from "recharts";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f7f', '#a0a0ff', '#ffb3b3'];

function AnomalyCharts({ lang = "en" }) {
  const t = translations[lang];
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchData = () => {
      axios.get("http://127.0.0.1:8000/logs")
        .then(res => setLogs(res.data))
        .catch(console.error);
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const stats = {
    byUser: {},
    byQuery: {},
    byIP: {},
    byDate: {},
    byHourAnomalies: {}
  };

  logs.forEach(log => {
    const { user_id, query_type, ip_address, timestamp, is_anomaly } = log;
    const date = new Date(timestamp);
    const day = date.toISOString().split("T")[0];
    const hour = date.getHours();

    stats.byUser[user_id] = (stats.byUser[user_id] || 0) + 1;
    stats.byQuery[query_type] = (stats.byQuery[query_type] || 0) + 1;
    stats.byIP[ip_address] = (stats.byIP[ip_address] || 0) + 1;
    stats.byDate[day] = (stats.byDate[day] || 0) + 1;

    if (is_anomaly) {
      stats.byHourAnomalies[hour] = (stats.byHourAnomalies[hour] || 0) + 1;
    }
  });

  const formatData = (obj, nameKey = "name") =>
    Object.entries(obj).map(([key, count]) => ({ [nameKey]: key, count }));

  const userData = formatData(stats.byUser);
  const queryData = formatData(stats.byQuery);
  const ipData = formatData(stats.byIP, "ip");
  const dailyData = formatData(stats.byDate, "date");
  const hourData = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: stats.byHourAnomalies[hour] || 0
  }));

  const renderBarChart = (data, xKey, color) => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey={xKey} />
        <YAxis label={{ value: t.countLabel, angle: -90, position: "insideLeft" }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" name={t.countLabel} fill={color} />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="charts-container" style={{ marginTop: "40px" }}>
      <h2>{t.chartUsers}</h2>
      {renderBarChart(userData, "name", "#8884d8")}

      <h2 style={{ marginTop: "40px" }}>{t.chartTypes}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={queryData} dataKey="count" nameKey="name" outerRadius={100} label>
            {queryData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <h2 style={{ marginTop: "40px" }}>{t.chartIPs}</h2>
      {renderBarChart(ipData, "ip", "#ffc658")}

      <h2 style={{ marginTop: "40px" }}>{t.chartDays}</h2>
      {renderBarChart(dailyData, "date", "#82ca9d")}

      <h2 style={{ marginTop: "40px" }}>{t.chartHours}</h2>
      {renderBarChart(hourData, "hour", "#ff7f7f")}
    </div>
  );
}

export default AnomalyCharts;
