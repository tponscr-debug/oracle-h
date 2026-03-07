/**
 * ORACLE-H — POST /api/v1/decide
 *
 * Endpoint interne appelé par le dashboard humain lors d'une décision.
 * Protégé par un secret admin (header X-Oracle-Admin-Secret).
 *
 * Actions :
 *  1. Met à jour le statut de la requête (approved/rejected)
 *  2. Enregistre la décision dans le log d'audit
 *  3. Dispatch le webhook signé vers le callback_url de l'agent
 *  4. Notifie le dashboard via SSE
 *
 * @body {
 *   request_id : string  — ID de la requête à décider
 *   decision   : "approved" | "rejected"
 *   decided_by : string? — Identifiant de l'humain (défaut: "human")
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { getDb, ValidationRequest } from "@/lib/db";
import { dispatchWebhook } from "@/lib/webhook";
import { notifyClients } from "@/lib/sse";

const ADMIN_SECRET = process.env.ORACLE_ADMIN_SECRET || "oracle-admin-dev-secret";

const DecideSchema = z.object({
    request_id: z.string().min(1),
    decision: z.enum(["approved", "rejected"]),
    decided_by: z.string().default("human"),
});

export async function POST(req: NextRequest) {
    // Auth check
    const adminSecret = req.headers.get("x-oracle-admin-secret");
    if (adminSecret !== ADMIN_SECRET) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const parsed = DecideSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Payload invalide", details: parsed.error.flatten().fieldErrors },
            { status: 400 }
        );
    }

    const { request_id, decision, decided_by } = parsed.data;
    const db = getDb();

    // Fetch the request + agent info
    const request = db.prepare(`
    SELECT vr.*, a.callback_url AS agent_callback_url, a.signature_key
    FROM validation_requests vr
    JOIN agents a ON a.id = vr.agent_id
    WHERE vr.id = ?
  `).get(request_id) as (ValidationRequest & { agent_callback_url: string; signature_key: string }) | undefined;

    if (!request) {
        return NextResponse.json({ error: "Requête introuvable" }, { status: 404 });
    }

    if (request.status !== "pending") {
        return NextResponse.json(
            { error: `Requête déjà traitée (status: ${request.status})` },
            { status: 409 }
        );
    }

    const timestamp = new Date().toISOString();
    // Generate audit signature: HMAC of "request_id.decision.timestamp"
    const agentSignature = crypto
        .createHmac("sha256", request.signature_key)
        .update(`${request_id}.${decision}.${timestamp}`)
        .digest("hex");

    // Atomic transaction — prevents race condition with Telegram webhook
    const decisionId = `dec_${nanoid(12)}`;
    const commitDecision = db.transaction(() => {
        const result = db.prepare(`
      UPDATE validation_requests
      SET status = ?, updated_at = ?
      WHERE id = ? AND status = 'pending'
    `).run(decision, timestamp, request_id);

        if (result.changes === 0) return false;

        db.prepare(`
      INSERT INTO decisions (id, request_id, decision, decided_by, agent_signature, webhook_sent)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(decisionId, request_id, decision, decided_by, agentSignature);

        return true;
    });

    if (!commitDecision()) {
        return NextResponse.json(
            { error: `Requête déjà traitée (conflit concurrent)` },
            { status: 409 }
        );
    }

    // Dispatch webhook to agent
    const webhookPayload = {
        oracle_version: "1.0" as const,
        request_id,
        agent_id: request.agent_id,
        decision,
        decided_by: "human" as const,
        timestamp,
        reliability: {
            p_before: request.p_success_before,
            p_after: request.p_success_after,
        },
        message:
            decision === "approved"
                ? "Action approuvée par l'opérateur humain ORACLE-H. Vous pouvez procéder."
                : "Action refusée par l'opérateur humain ORACLE-H. Arrêtez l'exécution.",
    };

    const webhookResult = await dispatchWebhook(request.agent_callback_url, webhookPayload);

    // Update webhook_sent status
    db.prepare(`
    UPDATE decisions SET webhook_sent = ? WHERE id = ?
  `).run(webhookResult.success ? 1 : 0, decisionId);

    // Notify dashboard via SSE
    notifyClients({ type: "decision_made", requestId: request_id, decision });

    return NextResponse.json({
        success: true,
        decision_id: decisionId,
        request_id,
        decision,
        timestamp,
        agent_signature: agentSignature,
        webhook: webhookResult,
    });
}
