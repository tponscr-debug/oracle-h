/**
 * ORACLE-H — GET /api/sse
 *
 * Server-Sent Events — notifications temps réel vers le dashboard.
 * Utilise le store partagé dans @/lib/sse pour éviter les imports circulaires.
 *
 * Events : new_request | decision_made | heartbeat | connected
 */

export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { addSseClient, removeSseClient } from "@/lib/sse";

export async function GET(req: NextRequest) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            addSseClient(controller);

            // Message de connexion initial
            controller.enqueue(
                encoder.encode(
                    `data: ${JSON.stringify({ type: "connected", message: "ORACLE-H SSE connecté" })}\n\n`
                )
            );

            // Heartbeat toutes les 30 secondes
            const heartbeat = setInterval(() => {
                try {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "heartbeat", ts: Date.now() })}\n\n`)
                    );
                } catch {
                    clearInterval(heartbeat);
                    removeSseClient(controller);
                }
            }, 30000);

            // Cleanup à la déconnexion
            req.signal.addEventListener("abort", () => {
                clearInterval(heartbeat);
                removeSseClient(controller);
                try {
                    controller.close();
                } catch { /* already closed */ }
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}
