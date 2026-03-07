"use client";

/**
 * ORACLE-H — Dashboard Principal
 *
 * Page mobile-first "Human-on-the-Loop".
 * 
 * Architecture :
 *  - Chargement initial des requêtes via /api/v1/requests
 *  - Abonnement SSE pour les mises à jour temps réel
 *  - Onglets "En attente" / "Journal d'audit"
 *  - Stats en temps réel
 */

import { useEffect, useState, useCallback, useRef } from "react";
import RequestCard from "@/components/RequestCard";
import AuditLog from "@/components/AuditLog";
import StatsBar from "@/components/StatsBar";

interface RequestData {
    id: string;
    agent_id: string;
    agent_name: string;
    action: string;
    rationale: string;
    projected_impact: string;
    financial_amount: number;
    status: "pending" | "approved" | "rejected";
    watchdog_alert: number;
    p_success_before: number;
    p_success_after: number;
    created_at: string;
    updated_at: string;
    decision?: "approved" | "rejected";
    decided_by?: string;
    agent_signature?: string;
    webhook_sent?: number;
    decision_timestamp?: string;
}

export default function Dashboard() {
    const [requests, setRequests] = useState<RequestData[]>([]);
    const [isLive, setIsLive] = useState(false);
    const [activeTab, setActiveTab] = useState<"pending" | "audit">("pending");
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const sseRef = useRef<EventSource | null>(null);

    // Fetch initial data
    const fetchRequests = useCallback(async () => {
        try {
            const res = await fetch("/api/v1/requests?status=all&limit=100");
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests || []);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // SSE subscription
    const connectSSE = useCallback(() => {
        if (sseRef.current) {
            sseRef.current.close();
        }

        const es = new EventSource("/api/sse");
        sseRef.current = es;

        es.onopen = () => setIsLive(true);
        es.onerror = () => {
            setIsLive(false);
            // Reconnect after 3s
            setTimeout(connectSSE, 3000);
        };

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "new_request") {
                    setHighlightedId(data.requestId);
                    fetchRequests();
                    setActiveTab("pending");
                    setTimeout(() => setHighlightedId(null), 5000);
                } else if (data.type === "decision_made") {
                    fetchRequests();
                }
            } catch { /* ignore parse errors */ }
        };

        return () => es.close();
    }, [fetchRequests]);

    useEffect(() => {
        fetchRequests();
        const cleanup = connectSSE();

        // Parse highlight from URL (e.g., dashboard_url from /validate response)
        const params = new URLSearchParams(window.location.search);
        const highlight = params.get("highlight");
        if (highlight) setHighlightedId(highlight);

        return cleanup;
    }, [fetchRequests, connectSSE]);

    // Handle decision (optimistic update)
    const handleDecide = useCallback(
        (requestId: string, decision: "approved" | "rejected") => {
            setRequests((prev) =>
                prev.map((r) =>
                    r.id === requestId ? { ...r, status: decision } : r
                )
            );
        },
        []
    );

    // Computed lists
    const pendingList = requests.filter((r) => r.status === "pending");
    const decidedList = requests.filter((r) => r.status !== "pending");

    const stats = {
        pending: pendingList.length,
        approved: requests.filter((r) => r.status === "approved").length,
        rejected: requests.filter((r) => r.status === "rejected").length,
        total_amount: requests.reduce((s, r) => s + r.financial_amount, 0),
    };

    return (
        <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
            {/* Header */}
            <header
                className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between"
                style={{
                    background: "rgba(10,15,30,0.85)",
                    backdropFilter: "blur(12px)",
                    borderBottom: "1px solid rgba(251,191,36,0.1)",
                }}
            >
                <div className="flex items-center gap-3">
                    {/* Logo */}
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                            background: "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))",
                            border: "1px solid rgba(251,191,36,0.3)",
                        }}
                    >
                        <span style={{ color: "#fbbf24", fontSize: "1rem" }}>⬡</span>
                    </div>
                    <div>
                        <div className="font-bold text-sm tracking-wider" style={{ color: "#f0f4ff", fontFamily: "'Space Grotesk', monospace" }}>
                            ORACLE-H
                        </div>
                        <div className="text-xs" style={{ color: "#4a5c78" }}>
                            Human-on-the-Loop
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {pendingList.length > 0 && (
                        <div
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                            style={{
                                background: "rgba(251,146,60,0.12)",
                                color: "#fb923c",
                                border: "1px solid rgba(251,146,60,0.3)",
                            }}
                        >
                            <span className="pulse-dot" style={{ width: 6, height: 6, background: "#fb923c", borderRadius: "50%", display: "inline-block" }} />
                            {pendingList.length} en attente
                        </div>
                    )}
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-2xl mx-auto px-4 py-5 space-y-5 pb-24">
                {/* Stats */}
                <StatsBar stats={stats} isLive={isLive} />

                {/* Tabs */}
                <div
                    className="flex rounded-lg p-1 gap-1"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                    {(["pending", "audit"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-150"
                            style={{
                                background: activeTab === tab ? "rgba(251,191,36,0.12)" : "transparent",
                                color: activeTab === tab ? "#fbbf24" : "#7a8ba8",
                                border: activeTab === tab ? "1px solid rgba(251,191,36,0.25)" : "1px solid transparent",
                            }}
                        >
                            {tab === "pending"
                                ? `En attente ${pendingList.length > 0 ? `(${pendingList.length})` : ""}`
                                : `Journal d'audit ${decidedList.length > 0 ? `(${decidedList.length})` : ""}`}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="oracle-card p-5 h-48 skeleton" />
                        ))}
                    </div>
                ) : activeTab === "pending" ? (
                    <div className="space-y-3">
                        {pendingList.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="text-5xl mb-4">✓</div>
                                <p className="text-lg font-semibold" style={{ color: "#34d399" }}>
                                    File d&apos;attente vide
                                </p>
                                <p className="text-sm mt-1" style={{ color: "#4a5c78" }}>
                                    Aucune action en attente de validation
                                </p>
                                <div className="mt-6 p-4 oracle-card text-left">
                                    <p className="text-xs font-mono mb-2" style={{ color: "#7a8ba8" }}>
                                        Test rapide — soumettez une requête :
                                    </p>
                                    <pre
                                        className="text-xs overflow-x-auto"
                                        style={{ color: "#4a5c78", lineHeight: 1.6 }}
                                    >{`curl -X POST /api/v1/validate \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "agent-demo-001",
    "action": "Transfer 500 USDC",
    "rationale": "Optimal settlement route",
    "projected_impact": "Risk: loss of 500 USDC",
    "financial_amount": 500,
    "callback_url": "https://webhook.site/test"
  }'`}</pre>
                                </div>
                            </div>
                        ) : (
                            pendingList.map((req) => (
                                <RequestCard
                                    key={req.id}
                                    request={req}
                                    onDecide={handleDecide}
                                    isHighlighted={req.id === highlightedId}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <AuditLog
                        entries={decidedList.map((r) => ({
                            id: r.id,
                            request_id: r.id,
                            agent_name: r.agent_name,
                            action: r.action,
                            decision: (r.decision || r.status) as "approved" | "rejected",
                            decided_by: r.decided_by || "human",
                            agent_signature: r.agent_signature || "—",
                            webhook_sent: r.webhook_sent ?? 0,
                            decision_timestamp: r.decision_timestamp || r.updated_at,
                            financial_amount: r.financial_amount,
                        }))}
                    />
                )}
            </main>
        </div>
    );
}
