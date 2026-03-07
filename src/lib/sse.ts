/**
 * ORACLE-H — SSE Client Store
 *
 * Module singleton pour partager les clients SSE entre les routes API.
 * Évite les imports circulaires entre /api/sse et /api/v1/validate.
 *
 * Ce module est intentionnellement simple — il maintient un Set de
 * ReadableStreamDefaultController en mémoire (reset au redémarrage du serveur).
 */

// Store global des contrôleurs SSE connectés
const sseClients = new Set<ReadableStreamDefaultController>();

/**
 * addSseClient — Enregistre un nouveau client SSE.
 */
export function addSseClient(controller: ReadableStreamDefaultController) {
    sseClients.add(controller);
}

/**
 * removeSseClient — Supprime un client SSE déconnecté.
 */
export function removeSseClient(controller: ReadableStreamDefaultController) {
    sseClients.delete(controller);
}

/**
 * notifyClients — Émet un événement SSE à tous les dashboards connectés.
 * Appelé par /api/v1/validate et /api/v1/decide après chaque événement.
 */
export function notifyClients(data: object) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);

    for (const controller of sseClients) {
        try {
            controller.enqueue(encoded);
        } catch {
            // Client disconnected — nettoyage
            sseClients.delete(controller);
        }
    }
}
