#!/usr/bin/env node
/**
 * ORACLE-H MCP Server
 * Exposes 2 tools to any MCP-compatible AI agent (Claude Desktop, Cursor, Windsurf...):
 *   - oracle_validate    : Submit a risky action for human approval via Telegram
 *   - oracle_poll_status : Check if the human has responded (polling)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = process.env.ORACLE_BASE_URL ?? "https://oracle-h.online";
const SIGNATURE_KEY = process.env.ORACLE_SIGNATURE_KEY ?? "demo-signature-key-change-in-production";

const server = new McpServer({
    name: "oracle-h",
    version: "1.0.0",
});

// ─────────────────────────────────────────────
// Tool 1: Submit an action for human validation
// ─────────────────────────────────────────────
server.tool(
    "oracle_validate",
    `MANDATORY HUMAN APPROVAL GATE: Call this tool BEFORE executing any action that is irreversible, destructive, or financially significant.

This includes: deleting files, dropping databases, sending emails to real users, making financial transactions, deploying to production, modifying permissions, or calling third-party APIs with side effects.

USE THIS TOOL WHEN:
- Action cannot be undone (file deletion, DB drop, git force-push, data wipe)
- Action has financial implications (payments, purchases, billing changes)
- Action affects real users or external systems (emails, API write calls)
- Action modifies infrastructure (server config, DNS, deployments, permissions)
- Action scope exceeds what was explicitly authorized in the current session

DO NOT USE FOR: Read-only operations, local sandboxed operations, actions explicitly pre-approved in system prompt.

Returns a request_id. Call oracle_poll_status every 10-15 seconds until "approved" or "rejected". DO NOT proceed until terminal status. If unreachable, treat as BLOCKED.`,
    {
        action: z.string().min(15).describe("Precise technical description of the exact action about to be executed. Include the target (file path, database name, API endpoint), the operation type, and scope. Example: 'DROP TABLE users in production PostgreSQL database prod-db-01'"),
        rationale: z.string().min(15).describe("Why this action is necessary to accomplish the goal, and why this specific approach was chosen over safer alternatives. Be honest about uncertainty."),
        projected_impact: z.string().min(15).describe("Concrete description of what goes wrong if this action fails or is incorrect. Include: data loss risk, affected users/systems, recovery difficulty. Example: 'Permanent deletion of 50,000 user records. No backup available. Unrecoverable.'"),
        financial_amount: z.number().min(0).default(0).describe("Total financial amount at stake in USD. Set to 0 if no financial impact. Include transaction amount or potential cost of mistakes."),
        expires_in_seconds: z.number().min(30).default(300).describe("Seconds to wait for human response. Use 60-120 for urgent real-time workflows. Use 300-600 for async tasks. If expired without decision, treat as rejected and abort."),
    },
    async ({ action, rationale, projected_impact, financial_amount, expires_in_seconds }) => {
        try {
            const response = await fetch(`${BASE_URL}/api/v1/validate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${SIGNATURE_KEY}`,
                },
                body: JSON.stringify({
                    action,
                    rationale,
                    projected_impact,
                    financial_amount,
                    expires_in_seconds,
                }),
            });

            const data = await response.json() as Record<string, unknown>;

            if (!response.ok) {
                return {
                    content: [{
                        type: "text",
                        text: `❌ ORACLE-H rejected the request (HTTP ${response.status}):\n${JSON.stringify(data, null, 2)}\n\nDo NOT proceed with the action.`,
                    }],
                    isError: true,
                };
            }

            const requestId = data.request_id as string;
            const expiresAt = data.expires_at as string;
            const reliability = data.reliability as { summary?: string } | undefined;

            return {
                content: [{
                    type: "text",
                    text: [
                        `✅ Request submitted to ORACLE-H for human validation.`,
                        ``,
                        `📋 request_id: ${requestId}`,
                        `⏳ Expires at: ${expiresAt}`,
                        `📊 ${reliability?.summary ?? ""}`,
                        ``,
                        `🔄 NEXT STEP: Call oracle_poll_status with request_id="${requestId}" every 10-15 seconds until you get "approved" or "rejected".`,
                        `⚠️  Do NOT execute the action until you receive "approved". If "rejected" or "expired", abort immediately.`,
                    ].join("\n"),
                }],
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `❌ Failed to reach ORACLE-H: ${error instanceof Error ? error.message : String(error)}\n\nDo NOT proceed with the action if you cannot reach the validation service.`,
                }],
                isError: true,
            };
        }
    }
);

// ────────────────────────────────────────────────────
// Tool 2: Poll the status of a validation request
// ────────────────────────────────────────────────────
server.tool(
    "oracle_poll_status",
    `POLLING PROTOCOL (mandatory): Check the human decision for a request submitted via oracle_validate.

1. Call this with the request_id from oracle_validate
2. If status is "pending": wait 10-15 seconds, then call again
3. Repeat until status is "approved" OR "rejected" OR "expired"
4. NEVER proceed with the action while status is "pending"

DECISION RULES (non-negotiable):
- "approved" → Human confirmed. You may now execute the action.
- "rejected" → Human denied. DO NOT execute. Inform the user and stop.
- "expired"  → No response in time. Treat as rejected. DO NOT execute.
- "pending"  → Still waiting. Poll again in 10-15 seconds.`,
    {
        request_id: z.string().describe("The unique request_id string returned by oracle_validate. Copy it exactly from the oracle_validate response."),
    },
    async ({ request_id }) => {
        try {
            const response = await fetch(`${BASE_URL}/api/v1/status/${request_id}`, {
                headers: {
                    "Authorization": `Bearer ${SIGNATURE_KEY}`,
                },
            });

            const data = await response.json() as Record<string, unknown>;

            if (!response.ok) {
                return {
                    content: [{
                        type: "text",
                        text: `❌ Could not fetch status (HTTP ${response.status}): ${JSON.stringify(data)}`,
                    }],
                    isError: true,
                };
            }

            const status = data.status as string;
            const decisionTimestamp = data.decision_timestamp as string | null;

            const emoji = status === "approved" ? "✅" : status === "rejected" ? "🚫" : status === "expired" ? "⌛" : "⏳";
            const instruction =
                status === "approved" ? "The human approved the action. You may now proceed." :
                    status === "rejected" ? "The human REJECTED the action. Abort immediately. Do not proceed." :
                        status === "expired" ? "The request expired without a human response. Abort the action for safety." :
                            "Still waiting for human response. Poll again in 10-15 seconds.";

            return {
                content: [{
                    type: "text",
                    text: [
                        `${emoji} Status: ${status.toUpperCase()}`,
                        decisionTimestamp ? `🕐 Decision at: ${decisionTimestamp}` : "",
                        ``,
                        `📋 ${instruction}`,
                    ].filter(Boolean).join("\n"),
                }],
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `❌ Failed to reach ORACLE-H: ${error instanceof Error ? error.message : String(error)}`,
                }],
                isError: true,
            };
        }
    }
);

// ────────────────────────────────────────────────────
// Start the MCP server (stdio transport)
// ────────────────────────────────────────────────────
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("ORACLE-H MCP Server running (stdio)");
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
