import React from "react";

function Modal({ log, onClose, t }) {
    if (!log) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
                padding: "20px",
                overflowY: "auto",
            }}
        >
            <div
                style={{
                    background: "var(--section-bg)",
                    color: "var(--text-color)",
                    padding: "20px",
                    borderRadius: "10px",
                    width: "100%",
                    maxWidth: "600px",
                    maxHeight: "90vh",
                    overflowY: "auto",      // 👈 щоб все вміщалось і скролилось
                    boxSizing: "border-box",// 👈 дуже важливо!
                    boxShadow: "0 0 12px rgba(0, 0, 0, 0.2)",
                }}
            >
                <h3 style={{ marginTop: 0 }}>📄 {t.details || "Log Details"}</h3>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                        {Object.entries(log).map(([key, value]) => (
                            <tr key={key}>
                                <td
                                    style={{
                                        padding: "8px",
                                        fontWeight: 600,
                                        borderBottom: "1px solid var(--border)",
                                        whiteSpace: "nowrap",
                                        verticalAlign: "top",
                                    }}
                                >
                                    {t.fields?.[key] || key}
                                </td>
                                <td
                                    style={{
                                        padding: "8px",
                                        borderBottom: "1px solid var(--border)",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {String(value)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ marginTop: "20px", textAlign: "right" }}>
                    <button onClick={onClose}>❌ {t.close || "Close"}</button>
                </div>
            </div>
        </div>
    );
}

export default Modal;
