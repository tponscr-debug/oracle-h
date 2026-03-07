/**
 * ORACLE-H — GET /api/health
 *
 * Endpoint de santé pour les agents et systèmes de monitoring.
 * Vérifie la connectivité DB et retourne le statut du service.
 */

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
    try {
        const db = getDb();
        const { count } = db
            .prepare("SELECT COUNT(*) as count FROM validation_requests")
            .get() as { count: number };

        return NextResponse.json({
            status: "operational",
            service: "ORACLE-H",
            version: "1.0.0",
            timestamp: new Date().toISOString(),
            database: "connected",
            pending_requests: count,
        });
    } catch (err: any) {
        return NextResponse.json(
            { status: "degraded", error: err?.message },
            { status: 503 }
        );
    }
}
