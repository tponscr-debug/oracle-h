"use client";

/**
 * ORACLE-H — StatsBar Component
 *
 * Barre de statistiques en temps réel affichée en haut du dashboard.
 * Montre : requêtes en attente, approuvées, refusées, montant total.
 */

interface Stats {
    pending: number;
    approved: number;
    rejected: number;
    total_amount: number;
}

interface StatsBarProps {
    stats: Stats;
    isLive: boolean;
}

export default function StatsBar({ stats, isLive }: StatsBarProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Pending */}
            <div className="oracle-card p-3 md:p-4">
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "#7a8ba8" }}>
                    En attente
                </div>
                <div className="flex items-end gap-2">
                    <span className="amount-display text-2xl font-bold" style={{ color: "#fb923c" }}>
                        {stats.pending}
                    </span>
                    {stats.pending > 0 && (
                        <span className="status-dot live mb-1 pulse-dot" />
                    )}
                </div>
            </div>

            {/* Approved */}
            <div className="oracle-card p-3 md:p-4">
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "#7a8ba8" }}>
                    Approuvées
                </div>
                <span className="amount-display text-2xl font-bold" style={{ color: "#34d399" }}>
                    {stats.approved}
                </span>
            </div>

            {/* Rejected */}
            <div className="oracle-card p-3 md:p-4">
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "#7a8ba8" }}>
                    Refusées
                </div>
                <span className="amount-display text-2xl font-bold" style={{ color: "#fb7185" }}>
                    {stats.rejected}
                </span>
            </div>

            {/* Total amount */}
            <div className="oracle-card p-3 md:p-4">
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "#7a8ba8" }}>
                    Volume supervisé
                </div>
                <span className="amount-display text-2xl font-bold" style={{ color: "#fbbf24" }} suppressHydrationWarning>
                    ${stats.total_amount.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
                </span>
            </div>

            {/* SSE status - spans full width on mobile */}
            <div className="col-span-2 md:col-span-4 flex items-center gap-2 px-1">
                <span className={`status-dot ${isLive ? "live pulse-dot" : "dead"}`} />
                <span className="text-xs" style={{ color: "#4a5c78" }}>
                    {isLive ? "Flux temps réel connecté" : "Reconnexion en cours…"}
                </span>
            </div>
        </div>
    );
}
