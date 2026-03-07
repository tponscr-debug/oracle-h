/**
 * ORACLE-H — Reliability Calculator
 *
 * Calcule la "Fiabilité Composée" d'un workflow multi-étapes.
 *
 * Sans intervention humaine (HOTL), chaque étape a une fiabilité r.
 * Pour n étapes : P_success = r^n
 *
 * Exemple standard Oracle : r=0.95, n=20 → P ≈ 0.358 (35.8%)
 * Avec HOTL (validation humaine) : chaque étape passe à ~0.999
 * Ce qui donne pour 20 étapes : 0.999^20 ≈ 0.980 (98%)
 *
 * Pour communiquer l'enjeu, on affiche le gain de fiabilité.
 */

export interface ReliabilityResult {
    /** Probabilité de succès sans intervention humaine (ex: 0.81) */
    p_before: number;
    /** Probabilité de succès avec validation ORACLE-H (ex: 0.999) */
    p_after: number;
    /** Gain absolu de fiabilité */
    gain: number;
    /** Résumé lisible pour l'agent et l'humain */
    summary: string;
}

/**
 * calculateReliability — Computes HOTL reliability improvement.
 *
 * @param steps   Nombre d'étapes du workflow de l'agent
 * @param r_base  Fiabilité de base par étape (défaut: 0.95)
 * @param r_hotl  Fiabilité avec validation humaine par étape (défaut: 0.999)
 */
export function calculateReliability(
    steps: number = 4,
    r_base: number = 0.95,
    r_hotl: number = 0.999
): ReliabilityResult {
    const p_before = Math.pow(r_base, steps);
    const p_after = Math.pow(r_hotl, steps);
    const gain = p_after - p_before;

    const pct_before = (p_before * 100).toFixed(1);
    const pct_after = (p_after * 100).toFixed(1);
    const pct_gain = (gain * 100).toFixed(1);

    return {
        p_before: parseFloat(p_before.toFixed(4)),
        p_after: parseFloat(p_after.toFixed(4)),
        gain: parseFloat(gain.toFixed(4)),
        summary: `Avec ${steps} étapes, la validation ORACLE-H remonte la probabilité de succès de ${pct_before}% à ${pct_after}% (+${pct_gain}%).`,
    };
}
