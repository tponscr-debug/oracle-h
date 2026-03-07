/**
 * ORACLE-H — Anti-Hallucination Watchdog
 *
 * Détecte si un agent a perdu ses instructions de sécurité
 * lors de la compaction du contexte (context window overflow).
 *
 * Signaux détectés :
 *  1. Champs vidés ou remplacés par des ellipses ("...", "N/A", "null")
 *  2. Longueur anormalement courte (< MIN_FIELD_LENGTH caractères)
 *  3. Champs identiques (action == rationale → probable hallucination)
 *  4. Mots-clés de sécurité absents dans l'impact projeté
 */

const MIN_FIELD_LENGTH = 15;

const TRUNCATION_PATTERNS = [
    /^\s*\.{2,}\s*$/,     // "...", "......"
    /^\s*(n\/a|null|none|undefined|empty)\s*$/i,
    /^\s*\[.*\]\s*$/,     // "[TRUNCATED]", "[CONTEXT LOST]"
    /^\s*<.*>\s*$/,       // "<missing>", "<context_lost>"
];

const SAFETY_KEYWORDS = [
    "risk", "risque", "perte", "loss", "erreur", "error",
    "impact", "conséquence", "consequence", "danger", "faillite",
    "critique", "critical", "affecter", "affect",
];

export interface WatchdogResult {
    /** True si une anomalie de contexte est détectée */
    triggered: boolean;
    /** Liste des raisons (pour debug et auditabilité) */
    reasons: string[];
}

/**
 * runWatchdog — Analyse les champs d'une requête d'agent.
 *
 * @param action          Tâche technique décrite par l'agent
 * @param rationale       Justification de l'agent
 * @param projected_impact Impact/risque projeté
 */
export function runWatchdog(
    action: string,
    rationale: string,
    projected_impact: string
): WatchdogResult {
    const reasons: string[] = [];

    const fields = { action, rationale, projected_impact };

    // 1. Patterns de troncature
    for (const [key, value] of Object.entries(fields)) {
        if (TRUNCATION_PATTERNS.some((p) => p.test(value))) {
            reasons.push(`Champ "${key}" semble tronqué ou vide : "${value}"`);
        }
    }

    // 2. Longueur minimale
    for (const [key, value] of Object.entries(fields)) {
        if (value.trim().length < MIN_FIELD_LENGTH) {
            reasons.push(
                `Champ "${key}" trop court (${value.trim().length} chars < ${MIN_FIELD_LENGTH})`
            );
        }
    }

    // 3. Champs identiques (signe d'hallucination par copier-coller)
    if (action.trim() === rationale.trim()) {
        reasons.push("action et rationale sont identiques — possible hallucination");
    }
    if (rationale.trim() === projected_impact.trim()) {
        reasons.push("rationale et projected_impact sont identiques — possible hallucination");
    }

    // 4. Aucun mot-clé de sécurité dans projected_impact
    const impactLower = projected_impact.toLowerCase();
    const hasSecurityKeyword = SAFETY_KEYWORDS.some((kw) => impactLower.includes(kw));
    if (!hasSecurityKeyword) {
        reasons.push(
            "projected_impact ne contient aucun mot-clé de risque/sécurité — instructions de sécurité peut-être perdues"
        );
    }

    return {
        triggered: reasons.length > 0,
        reasons,
    };
}
