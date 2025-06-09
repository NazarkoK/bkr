import React from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import translations from "../i18n";
import robotoFont from "../fonts/Roboto-Regular";

function ExportButtons({ lang = "en", activeTab = "logs" }) {
  const t = translations[lang];

  const preparePDF = () => {
    const pdf = new jsPDF();
    pdf.addFileToVFS("Roboto-Regular.ttf", robotoFont);
    pdf.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    pdf.setFont("Roboto");
    return pdf;
  };

  const getHeaders = () => ([
    t.sortBy, t.timestamp, t.user, t.queryType, t.table,
    t.rows, t.time, t.ip, t.anomaly
  ]);

  const getRows = (data) =>
    data.map(log => [
      log.id,
      log.timestamp,
      log.user_id,
      log.query_type,
      log.table_name,
      log.affected_rows,
      log.execution_time_ms,
      log.ip_address,
      log.is_anomaly ? t.yes : t.no
    ]);

  const exportLogs = async (onlyAnomalies = false) => {
    try {
      const url = onlyAnomalies
        ? "http://localhost:8000/logs/anomalies"
        : "http://localhost:8000/logs";
      const response = await axios.get(url);
      const data = response.data;

      const pdf = preparePDF();
      const headers = getHeaders();
      const sortedLogs = [...data].sort((a, b) => b.id - a.id);
      const rows = getRows(sortedLogs);

      pdf.text(
        `${t.title} – ${onlyAnomalies ? t.anomalies : t.allQueries}`,
        14,
        16
      );
      autoTable(pdf, {
        startY: 20,
        head: [headers],
        body: rows,
        styles: { fontSize: 8, font: "Roboto" },
        headStyles: { font: "Roboto", fontStyle: "normal" },
      });

      const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, "-");
      const name = onlyAnomalies ? "anomalies" : "all";
      pdf.save(`logs_${name}_${timestamp}.pdf`);
    } catch (error) {
      console.error("❌ Export error:", error);
    }
  };

  const exportChartsToPDF = async () => {
    const input = document.querySelector(".charts-container");
    if (!input) return;

    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");

    const pdf = preparePDF();
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    pdf.save(`charts_${new Date().toISOString().slice(0, 16)}.pdf`);
  };

  const exportFullReport = async () => {
    try {
      const response = await axios.get("http://localhost:8000/logs");
      const logs = response.data;

      const pdf = preparePDF();
      const headers = getHeaders();
      const sortedLogs = [...logs].sort((a, b) => b.id - a.id);
      const rows = getRows(sortedLogs);

      pdf.text(`${t.title} – ${t.allQueries}`, 14, 16);
      autoTable(pdf, {
        startY: 20,
        head: [headers],
        body: rows,
        styles: { fontSize: 8, font: "Roboto" },
        headStyles: { font: "Roboto", fontStyle: "normal" },
      });

      const chartBlock = document.querySelector(".charts-container");
      if (chartBlock) {
        const canvas = await html2canvas(chartBlock);
        const imgData = canvas.toDataURL("image/png");
        pdf.addPage();
        pdf.text(`${t.title} – ${t.tabs.analytics}`, 14, 16);
        pdf.addImage(imgData, "PNG", 10, 25, 190, 0);
      }

      const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, "-");
      pdf.save(`report_${timestamp}.pdf`);
    } catch (err) {
      console.error("❌ Export full report error:", err);
    }
  };

  return (
    <div className="export-buttons">
      {activeTab === "logs" && (
        <>
          <button onClick={() => exportLogs(false)}>📄 {t.exportAllLogs || "Export All Logs"}</button>
          <button onClick={() => exportLogs(true)}>⚠️ {t.exportAnomalies || "Export Anomalies"}</button>
        </>
      )}
      {activeTab === "charts" && (
        <>
          <button onClick={exportChartsToPDF}>📊 {t.exportCharts}</button>
          <button onClick={exportFullReport}>📦 {t.exportAll}</button>
        </>
      )}
    </div>
  );
}

export default ExportButtons;
