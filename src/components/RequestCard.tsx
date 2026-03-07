"use client";

/**
 * ORACLE-H — RequestCard Component
 *
 * Carte principale de décision humaine.
 * Affiche toutes les informations critiques et les boutons d'action.
 *
 * Props :
 *   request  : données de la requête (depuis /api/v1/requests)
 *   onDecide : callback appelé après APPROUVER / REFUSER
 */

import { useState } from "react";

interface Request {
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
}

interface RequestCardProps {
    request: Request;
    onDecide: (requestId: string, decision: "approved" | "rejected") => void;
    isHighlighted?: boolean;
}

function TimeAgo({ dateStr }: { dateStr: string }) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return <span suppressHydrationWarning>À l&apos;instant</span>;
    if (mins < 60) return <span suppressHydrationWarning>Il y a {mins} min</span>;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return <span suppressHydrationWarning>Il y a {hrs}h</span>;
    return <span suppressHydrationWarning>Il y a {Math.floor(hrs / 24)}j</span>;
}

export default function RequestCard({
    request,
    onDecide,
    isHighlighted = false,
}: RequestCardProps) {
    const [loading, setLoading] = useState<"approved" | "rejected" | null>(null);
    const [decided, setDecided] = useState(
        request.status !== "pending" ? request.status : null
    );

    const commissionRate = 0.005; // 0.5% commission ORACLE-H
    const commission = request.financial_amount * commissionRate;

    async function handleDecide(decision: "approved" | "rejected") {
        if (loading || decided) return;
        setLoading(decision);

        try {
            const res = await fetch("/api/v1/decide", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-oracle-admin-secret":
                        process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "oracle-admin-dev-secret",
                },
                body: JSON.stringify({ request_id: request.id, decision }),
            });

            if (res.ok) {
                setDecided(decision);
                onDecide(request.id, decision);
            }
        } finally {
            setLoading(null);
        }
    }

    const isPending = !decided && request.status === "pending";

    return (
        <div
            className={`oracle-card p-4 md:p-5 animate-fade-in ${isHighlighted ? "ring-2 ring-amber-400/50" : ""
                } ${decided === "approved" ? "opacity-70" : ""} ${decided === "rejected" ? "opacity-50" : ""
                }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Agent badge */}
                    <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                            background: "rgba(251,191,36,0.08)",
                            color: "#fbbf24",
                            border: "1px solid rgba(251,191,36,0.2)",
                        }}
                    >
                        {request.agent_name}
                    </span>

                    {/* Watchdog alert */}
                    {request.watchdog_alert ? (
                        <span className="badge-watchdog px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                            ⚠ WATCHDOG
                        </span>
                    ) : null}

                    {/* Status badge — if already decided */}
                    {decided && (
                        <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${decided === "approved" ? "badge-approved" : "badge-rejected"
                                }`}
                        >
                            {decided === "approved" ? "✓ APPROUVÉ" : "✕ REFUSÉ"}
                        </span>
                    )}

                    {isPending && (
                        <span className="badge-pending px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                            <span className="status-dot" style={{ width: 6, height: 6, background: "#fb923c", borderRadius: "50%", animation: "pulse-dot 2s infinite", display: "inline-block" }} />
                            EN ATTENTE
                        </span>
                    )}
                </div>

                <div className="text-right shrink-0">
                    <span
                        className="amount-display text-xl font-bold"
                        style={{ color: request.financial_amount > 0 ? "#fbbf24" : "#7a8ba8" }}
                        suppressHydrationWarning
                    >
                        {request.financial_amount > 0
                            ? `$${request.financial_amount.toLocaleString("fr-FR")}`
                            : "—"}
                    </span>
                    {commission > 0 && (
                        <div className="text-xs mt-0.5" style={{ color: "#7a8ba8" }} suppressHydrationWarning>
                            Commission: ${commission.toFixed(2)}
                        </div>
                    )}
                </div>
            </div>

            {/* Main fields */}
            <div className="space-y-3">
                {/* Action */}
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#7a8ba8" }}>
                        Action
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#f0f4ff" }}>
                        {request.action}
                    </p>
                </div>

                {/* Rationale */}
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#7a8ba8" }}>
                        Justification
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#c5d0e8" }}>
                        {request.rationale}
                    </p>
                </div>

                {/* Projected Impact — highlighted */}
                <div
                    style={{
                        background: "rgba(251,113,133,0.06)",
                        border: "1px solid rgba(251,113,133,0.15)",
                        borderRadius: 8,
                        padding: "10px 12px",
                    }}
                >
                    <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#fb7185" }}>
                        ⚡ Impact Projeté
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#f0c0c8" }}>
                        {request.projected_impact}
                    </p>
                </div>
            </div>

            {/* Reliability bar */}
            <div className="mt-4 mb-4">
                <div className="flex justify-between text-xs mb-1" style={{ color: "#7a8ba8" }}>
                    <span>Fiabilité sans ORACLE-H</span>
                    <span>Avec ORACLE-H</span>
                </div>
                <div className="relative h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    {/* before bar */}
                    <div
                        className="absolute left-0 top-0 h-2 rounded-full"
                        style={{
                            width: `${request.p_success_before * 100}%`,
                            background: "rgba(251,146,60,0.6)",
                        }}
                    />
                    {/* after bar */}
                    <div
                        className="absolute left-0 top-0 h-2 rounded-full transition-all duration-700"
                        style={{
                            width: `${request.p_success_after * 100}%`,
                            background: "linear-gradient(90deg, #34d399, #10b981)",
                            opacity: 0.8,
                        }}
                    />
                </div>
                <div className="flex justify-between text-xs mt-1">
                    <span style={{ color: "#fb923c" }}>
                        {(request.p_success_before * 100).toFixed(0)}%
                    </span>
                    <span style={{ color: "#34d399" }}>
                        {(request.p_success_after * 100).toFixed(1)}%
                    </span>
                </div>
            </div>

            {/* Footer: timestamp + buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: "rgba(251,191,36,0.08)" }}>
                <span className="text-xs" style={{ color: "#4a5c78" }}>
                    <TimeAgo dateStr={request.created_at} />
                    {" · "}
                    <code className="text-xs" style={{ color: "#4a5c78" }}>
                        {request.id.slice(0, 16)}
                    </code>
                </span>

                {isPending && (
                    <div className="flex gap-2">
                        <button
                            className="btn-reject"
                            onClick={() => handleDecide("rejected")}
                            disabled={!!loading}
                            aria-label="Refuser cette action"
                        >
                            {loading === "rejected" ? "…" : "✕ REFUSER"}
                        </button>
                        <button
                            className="btn-approve"
                            onClick={() => handleDecide("approved")}
                            disabled={!!loading}
                            aria-label="Approuver cette action"
                        >
                            {loading === "approved" ? "…" : "✓ APPROUVER"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
