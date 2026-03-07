"use client";

/**
 * ORACLE-H — AuditLog Component
 *
 * Log immuable des décisions humaines.
 * Chaque entrée inclut : timestamp ISO, ID requête, décision,
 * signature HMAC de l'agent et statut du webhook.
 *
 * Requis pour les secteurs réglementés (traçabilité complète).
 */

interface AuditEntry {
    id: string;
    request_id: string;
    agent_name: string;
    action: string;
    decision: "approved" | "rejected";
    decided_by: string;
    agent_signature: string;
    webhook_sent: number;
    decision_timestamp: string;
    financial_amount: number;
}

interface AuditLogProps {
    entries: AuditEntry[];
}

export default function AuditLog({ entries }: AuditLogProps) {
    if (entries.length === 0) {
        return (
            <div className="text-center py-8" style={{ color: "#4a5c78" }}>
                <div className="text-3xl mb-2">📋</div>
                <p className="text-sm">Aucune décision enregistrée</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {entries.map((entry) => (
                <div
                    key={entry.id}
                    className="oracle-card p-3 md:p-4 animate-fade-in"
                >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        {/* Left */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${entry.decision === "approved" ? "badge-approved" : "badge-rejected"
                                        }`}
                                >
                                    {entry.decision === "approved" ? "✓ APPROUVÉ" : "✕ REFUSÉ"}
                                </span>
                                <span className="text-xs" style={{ color: "#7a8ba8" }}>
                                    par {entry.decided_by}
                                </span>
                                <span
                                    className="text-xs px-1.5 py-0.5 rounded"
                                    style={{
                                        background: entry.webhook_sent
                                            ? "rgba(52,211,153,0.08)"
                                            : "rgba(251,113,133,0.08)",
                                        color: entry.webhook_sent ? "#34d399" : "#fb7185",
                                    }}
                                >
                                    {entry.webhook_sent ? "↗ Webhook OK" : "↗ Webhook KO"}
                                </span>
                            </div>

                            <p className="text-sm truncate" style={{ color: "#c5d0e8" }}>
                                {entry.action}
                            </p>

                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span className="text-xs font-mono" style={{ color: "#4a5c78" }}>
                                    #{entry.request_id.slice(4, 16)}
                                </span>
                                <span className="text-xs" style={{ color: "#4a5c78" }}>
                                    {entry.agent_name}
                                </span>
                                <span className="text-xs font-mono break-all" style={{ color: "#2a3a5a", fontSize: "0.65rem" }}>
                                    sig: {entry.agent_signature.slice(0, 20)}…
                                </span>
                            </div>
                        </div>

                        {/* Right */}
                        <div className="text-right shrink-0">
                            {entry.financial_amount > 0 && (
                                <div className="amount-display text-sm font-bold" style={{ color: "#fbbf24" }}>
                                    ${entry.financial_amount.toLocaleString("fr-FR")}
                                </div>
                            )}
                            <div className="text-xs mt-1" style={{ color: "#4a5c78" }} suppressHydrationWarning>
                                {new Date(entry.decision_timestamp).toLocaleString("fr-FR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
