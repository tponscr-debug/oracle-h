import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const id = params.id;

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Missing Authorization Bearer" }, { status: 401 });
    }
    const signatureKey = authHeader.substring(7);

    const db = getDb();

    // Verify agent token
    const agent = db.prepare("SELECT id FROM agents WHERE signature_key = ?").get(signatureKey) as { id: string } | undefined;
    if (!agent) {
        return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
    }

    // Fetch request status
    const request = db.prepare(`
        SELECT r.id, r.status, r.expires_at, d.timestamp as decision_timestamp
        FROM validation_requests r
        LEFT JOIN decisions d ON r.id = d.request_id
        WHERE r.id = ? AND r.agent_id = ?
    `).get(id, agent.id) as any;

    if (!request) {
        return NextResponse.json({ error: "Request not found or unauthorized" }, { status: 404 });
    }

    // Check expiration dynamically if strictly needed, but status tells the truth.
    // If it's pending and expired, we could return a specific status, but 'pending' tells them it's not decided.
    let currentStatus = request.status;
    if (currentStatus === "pending" && request.expires_at) {
        const expiresDate = new Date(request.expires_at);
        if (new Date() > expiresDate) {
            currentStatus = "expired";
        }
    }

    return NextResponse.json({
        request_id: request.id,
        status: currentStatus,
        decision_timestamp: request.decision_timestamp || null,
        expires_at: request.expires_at || null
    });
}
