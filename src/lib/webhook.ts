/**
 * ORACLE-H — Signed Webhook Dispatcher
 *
 * Envoie un webhook HMAC-SHA256 signé à l'agent après décision humaine.
 * L'agent doit vérifier l'en-tête X-Oracle-Signature pour s'assurer
 * que la réponse provient bien d'ORACLE-H.
 *
 * Signature : HMAC-SHA256(secret, "timestamp.body")
 * Format header : X-Oracle-Signature: sha256=<hex_digest>
 */

import crypto from "crypto";

const WEBHOOK_SECRET = process.env.ORACLE_WEBHOOK_SECRET || "oracle-h-dev-secret-change-in-production";
const WEBHOOK_TIMEOUT_MS = 5000;

export interface WebhookPayload {
    oracle_version: "1.0";
    request_id: string;
    agent_id: string;
    decision: "approved" | "rejected";
    decided_by: "human";
    timestamp: string;
    reliability: {
        p_before: number;
        p_after: number;
    };
    message: string;
}

/**
 * signPayload — Génère la signature HMAC-SHA256.
 */
function signPayload(timestamp: string, body: string): string {
    const data = `${timestamp}.${body}`;
    const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
    hmac.update(data);
    return `sha256=${hmac.digest("hex")}`;
}

/**
 * dispatchWebhook — Envoie le webhook signé à l'URL de callback de l'agent.
 * Retourne true si le webhook a été reçu avec succès (2xx).
 */
export async function dispatchWebhook(
    callbackUrl: string,
    payload: WebhookPayload
): Promise<{ success: boolean; status?: number; error?: string }> {
    const body = JSON.stringify(payload);
    const timestamp = payload.timestamp;
    const signature = signPayload(timestamp, body);

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

        const response = await fetch(callbackUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Oracle-Signature": signature,
                "X-Oracle-Timestamp": timestamp,
                "User-Agent": "ORACLE-H/1.0",
            },
            body,
            signal: controller.signal,
        });

        clearTimeout(timeout);
        return { success: response.ok, status: response.status };
    } catch (err: any) {
        return {
            success: false,
            error: err?.name === "AbortError" ? "Webhook timeout (5s)" : err?.message,
        };
    }
}
