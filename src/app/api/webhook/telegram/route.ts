/**
 * ORACLE-H — POST /api/webhook/telegram
 *
 * Reçoit les interactions (clics sur les boutons) depuis Telegram.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { notifyClients } from "@/lib/sse";
import { dispatchWebhook } from "@/lib/webhook";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // On ne gère que les callback_queries (clics boutons)
        if (!body.callback_query) {
            return NextResponse.json({ ok: true });
        }

        const callbackQuery = body.callback_query;
        const data = callbackQuery.data as string; // ex: "decide|req_1234|approved"
        const chatId = callbackQuery.message.chat.id;
        const messageId = callbackQuery.message.message_id;

        if (!data.startsWith("decide|")) {
            return NextResponse.json({ ok: true });
        }

        const parts = data.split("|");
        if (parts.length !== 3) {
            return NextResponse.json({ ok: true });
        }

        const requestId = parts[1];
        const decision = parts[2] as "approved" | "rejected";

        // Traitement de la décision en base de données (identique à /api/v1/decide)
        const db = getDb();

        const request = db.prepare(`
            SELECT vr.*, a.callback_url AS agent_callback_url, a.signature_key
            FROM validation_requests vr
            JOIN agents a ON a.id = vr.agent_id
            WHERE vr.id = ?
        `).get(requestId) as any;

        if (!request) {
            await answerCallback(callbackQuery.id, "Requête introuvable.", true);
            return NextResponse.json({ ok: true });
        }

        if (request.status !== "pending") {
            await answerCallback(callbackQuery.id, "Requête déjà traitée.", true);
            await editMessage(chatId, messageId, request);
            return NextResponse.json({ ok: true });
        }

        const timestamp = new Date().toISOString();
        const crypto = require("crypto");
        const agentSignature = crypto
            .createHmac("sha256", request.signature_key)
            .update(`${requestId}.${decision}.${timestamp}`)
            .digest("hex");

        const updateStmt = db.prepare(`
            UPDATE validation_requests
            SET status = ?, updated_at = ?
            WHERE id = ? AND status = 'pending'
        `);

        const result = updateStmt.run(decision, timestamp, requestId);

        if (result.changes === 0) {
            await answerCallback(callbackQuery.id, "Conflit : requête déjà modifiée", true);
            return NextResponse.json({ ok: true });
        }

        const decisionId = `dec_${require("nanoid").nanoid(12)}`;
        db.prepare(`
            INSERT INTO decisions (id, request_id, decision, decided_by, agent_signature, webhook_sent)
            VALUES (?, ?, ?, ?, ?, 0)
        `).run(decisionId, requestId, decision, "telegram_admin", agentSignature);

        // Notifier Dashboard SSE
        notifyClients({ type: "decision_made", requestId, decision });

        // Envoi au webhook de l'agent
        const webhookResult = await dispatchWebhook(
            request.agent_callback_url,
            {
                oracle_version: "1.0",
                request_id: requestId,
                agent_id: request.agent_id,
                decision: decision,
                decided_by: "human",
                timestamp: timestamp,
                reliability: {
                    p_before: request.p_success_before,
                    p_after: request.p_success_after,
                },
                message: `L'action a été ${decision === "approved" ? "approuvée" : "refusée"} par le superviseur ORACLE-H via Telegram.`,
            }
        );

        db.prepare(`
            UPDATE decisions SET webhook_sent = ? WHERE id = ?
        `).run(webhookResult.success ? 1 : 0, decisionId);

        // Mettre à jour l'objet pour l'affichage Telegram
        request.status = decision;
        request.decision_timestamp = timestamp;

        // Answer callback pour retirer le spinner sur Telegram
        await answerCallback(callbackQuery.id, `Action ${decision === "approved" ? "Approuvée" : "Refusée"} avec succès !`);

        // Modifier le message Telegram pour supprimer les boutons et afficher la confirmation
        await editMessage(chatId, messageId, request);

        return NextResponse.json({ ok: true });

    } catch (err) {
        console.error("Erreur Webhook Telegram:", err);
        return NextResponse.json({ ok: true }); // Toujours 200 à Telegram pour ne pas qu'ils retry en boucle
    }
}

async function answerCallback(callbackQueryId: string, text: string, showAlert = false) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;
    try {
        await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text,
                show_alert: showAlert
            })
        });
    } catch (e) {
        console.error(e);
    }
}

async function editMessage(chatId: string | number, messageId: string | number, request: any) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;

    const emoji = request.status === "approved" ? "✅" : "❌";
    const actionStr = request.status === "approved" ? "APPROUVÉE" : "REFUSÉE";

    const text = `${emoji} <b>Action ${actionStr}</b>\n\n` +
        `🤖 <b>Agent:</b> ${request.agent_id}\n` +
        `💰 <b>Montant:</b> $${request.financial_amount.toLocaleString("fr-FR")}\n` +
        `🎯 <b>Action:</b> ${request.action}\n\n` +
        `👤 Validé via Telegram\n` +
        `⏱ ${request.decision_timestamp}`;

    try {
        await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text,
                parse_mode: "HTML",
                reply_markup: { inline_keyboard: [] } // Supprime les boutons
            })
        });
    } catch (e) {
        console.error(e);
    }
}
