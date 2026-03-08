/**
 * ORACLE-H — POST /api/v1/validate
 *
 * Point d'entrée principal pour les agents autonomes.
 * 
 * L'agent soumet une action à valider par un humain.
 * Le Watchdog vérifie l'intégrité du contexte.
 * Le calculateur de fiabilité retourne l'amélioration P_success.
 * La requête est stockée en DB avec status "pending".
 * Le dashboard humain reçoit la notification en temps réel (SSE).
 *
 * @body {
 *   agent_id         : string  — ID de l'agent enregistré
 *   action           : string  — Description technique de la tâche
 *   rationale        : string  — Pourquoi c'est la voie optimale
 *   projected_impact : string  — Risque financier/système en cas d'erreur
 *   financial_amount : number  — Montant en jeu (en USDC ou EUR)
 *   callback_url     : string  — URL de webhook pour recevoir la décision
 *   workflow_steps   : number? — Nombre d'étapes du workflow (défaut: 4)
 * }
 *
 * @returns 202 Accepted + { request_id, dashboard_url, reliability }
 * @returns 400 Bad Request + { error, watchdog? }
 * @returns 404 Not Found si agent_id inconnu
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { runWatchdog } from "@/lib/watchdog";
import { calculateReliability } from "@/lib/reliability";
import { notifyClients } from "@/lib/sse";

// ── Schéma de validation Zod ─────────────────────────────────────────────────

const ValidateSchema = z.object({
    action: z.string().min(1, "action requise"),
    rationale: z.string().min(1, "rationale requis"),
    projected_impact: z.string().min(1, "projected_impact requis"),
    financial_amount: z.number().min(0, "financial_amount doit être >= 0"),
    callback_url: z.string().url("callback_url doit être une URL valide").optional(),
    workflow_steps: z.number().int().min(1).max(100).optional().default(4),
    expires_in_seconds: z.number().int().min(30).optional(),
});

export async function POST(req: NextRequest) {
    try {
        // 1. Parse + validation Zod
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { error: "Corps de requête JSON invalide" },
                { status: 400 }
            );
        }

        const parsed = ValidateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Payload invalide",
                    details: parsed.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const {
            action,
            rationale,
            projected_impact,
            financial_amount,
            callback_url,
            workflow_steps,
            expires_in_seconds,
        } = parsed.data;

        // 1.5 Authentification Bearer
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Authentification requise : header Authorization Bearer manquant." },
                { status: 401 }
            );
        }
        const signatureKey = authHeader.substring(7);

        // 2. Vérifier que l'agent existe par sa clé
        const db = getDb();
        const agent = db
            .prepare("SELECT * FROM agents WHERE signature_key = ?")
            .get(signatureKey) as { id: string; name: string } | undefined;

        if (!agent) {
            return NextResponse.json(
                {
                    error: "Clé d'Agent invalide ou révoquée.",
                    hint: "Utilisez la clé de l'agent de démonstration ou générez-en une nouvelle.",
                },
                { status: 401 }
            );
        }

        const agent_id = agent.id;

        // 3. Watchdog anti-hallucination
        const watchdog = runWatchdog(action, rationale, projected_impact);
        if (watchdog.triggered) {
            // On stocke quand même mais on signale
            const requestId = `req_${nanoid(12)}`;
            db.prepare(`
        INSERT INTO validation_requests
          (id, agent_id, action, rationale, projected_impact, financial_amount, status, watchdog_alert)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', 1)
      `).run(requestId, agent_id, action, rationale, projected_impact, financial_amount);

            return NextResponse.json(
                {
                    error: "Watchdog déclenché : intégrité du contexte de l'agent suspecte",
                    watchdog_alert: true,
                    reasons: watchdog.reasons,
                    request_id: requestId,
                    action: "Revérifier les instructions de sécurité de l'agent avant de soumettre à nouveau",
                },
                { status: 400 }
            );
        }



        // Calculer expires_at
        let expires_at: string | null = null;
        if (expires_in_seconds) {
            const date = new Date();
            date.setSeconds(date.getSeconds() + expires_in_seconds);
            expires_at = date.toISOString();
        }

        // 4. Calculateur de fiabilité
        const reliability = calculateReliability(workflow_steps);

        // 5. Enregistrement en base
        const requestId = `req_${nanoid(12)}`;
        db.prepare(`
      INSERT INTO validation_requests
        (id, agent_id, action, rationale, projected_impact, financial_amount,
         status, watchdog_alert, p_success_before, p_success_after, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?, ?)
    `).run(
            requestId,
            agent_id,
            action,
            rationale,
            projected_impact,
            financial_amount,
            reliability.p_before,
            reliability.p_after,
            expires_at
        );

        // 6. Notifier le dashboard en temps réel (SSE)
        notifyClients({ type: "new_request", requestId });

        const baseUrl = req.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "https://oracle-h.online";

        // 6.4. Alerte "nouvel utilisateur réel" si c'est la première requête de cet agent (hors demo)
        const DEMO_KEY = "demo-signature-key-change-in-production";
        const isRealAgent = signatureKey !== DEMO_KEY;
        if (isRealAgent) {
            const priorCount = (db.prepare(
                "SELECT COUNT(*) as cnt FROM validation_requests WHERE agent_id = ?"
            ).get(agent_id) as { cnt: number }).cnt;

            if (priorCount <= 1) {
                // C'est leur toute première requête — envoie une alerte spéciale
                const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
                const telegramChatId = process.env.TELEGRAM_CHAT_ID;
                if (telegramBotToken && telegramChatId) {
                    fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            chat_id: telegramChatId,
                            parse_mode: "HTML",
                            text: [
                                `🎉 <b>ORACLE-H — Nouvel utilisateur !</b>`,
                                ``,
                                `Un vrai agent vient de soumettre sa première requête.`,
                                ``,
                                `🤖 <b>Agent :</b> ${agent.name}`,
                                `🆔 <b>ID :</b> <code>${agent_id}</code>`,
                                `⚡ <b>Action :</b> ${action.slice(0, 100)}`,
                                ``,
                                `<a href="${baseUrl}/dashboard">Voir le dashboard →</a>`,
                            ].join("\n"),
                        }),
                    }).catch(() => {});
                }
            }
        }

        // 6.5. Notifier via Telegram (Optionnel)
        const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CHAT_ID;
        if (telegramBotToken && telegramChatId) {
            // Risk level based on financial amount and keywords
            const highRiskWords = /delet|drop|wipe|purge|destroy|payment|transfer|deploy|produc/i;
            const riskLevel = financial_amount >= 1000
                ? { emoji: "🔴", label: "RISQUE ÉLEVÉ" }
                : financial_amount > 0 || highRiskWords.test(action)
                ? { emoji: "🟡", label: "RISQUE MODÉRÉ" }
                : { emoji: "🟢", label: "RISQUE FAIBLE" };

            const expiryMins = expires_in_seconds
                ? Math.round(expires_in_seconds / 60)
                : 5;

            const sep = "━━━━━━━━━━━━━━━━━━━━━━━━";

            const telegramMessage = [
                `${riskLevel.emoji} <b>ORACLE-H · ${riskLevel.label}</b>`,
                ``,
                sep,
                ``,
                `🤖 <b>Agent</b>`,
                `${agent.name} <code>(${agent_id})</code>`,
                ``,
                `⚡ <b>Action demandée</b>`,
                `${action}`,
                ``,
                `🧠 <b>Pourquoi l'agent fait ça</b>`,
                `<i>${rationale}</i>`,
                ``,
                `🚨 <b>Ce qui se passe si c'est une erreur</b>`,
                `${projected_impact}`,
                ...(financial_amount > 0 ? [
                    ``,
                    `💰 <b>Enjeu financier</b>`,
                    `$${financial_amount.toLocaleString("en-US")}`,
                ] : []),
                ``,
                sep,
                ``,
                `📊 Sans validation : ${Math.round(reliability.p_before * 100)}% de succès`,
                `✅ Avec ta décision : <b>${Math.round(reliability.p_after * 100)}%</b>`,
                ``,
                `⏳ Expire dans <b>${expiryMins} min</b> · <code>${requestId}</code>`,
                `🔗 <a href="${baseUrl}/dashboard?highlight=${requestId}">Voir dans le dashboard</a>`,
            ].join("\n");

            fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: telegramChatId,
                    text: telegramMessage,
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "✅ Approuver", callback_data: `decide|${requestId}|approved` },
                                { text: "❌ Refuser", callback_data: `decide|${requestId}|rejected` }
                            ]
                        ]
                    }
                })
            }).then(async res => {
                if (!res.ok) console.error("[Telegram Error]", await res.text());
                else console.log("[Telegram] Push envoyé avec succès !");
            }).catch(e => console.error("[Telegram Network Error]", e));
        }

        // 7. Réponse 202 Accepted

        return NextResponse.json(
            {
                oracle_version: "1.0",
                status: "pending",
                request_id: requestId,
                agent: { id: agent_id, name: agent.name },
                dashboard_url: `${baseUrl}/?highlight=${requestId}`,
                reliability: {
                    p_before: reliability.p_before,
                    p_after: reliability.p_after,
                    gain: reliability.gain,
                    summary: reliability.summary,
                },
                message: callback_url
                    ? `Action soumise pour validation humaine. Attendez le webhook sur ${callback_url}.`
                    : `Action soumise pour validation humaine. Le mode Polling est activé, utilisez la route GET /status afin de lire le résultat.`,
                expires_at: expires_at,
                watchdog: { triggered: false },
            },
            { status: 202 }
        );
    } catch (err: any) {
        console.error("[ORACLE-H /validate]", err);
        return NextResponse.json(
            { error: "Erreur interne du serveur ORACLE-H", detail: err?.message },
            { status: 500 }
        );
    }
}
