import TelegramDemo from "@/components/landing/TelegramDemo";
import Steps from "@/components/landing/Steps";
import Link from "next/link";

const INSTALL_SNIPPET = `{
  "mcpServers": {
    "oracle-h": {
      "command": "npx",
      "args": ["-y", "oracle-h-mcp"],
      "env": {
        "ORACLE_SIGNATURE_KEY": "demo-signature-key-change-in-production",
        "ORACLE_BASE_URL": "https://oracle-h.online"
      }
    }
  }
}`;

export default function LandingPage() {
    return (
        <div style={{ background: "var(--bg-primary)", minHeight: "100vh", overflowX: "hidden" }}>

            {/* ── Nav ───────────────────────────────────────────────────────── */}
            <nav style={{
                position: "sticky", top: 0, zIndex: 50,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 24px", height: 60,
                background: "rgba(10,15,30,0.8)",
                backdropFilter: "blur(16px)",
                borderBottom: "1px solid rgba(251,191,36,0.08)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))",
                        border: "1px solid rgba(251,191,36,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, color: "#fbbf24",
                    }}>
                        ⬡
                    </div>
                    <span style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700, fontSize: 15,
                        letterSpacing: "0.1em", color: "#f0f4ff",
                    }}>
                        ORACLE-H
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <a
                        href="https://github.com/tponscr-debug/oracle-h-mcp"
                        target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, color: "#7a8ba8", textDecoration: "none" }}
                    >
                        GitHub
                    </a>
                    <Link
                        href="/dashboard"
                        style={{
                            fontSize: 13, fontWeight: 600,
                            color: "#0a0f1e",
                            background: "#fbbf24",
                            padding: "6px 14px", borderRadius: 8,
                            textDecoration: "none",
                        }}
                    >
                        Dashboard →
                    </Link>
                </div>
            </nav>

            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <section style={{
                maxWidth: 1100, margin: "0 auto",
                padding: "72px 24px 48px",
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 48,
                alignItems: "center",
            }}
                className="hero-grid"
            >
                {/* Left: text */}
                <div>
                    {/* Badge */}
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        background: "rgba(251,191,36,0.06)",
                        border: "1px solid rgba(251,191,36,0.18)",
                        borderRadius: 40, padding: "5px 12px",
                        marginBottom: 24,
                    }}>
                        <span style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: "#fbbf24",
                            boxShadow: "0 0 8px #fbbf24",
                            display: "inline-block",
                            animation: "pulse-dot 2s ease-in-out infinite",
                        }} />
                        <span style={{
                            fontSize: 12, fontWeight: 600,
                            color: "#fbbf24", letterSpacing: "0.06em",
                            fontFamily: "'Space Grotesk', sans-serif",
                        }}>
                            MCP SERVER · MIT · FREE FOREVER
                        </span>
                    </div>

                    {/* Headline */}
                    <h1 style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700,
                        fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
                        lineHeight: 1.1,
                        color: "#f0f4ff",
                        margin: "0 0 16px",
                    }}>
                        Your agents act.<br />
                        <span style={{
                            background: "linear-gradient(90deg, #fbbf24, #f0f4ff)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}>
                            You decide.
                        </span>
                    </h1>

                    {/* Subhead */}
                    <p style={{
                        fontSize: 17, color: "#7a8ba8", lineHeight: 1.65,
                        maxWidth: 480, margin: "0 0 32px",
                    }}>
                        ORACLE-H is a mandatory human checkpoint for autonomous AI agents.
                        Before any critical action — deletion, deployment, payment —
                        a human approves. In one tap.
                    </p>

                    {/* CTAs */}
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <a href="#install" style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            background: "#fbbf24",
                            color: "#0a0f1e",
                            padding: "12px 22px",
                            borderRadius: 10, fontWeight: 700, fontSize: 14,
                            textDecoration: "none",
                            letterSpacing: "0.02em",
                        }}>
                            Install in 30 seconds
                        </a>
                        <a href="/llms.txt" target="_blank" rel="noopener noreferrer" style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            background: "rgba(251,191,36,0.06)",
                            color: "#fbbf24",
                            padding: "12px 22px",
                            borderRadius: 10, fontWeight: 600, fontSize: 14,
                            textDecoration: "none",
                            border: "1px solid rgba(251,191,36,0.2)",
                        }}>
                            llms.txt →
                        </a>
                    </div>

                    {/* Stats */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 16,
                        marginTop: 28, flexWrap: "wrap",
                    }}>
                        <StatPill label="Without ORACLE-H" value="81.5%" color="#fb7185" />
                        <span style={{ color: "#2a3a52", fontSize: 20 }}>→</span>
                        <StatPill label="With ORACLE-H" value="99.6%" color="#34d399" />
                        <span style={{ fontSize: 12, color: "#2a3a52", maxWidth: 140, lineHeight: 1.4 }}>
                            success rate on a 4-step autonomous workflow
                        </span>
                    </div>
                </div>

                {/* Right: phone mockup */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <TelegramDemo />
                </div>
            </section>

            {/* ── Human section ─────────────────────────────────────────────── */}
            <section style={{
                maxWidth: 900, margin: "0 auto",
                padding: "64px 24px",
            }}>
                <div style={{
                    background: "rgba(99,102,241,0.04)",
                    border: "1px solid rgba(99,102,241,0.12)",
                    borderRadius: 20,
                    padding: "40px 32px",
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 32,
                    alignItems: "center",
                }}
                    className="human-grid"
                >
                    {/* Text */}
                    <div>
                        <div style={{
                            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                            color: "#8b5cf6", marginBottom: 12,
                            fontFamily: "'Space Grotesk', sans-serif",
                        }}>
                            THE HUMAN FACTOR
                        </div>
                        <h2 style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: "clamp(1.4rem, 3vw, 2rem)",
                            fontWeight: 700, color: "#f0f4ff",
                            margin: "0 0 12px",
                        }}>
                            One human. Every critical call.
                        </h2>
                        <p style={{
                            fontSize: 15, color: "#64748b", lineHeight: 1.65, margin: 0,
                        }}>
                            AI is powerful but fallible. ORACLE-H puts a real person back
                            in the loop at exactly the right moment. Not an ignorable confirmation
                            dialog — an active decision, on mobile, with full context.
                        </p>
                    </div>

                    {/* Approver card */}
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}>
                        <ApproverCard
                            initial="M"
                            name="Marie"
                            role="Human · Approver"
                            status="online"
                            color="#6366f1"
                            decisions={47}
                        />
                        <div style={{
                            fontSize: 12, color: "#2a3a52",
                            textAlign: "center",
                        }}>
                            + your team, your Telegram
                        </div>
                    </div>
                </div>
            </section>

            {/* ── How it works ──────────────────────────────────────────────── */}
            <Steps />

            {/* ── Install ───────────────────────────────────────────────────── */}
            <section id="install" style={{
                maxWidth: 800, margin: "0 auto",
                padding: "64px 24px 80px",
            }}>
                <h2 style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "clamp(1.5rem, 3vw, 2rem)",
                    fontWeight: 700, color: "#f0f4ff",
                    textAlign: "center", marginBottom: 8,
                }}>
                    Ready in 30 seconds
                </h2>
                <p style={{
                    textAlign: "center", color: "#7a8ba8",
                    fontSize: 15, marginBottom: 36,
                }}>
                    Works with Claude Desktop, Cursor, Windsurf, Cline, Roo Code, and any MCP-compatible runtime.
                </p>

                {/* Platforms */}
                <div style={{
                    display: "flex", gap: 8, flexWrap: "wrap",
                    justifyContent: "center", marginBottom: 28,
                }}>
                    {["Claude", "Cursor", "Windsurf", "Cline", "Roo Code", "Copilot", "Zed", "LangGraph"].map((p) => (
                        <span key={p} style={{
                            fontSize: 12, color: "#7a8ba8",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 6, padding: "4px 10px",
                        }}>
                            {p}
                        </span>
                    ))}
                </div>

                {/* Code block */}
                <div style={{
                    background: "#0d1526",
                    border: "1px solid rgba(251,191,36,0.12)",
                    borderRadius: 14, overflow: "hidden",
                }}>
                    <div style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 16px",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}>
                        <span style={{
                            fontSize: 11, color: "#4a5c78",
                            fontFamily: "monospace",
                        }}>
                            claude_desktop_config.json
                        </span>
                        <span style={{
                            fontSize: 11,
                            background: "rgba(251,191,36,0.08)",
                            color: "#fbbf24",
                            border: "1px solid rgba(251,191,36,0.15)",
                            borderRadius: 4, padding: "2px 8px",
                        }}>
                            demo key included
                        </span>
                    </div>
                    <pre style={{
                        margin: 0, padding: "20px",
                        fontSize: 13, lineHeight: 1.7,
                        color: "#c8d6e5",
                        fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
                        overflowX: "auto",
                    }}>
                        {INSTALL_SNIPPET}
                    </pre>
                </div>

                {/* npm */}
                <div style={{
                    marginTop: 16,
                    background: "#0d1526",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 10, padding: "12px 16px",
                    fontFamily: "monospace", fontSize: 13, color: "#64748b",
                }}>
                    <span style={{ color: "#4a5c78" }}>$ </span>
                    <span style={{ color: "#fbbf24" }}>npx</span>
                    <span style={{ color: "#c8d6e5" }}> -y oracle-h-mcp</span>
                </div>

                {/* Links */}
                <div style={{
                    display: "flex", gap: 20, justifyContent: "center",
                    marginTop: 28, flexWrap: "wrap",
                }}>
                    {[
                        { label: "npm package", href: "https://www.npmjs.com/package/oracle-h-mcp" },
                        { label: "smithery.ai", href: "https://smithery.ai/server/@tponscr-debug/oracle-h-mcp" },
                        { label: "OpenAPI spec", href: "/openapi.json" },
                        { label: "llms.txt", href: "/llms.txt" },
                    ].map(({ label, href }) => (
                        <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{
                            fontSize: 13, color: "#4a5c78",
                            textDecoration: "none",
                            borderBottom: "1px solid rgba(74,92,120,0.3)",
                            paddingBottom: 1,
                        }}>
                            {label}
                        </a>
                    ))}
                </div>
            </section>

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <footer style={{
                borderTop: "1px solid rgba(251,191,36,0.06)",
                padding: "24px",
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap", gap: 12,
                maxWidth: 1100, margin: "0 auto",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#fbbf24", fontSize: 16 }}>⬡</span>
                    <span style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 600, fontSize: 13,
                        color: "#4a5c78",
                    }}>
                        ORACLE-H · Human-on-the-Loop · MIT License
                    </span>
                </div>
                <Link href="/dashboard" style={{
                    fontSize: 13, color: "#4a5c78",
                    textDecoration: "none",
                }}>
                    Approval Dashboard →
                </Link>
            </footer>

            {/* Responsive */}
            <style>{`
                @media (min-width: 768px) {
                    .hero-grid { grid-template-columns: 1fr 1fr !important; }
                    .human-grid { grid-template-columns: 1fr 1fr !important; }
                }
            `}</style>
        </div>
    );
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{ textAlign: "center" }}>
            <div style={{
                fontSize: "1.6rem", fontWeight: 700,
                fontFamily: "'Space Grotesk', monospace",
                color,
            }}>
                {value}
            </div>
            <div style={{ fontSize: 11, color: "#4a5c78", marginTop: 2 }}>
                {label}
            </div>
        </div>
    );
}

function ApproverCard({
    initial, name, role, status, color, decisions,
}: {
    initial: string; name: string; role: string;
    status: "online" | "offline"; color: string; decisions: number;
}) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 14,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14, padding: "16px 18px",
        }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${color}, ${color}88)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 0 20px ${color}30`,
                }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>
                        {initial}
                    </span>
                </div>
                <div style={{
                    position: "absolute", bottom: 2, right: 2,
                    width: 10, height: 10, borderRadius: "50%",
                    background: status === "online" ? "#34d399" : "#4a5c78",
                    border: "2px solid #0a0f1e",
                    boxShadow: status === "online" ? "0 0 6px rgba(52,211,153,0.6)" : "none",
                }} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontSize: 16, fontWeight: 700, color: "#f0f4ff",
                    fontFamily: "'Space Grotesk', sans-serif",
                }}>
                    {name}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    {role}
                </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{
                    fontSize: 20, fontWeight: 700, color: "#34d399",
                    fontFamily: "'Space Grotesk', monospace",
                }}>
                    {decisions}
                </div>
                <div style={{ fontSize: 11, color: "#4a5c78" }}>
                    decisions
                </div>
            </div>
        </div>
    );
}
