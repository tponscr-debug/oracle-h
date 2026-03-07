/**
 * ORACLE-H — GET /api/v1/requests
 *
 * Retourne la liste des requêtes en attente (pour le dashboard au chargement initial)
 * et les décisions récentes (pour le log d'audit).
 *
 * Query params :
 *   status : "pending" | "approved" | "rejected" | "all" (défaut: "all")
 *   limit  : nombre max de résultats (défaut: 50)
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const db = getDb();

    let whereClause = "";
    const params: (string | number)[] = [];

    if (status !== "all") {
        whereClause = "WHERE vr.status = ?";
        params.push(status);
    }

    const requests = db.prepare(`
    SELECT
      vr.id,
      vr.agent_id,
      a.name AS agent_name,
      vr.action,
      vr.rationale,
      vr.projected_impact,
      vr.financial_amount,
      vr.status,
      vr.watchdog_alert,
      vr.p_success_before,
      vr.p_success_after,
      vr.created_at,
      vr.updated_at,
      d.decision,
      d.decided_by,
      d.agent_signature,
      d.webhook_sent,
      d.timestamp AS decision_timestamp
    FROM validation_requests vr
    JOIN agents a ON a.id = vr.agent_id
    LEFT JOIN decisions d ON d.request_id = vr.id
    ${whereClause}
    ORDER BY vr.created_at DESC
    LIMIT ?
  `).all(...params, limit);

    return NextResponse.json({ requests, total: requests.length });
}
