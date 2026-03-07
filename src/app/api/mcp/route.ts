/**
 * ORACLE-H MCP HTTP Endpoint
 * Implements the MCP protocol (JSON-RPC 2.0) over HTTP for Smithery and remote clients.
 * Supports: initialize, tools/list, tools/call
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://oracle-h.online";
const ORACLE_TOOLS = [
    {
        name: "oracle_validate",
        description:
            "Submit a critical or irreversible action to ORACLE-H for human approval before executing it. " +
            "The human operator receives a Telegram notification with full context (action, rationale, risk) " +
            "and can approve or reject with a single tap. " +
            "ALWAYS use this tool before executing destructive, financial, or irreversible operations. " +
            "Returns a request_id to poll for the decision via oracle_poll_status.",
        inputSchema: {
            type: "object",
            properties: {
                action: {
                    type: "string",
                    description: "Precise technical description of the action you are about to execute (min 15 chars)",
                    minLength: 15,
                },
                rationale: {
                    type: "string",
                    description: "Why this action is necessary and why it is the optimal path (min 15 chars)",
                    minLength: 15,
                },
                projected_impact: {
                    type: "string",
                    description: "Risk and impact if this action fails or is wrong. Must describe potential damage (min 15 chars)",
                    minLength: 15,
                },
                financial_amount: {
                    type: "number",
                    description: "Financial amount at stake in USD (0 if none)",
                    minimum: 0,
                    default: 0,
                },
                expires_in_seconds: {
                    type: "number",
                    description: "How long to wait for the human response before timing out (default: 300 seconds = 5 minutes)",
                    minimum: 30,
                    default: 300,
                },
                signature_key: {
                    type: "string",
                    description: "Your ORACLE-H agent signature key (Bearer Token). Optional if set at connection level.",
                },
            },
            required: ["action", "rationale", "projected_impact"],
        },
        annotations: {
            title: "Request Human Validation",
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    },
    {
        name: "oracle_poll_status",
        description:
            "Check the current status of a validation request previously submitted via oracle_validate. " +
            "Poll every 10-15 seconds until status is 'approved' or 'rejected'. " +
            "If 'expired', the human did not respond in time — abort the action immediately.",
        inputSchema: {
            type: "object",
            properties: {
                request_id: {
                    type: "string",
                    description: "The request_id returned by oracle_validate",
                },
                signature_key: {
                    type: "string",
                    description: "Your ORACLE-H agent signature key (Bearer Token). Optional if set at connection level.",
                },
            },
            required: ["request_id"],
        },
        annotations: {
            title: "Check Validation Decision",
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
];

async function handleToolCall(name: string, args: Record<string, unknown>, connectionKey?: string, connectionBase?: string) {
    // signatureKey: prefer connection-level (Smithery query param) > tool arg > fallback
    const resolvedKey = connectionKey ?? (args.signature_key as string | undefined) ?? "demo-signature-key-change-in-production";
    const resolvedBase = connectionBase ?? BASE_URL;
    if (name === "oracle_validate") {
        const {
            action,
            rationale,
            projected_impact,
            financial_amount = 0,
            expires_in_seconds = 300,
        } = args as {
            action: string;
            rationale: string;
            projected_impact: string;
            financial_amount?: number;
            expires_in_seconds?: number;
        };

        const res = await fetch(`${resolvedBase}/api/v1/validate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resolvedKey}`,
            },
            body: JSON.stringify({ action, rationale, projected_impact, financial_amount, expires_in_seconds }),
        });

        const data = await res.json() as Record<string, unknown>;

        if (!res.ok) {
            return {
                isError: true,
                content: [{ type: "text", text: `❌ ORACLE-H rejected the request (HTTP ${res.status}):\n${JSON.stringify(data, null, 2)}\n\nDo NOT proceed with the action.` }],
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
                    reliability?.summary ? `📊 ${reliability.summary}` : "",
                    ``,
                    `🔄 NEXT STEP: Call oracle_poll_status with request_id="${requestId}" every 10-15 seconds until you get "approved" or "rejected".`,
                    `⚠️  Do NOT execute the action until you receive "approved". If "rejected" or "expired", abort immediately.`,
                ].filter(Boolean).join("\n"),
            }],
        };
    }

    if (name === "oracle_poll_status") {
        const { request_id } = args as { request_id: string };

        const res = await fetch(`${resolvedBase}/api/v1/status/${request_id}`, {
            headers: { Authorization: `Bearer ${resolvedKey}` },
        });

        const data = await res.json() as Record<string, unknown>;

        if (!res.ok) {
            return {
                isError: true,
                content: [{ type: "text", text: `❌ Could not fetch status (HTTP ${res.status}): ${JSON.stringify(data)}` }],
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
    }

    return {
        isError: true,
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
    };
}

export async function POST(request: Request) {
    try {
        // Read connection-level params injected by Smithery as query params
        const url = new URL(request.url);
        const connectionKey = url.searchParams.get("signatureKey") ?? undefined;
        const connectionBase = url.searchParams.get("baseUrl") ?? undefined;

        const body = await request.json() as { jsonrpc: string; id?: unknown; method: string; params?: Record<string, unknown> };
        const { jsonrpc, id, method, params = {} } = body;

        if (jsonrpc !== "2.0") {
            return Response.json({ jsonrpc: "2.0", id, error: { code: -32600, message: "Invalid JSON-RPC version" } }, { status: 400 });
        }

        // MCP initialize
        if (method === "initialize") {
            return Response.json({
                jsonrpc: "2.0",
                id,
                result: {
                    protocolVersion: "2025-03-26",
                    capabilities: { tools: {}, prompts: {} },
                    serverInfo: {
                        name: "oracle-h",
                        version: "1.0.0",
                        homepage: "https://oracle-h.online",
                        icon: "https://oracle-h.online/icon-192.png",
                    },
                },
            });
        }

        // MCP notifications/initialized (no response needed)
        if (method === "notifications/initialized") {
            return new Response(null, { status: 204 });
        }

        // List tools
        if (method === "tools/list") {
            return Response.json({ jsonrpc: "2.0", id, result: { tools: ORACLE_TOOLS } });
        }

        // List prompts
        if (method === "prompts/list") {
            return Response.json({
                jsonrpc: "2.0",
                id,
                result: {
                    prompts: [
                        {
                            name: "validate_before_destructive_action",
                            description: "Use this prompt before executing any destructive, irreversible, or high-risk action. Submits the action for human approval via ORACLE-H.",
                            arguments: [
                                { name: "action", description: "The action you are about to execute", required: true },
                                { name: "rationale", description: "Why this action is necessary", required: true },
                                { name: "risk", description: "What could go wrong if the action fails", required: true },
                            ],
                        },
                    ],
                },
            });
        }

        // Call tool
        if (method === "tools/call") {
            const { name, arguments: args } = params as { name: string; arguments: Record<string, unknown> };
            const result = await handleToolCall(name, args, connectionKey, connectionBase);
            return Response.json({ jsonrpc: "2.0", id, result });
        }

        return Response.json({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } }, { status: 404 });
    } catch (err) {
        return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: `Parse error: ${err}` } }, { status: 500 });
    }
}

// GET endpoint for SSE-based MCP clients (optional, returns server info)
export async function GET() {
    return Response.json({
        name: "oracle-h",
        version: "1.0.0",
        description: "Human-on-the-Loop validation for autonomous AI agents",
        tools: ORACLE_TOOLS.map(t => ({ name: t.name, description: t.description })),
        documentation: `${BASE_URL}/llms.txt`,
    });
}
