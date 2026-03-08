"use client";

import { useEffect, useState } from "react";

type Phase = "pending" | "tapping" | "approved";

export default function TelegramDemo() {
    const [phase, setPhase] = useState<Phase>("pending");

    useEffect(() => {
        const run = () => {
            setPhase("pending");
            setTimeout(() => setPhase("tapping"), 3200);
            setTimeout(() => setPhase("approved"), 3900);
        };
        run();
        const id = setInterval(run, 7000);
        return () => clearInterval(id);
    }, []);

    const isApproved = phase === "approved";
    const isTapping  = phase === "tapping";

    return (
        <div style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        }}>
            {/* Ambient glow */}
            <div style={{
                position: "absolute",
                inset: "-40px",
                background: isApproved
                    ? "radial-gradient(ellipse at center, rgba(52,211,153,0.12) 0%, transparent 70%)"
                    : "radial-gradient(ellipse at center, rgba(251,191,36,0.08) 0%, transparent 70%)",
                transition: "background 1s ease",
                pointerEvents: "none",
                zIndex: 0,
            }} />

            {/* Phone frame */}
            <div style={{
                position: "relative",
                zIndex: 1,
                width: 280,
                borderRadius: 36,
                background: "#0e1117",
                border: "2px solid rgba(255,255,255,0.1)",
                boxShadow: isApproved
                    ? "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(52,211,153,0.2), 0 0 40px rgba(52,211,153,0.08)"
                    : "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(251,191,36,0.1)",
                transition: "box-shadow 0.8s ease",
                overflow: "hidden",
            }}>
                {/* Status bar */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 20px 6px",
                    background: "#17212b",
                }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "monospace" }}>9:41</span>
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: "#aaa" }}>●●●●</span>
                        <span style={{ fontSize: 10, color: "#aaa" }}>WiFi</span>
                        <span style={{ fontSize: 10, color: "#aaa" }}>100%</span>
                    </div>
                </div>

                {/* Telegram header */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    background: "#17212b",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                    <span style={{ color: "#5b9bd5", fontSize: 18, cursor: "pointer" }}>‹</span>
                    <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#0a0f1e" }}>OH</span>
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>ORACLE-H</div>
                        <div style={{ fontSize: 11, color: "#71a4db" }}>bot</div>
                    </div>
                </div>

                {/* Chat area */}
                <div style={{
                    background: "#0e1621",
                    padding: "14px 10px",
                    minHeight: 300,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                }}>
                    {/* Bot message bubble */}
                    <div style={{
                        background: "#17212b",
                        borderRadius: "4px 12px 12px 12px",
                        padding: "10px 12px",
                        maxWidth: "95%",
                    }}>
                        {/* Warning header */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 8,
                            paddingBottom: 8,
                            borderBottom: "1px solid rgba(251,191,36,0.15)",
                        }}>
                            <span style={{ fontSize: 14 }}>⚠️</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", letterSpacing: "0.05em" }}>
                                VALIDATION REQUISE
                            </span>
                        </div>

                        {/* Fields */}
                        {[
                            { label: "Agent",  value: "claude-desktop-01" },
                            { label: "Action", value: "DELETE /api/users/*" },
                            { label: "Impact", value: "12,450 comptes" },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                <span style={{ fontSize: 11, color: "#6b7c93" }}>{label}</span>
                                <span style={{ fontSize: 11, color: "#c8d6e5", fontFamily: "monospace" }}>{value}</span>
                            </div>
                        ))}

                        {/* Action buttons — inline keyboard */}
                        <div style={{
                            display: "flex",
                            gap: 6,
                            marginTop: 10,
                            opacity: isApproved ? 0.35 : 1,
                            transition: "opacity 0.3s ease",
                        }}>
                            <button
                                style={{
                                    flex: 1, padding: "7px 0",
                                    background: isTapping
                                        ? "rgba(52,211,153,0.35)"
                                        : isApproved
                                        ? "rgba(52,211,153,0.15)"
                                        : "rgba(52,211,153,0.12)",
                                    border: isTapping || isApproved
                                        ? "1px solid rgba(52,211,153,0.6)"
                                        : "1px solid rgba(52,211,153,0.2)",
                                    borderRadius: 6,
                                    color: "#34d399",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "default",
                                    transition: "all 0.25s ease",
                                    transform: isTapping ? "scale(0.96)" : "scale(1)",
                                }}
                            >
                                ✅ Approuver
                            </button>
                            <button
                                style={{
                                    flex: 1, padding: "7px 0",
                                    background: "rgba(251,113,133,0.08)",
                                    border: "1px solid rgba(251,113,133,0.15)",
                                    borderRadius: 6,
                                    color: "#fb7185",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "default",
                                    opacity: isApproved ? 0.3 : 1,
                                    transition: "opacity 0.3s ease",
                                }}
                            >
                                ❌ Refuser
                            </button>
                        </div>
                    </div>

                    {/* Marie's reply — only when approved */}
                    <div style={{
                        alignSelf: "flex-end",
                        opacity: isApproved ? 1 : 0,
                        transform: isApproved ? "translateY(0)" : "translateY(12px)",
                        transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1)",
                    }}>
                        <div style={{
                            background: "rgba(52,211,153,0.08)",
                            border: "1px solid rgba(52,211,153,0.2)",
                            borderRadius: "12px 4px 12px 12px",
                            padding: "10px 12px",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}>
                            {/* Avatar */}
                            <div style={{
                                width: 32, height: 32, borderRadius: "50%",
                                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                                boxShadow: "0 0 12px rgba(99,102,241,0.4)",
                            }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>M</span>
                            </div>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Marie</span>
                                    <span style={{
                                        fontSize: 9, fontWeight: 600, color: "#34d399",
                                        background: "rgba(52,211,153,0.1)",
                                        border: "1px solid rgba(52,211,153,0.2)",
                                        borderRadius: 4, padding: "1px 5px",
                                        letterSpacing: "0.04em",
                                    }}>
                                        ✓ APPROUVE
                                    </span>
                                </div>
                                <div style={{ fontSize: 10, color: "#6b7c93", marginTop: 1 }}>
                                    Humaine · Approbatrice · maintenant
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div style={{
                    background: "#17212b",
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}>
                    <div style={{
                        flex: 1, height: 34,
                        background: "#242f3d",
                        borderRadius: 20,
                        display: "flex", alignItems: "center",
                        padding: "0 12px",
                    }}>
                        <span style={{ fontSize: 11, color: "#4a5c6a" }}>Message...</span>
                    </div>
                    <div style={{
                        width: 34, height: 34, borderRadius: "50%",
                        background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <span style={{ fontSize: 14 }}>🎤</span>
                    </div>
                </div>
            </div>

            {/* Label below phone */}
            <div style={{
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: isApproved
                    ? "rgba(52,211,153,0.06)"
                    : "rgba(251,191,36,0.05)",
                border: isApproved
                    ? "1px solid rgba(52,211,153,0.15)"
                    : "1px solid rgba(251,191,36,0.1)",
                borderRadius: 40,
                padding: "8px 16px",
                transition: "all 0.6s ease",
            }}>
                <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>M</span>
                </div>
                <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Marie</span>
                    <span style={{ fontSize: 12, color: "#64748b", marginLeft: 6 }}>· Humaine · Approbatrice</span>
                </div>
                <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: isApproved ? "#34d399" : "#fbbf24",
                    boxShadow: isApproved
                        ? "0 0 8px rgba(52,211,153,0.6)"
                        : "0 0 8px rgba(251,191,36,0.6)",
                    transition: "all 0.4s ease",
                    animation: "pulse-dot 2s ease-in-out infinite",
                }} />
            </div>
        </div>
    );
}
