export default function Steps() {
    const steps = [
        {
            n: "01",
            icon: "⚙️",
            title: "Agent identifies a critical action",
            desc: "File deletion, production deployment, financial transaction — any irreversible operation.",
            color: "#3b82f6",
        },
        {
            n: "02",
            icon: "📡",
            title: "oracle_validate() is called",
            desc: "The agent submits the action, rationale, and projected impact to ORACLE-H. A request_id is returned.",
            color: "#8b5cf6",
        },
        {
            n: "03",
            icon: "📱",
            title: "Marie receives the notification",
            desc: "Telegram. Full action context, risk level, and financial impact. One tap to decide.",
            color: "#fbbf24",
            human: true,
        },
        {
            n: "04",
            icon: "✅",
            title: "Approved or rejected",
            desc: "The decision is HMAC-SHA256 signed and returned to the agent via oracle_poll_status().",
            color: "#34d399",
        },
        {
            n: "05",
            icon: "🚀",
            title: "Agent executes — or stops",
            desc: "approved → action executes. rejected / expired → agent stops and informs the user.",
            color: "#fb923c",
        },
    ];

    return (
        <section style={{ padding: "80px 0" }}>
            <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
                <h2 style={{
                    fontSize: "clamp(1.5rem, 3vw, 2rem)",
                    fontWeight: 700,
                    color: "#f0f4ff",
                    fontFamily: "'Space Grotesk', sans-serif",
                    marginBottom: 8,
                    textAlign: "center",
                }}>
                    How it works
                </h2>
                <p style={{
                    textAlign: "center",
                    color: "#7a8ba8",
                    fontSize: 15,
                    marginBottom: 48,
                }}>
                    5 steps. From MCP call to human decision.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {steps.map((step, i) => (
                        <div key={step.n} style={{ display: "flex", gap: 0 }}>
                            {/* Number column + connector line */}
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                width: 56,
                                flexShrink: 0,
                            }}>
                                <div style={{
                                    width: 40, height: 40,
                                    borderRadius: "50%",
                                    background: `${step.color}14`,
                                    border: `1px solid ${step.color}40`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 18,
                                    flexShrink: 0,
                                    zIndex: 1,
                                }}>
                                    {step.icon}
                                </div>
                                {i < steps.length - 1 && (
                                    <div style={{
                                        width: 1,
                                        flex: 1,
                                        minHeight: 32,
                                        background: `linear-gradient(to bottom, ${step.color}30, ${steps[i + 1].color}20)`,
                                        margin: "4px 0",
                                    }} />
                                )}
                            </div>

                            {/* Content */}
                            <div style={{
                                paddingLeft: 16,
                                paddingBottom: i < steps.length - 1 ? 28 : 0,
                                flex: 1,
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                    <span style={{
                                        fontSize: 11,
                                        fontFamily: "'Space Grotesk', monospace",
                                        fontWeight: 700,
                                        color: step.color,
                                        opacity: 0.7,
                                    }}>
                                        {step.n}
                                    </span>
                                    {step.human && (
                                        <span style={{
                                            fontSize: 10,
                                            fontWeight: 600,
                                            color: "#fbbf24",
                                            background: "rgba(251,191,36,0.1)",
                                            border: "1px solid rgba(251,191,36,0.2)",
                                            borderRadius: 4,
                                            padding: "1px 6px",
                                            letterSpacing: "0.06em",
                                        }}>
                                            HUMAN
                                        </span>
                                    )}
                                </div>
                                <h3 style={{
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: "#e2e8f0",
                                    marginBottom: 4,
                                    fontFamily: "'Space Grotesk', sans-serif",
                                }}>
                                    {step.title}
                                </h3>
                                <p style={{
                                    fontSize: 13,
                                    color: "#64748b",
                                    lineHeight: 1.6,
                                    margin: 0,
                                }}>
                                    {step.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
