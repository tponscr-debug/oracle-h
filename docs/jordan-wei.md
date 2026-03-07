# ORACLE-H — LLM Context & Prompt Engineering Audit

**Agent**: Jordan Wei — LLM Context & Prompt Engineer
**Date**: 2026-03-07
**Subject**: Optimisation des descriptions MCP, llms.txt, system prompt snippet, OpenAPI spec, et stratégie de découvrabilité

---

## 1. Audit des descriptions MCP actuelles

### Comment un LLM sélectionne un outil MCP

Quand un LLM reçoit un appel, il traite la liste des outils disponibles comme un problème de correspondance sémantique : chaque description de tool est comparée à l'intention détectée dans le contexte. La sélection n'est pas déterministe — elle est probabiliste. Un outil mal décrit sera systématiquement sous-utilisé même s'il est parfaitement adapté.

Trois facteurs dominent la décision du LLM :

1. **La phrase d'ouverture de la description** : les LLMs lisent les descriptions de tools comme des humains scannent un CV — les 10 premiers mots sont décisifs. Le premier verbe dit au modèle ce que le tool *fait*, et le premier nom dit *sur quoi*.
2. **Les mots-clés sémantiques** : les LLMs activent des outils par association sémantique, pas par correspondance exacte. Les mots "irreversible", "destructive", "financial", "approval", "human" sont des déclencheurs forts pour des agents opérant sur des systèmes réels.
3. **Les instructions comportementales explicites** : les LLMs suivent les instructions dans les descriptions comme des instructions système. "ALWAYS use this before..." est un pattern comportemental fort que Claude et GPT-4o respectent.

### Analyse des descriptions actuelles

**`oracle_validate` — Forces**
- Le trigger `ALWAYS use this tool before executing any destructive, financial, or irreversible operation` est excellent : c'est une instruction comportementale directe qui fonctionne bien avec Claude et GPT-4o.
- Les trois catégories (`destructive`, `financial`, `irreversible`) couvrent les cas d'usage principaux.

**`oracle_validate` — Faiblesses**
- La description commence par "Submit a critical..." — le mot "Submit" est trop générique. Des outils de messaging, logging, ou reporting utilisent aussi "submit". Le LLM pourrait hésiter entre oracle_validate et un outil d'envoi de notification.
- Il n'y a pas de liste de cas d'usage concrets (exemples négatifs : quand ne PAS utiliser). Sans exemples, le LLM calibre mal le seuil de déclenchement.
- Le terme "ORACLE-H" n'est pas expliqué dans la description elle-même. Si un agent ne connaît pas le service, la description manque d'ancrage.
- Il n'y a pas d'instruction sur le comportement en cas d'erreur réseau : doit-on bloquer ou procéder ?
- La description ne mentionne pas explicitement qu'il faut **attendre** la décision avant d'agir — c'est dans le texte de retour, pas dans la description.

**`oracle_poll_status` — Forces**
- Simple, claire, avec l'instruction de polling (10-15s) bien intégrée.
- Les trois états (`approved`, `rejected`, `expired`) sont tous mentionnés.

**`oracle_poll_status` — Faiblesses**
- La description ne précise pas qu'il faut **boucler** jusqu'à un état terminal. Un LLM peut appeler poll une seule fois et passer à autre chose si le status est `pending`.
- L'instruction "abort the action" pour le cas `expired` est dans la description mais sans redondance dans le nom du paramètre ou dans le schéma.
- Le paramètre `request_id` n'indique pas son format ou sa provenance dans la description Zod (c'est implicite mais les LLMs bénéficient de la redondance).

### Analyse des paramètres

| Paramètre | Qualité actuelle | Problème |
|-----------|-----------------|----------|
| `action` | Bonne | "Precise technical description" est bien, mais le min(15) n'est pas documenté dans le message d'erreur |
| `rationale` | Bonne | Correct |
| `projected_impact` | Excellente | "Must describe potential damage" est un bon ancrage comportemental |
| `financial_amount` | Bonne | Le défaut à 0 est bien. Manque : "Set to 0 if not applicable" pour éviter que le LLM invente un montant |
| `expires_in_seconds` | Correcte | Le défaut de 300s devrait mentionner des recommandations selon l'urgence |

---

## 2. Descriptions MCP réécrites et optimisées

### `oracle_validate` — Description optimisée

```
MANDATORY HUMAN APPROVAL GATE: Call this tool BEFORE executing any action that is irreversible,
destructive, or financially significant. This includes: deleting files, dropping databases,
sending emails to real users, making financial transactions, deploying to production,
modifying permissions, or calling third-party APIs with side effects.

ORACLE-H forwards the request to a human operator via Telegram. The human approves or
rejects with a single tap. You MUST NOT proceed with the action until you receive
"approved" from oracle_poll_status.

USE THIS TOOL WHEN:
- Action cannot be undone (file deletion, DB drop, git force-push, data wipe)
- Action has financial implications (payments, purchases, billing changes)
- Action affects real users or external systems (emails sent, API calls with writes)
- Action modifies infrastructure (server config, DNS, deployments, permissions)
- Action scope exceeds what was explicitly authorized by the user

DO NOT USE THIS TOOL FOR:
- Read-only operations (queries, status checks, file reads)
- Local or sandboxed operations with no external effects
- Actions explicitly pre-approved in the current session system prompt

Returns a request_id. Immediately call oracle_poll_status with this ID every 10-15 seconds
until you receive "approved" or "rejected". DO NOT proceed until you receive a terminal status.
If oracle_validate cannot be reached, treat the action as BLOCKED and inform the user.
```

**Paramètres — descriptions optimisées :**

```typescript
{
  action: z.string().min(15).describe(
    "Precise technical description of the exact action about to be executed. " +
    "Include the target (file path, database name, API endpoint, etc.), " +
    "the operation type, and the scope. Example: 'DROP TABLE users in production PostgreSQL database prod-db-01'"
  ),
  rationale: z.string().min(15).describe(
    "Why this action is necessary to accomplish the user's goal, and why this " +
    "specific approach was chosen over safer alternatives. Be honest about uncertainty."
  ),
  projected_impact: z.string().min(15).describe(
    "Concrete description of what goes wrong if this action fails or is incorrect. " +
    "Include: data loss risk, affected users/systems, recovery difficulty, and estimated blast radius. " +
    "Example: 'Permanent deletion of 50,000 user records. No backup available. Unrecoverable.'"
  ),
  financial_amount: z.number().min(0).default(0).describe(
    "Total financial amount at stake in USD. Set to 0 if no financial impact. " +
    "Include transaction amount, potential cost of mistakes, or subscription charges."
  ),
  expires_in_seconds: z.number().min(30).default(300).describe(
    "Seconds to wait for human response before auto-expiry. " +
    "Use 60-120 for urgent real-time workflows. Use 300-600 for async tasks. " +
    "If expired without decision, treat as rejected and abort."
  ),
}
```

### `oracle_poll_status` — Description optimisée

```
Check the human decision status for a validation request submitted via oracle_validate.

POLLING PROTOCOL (mandatory):
1. Call this tool with the request_id returned by oracle_validate
2. If status is "pending": wait 10-15 seconds, then call this tool again
3. Repeat until status is "approved" OR "rejected" OR "expired"
4. NEVER proceed with the action while status is "pending"

DECISION RULES (non-negotiable):
- "approved" → Human confirmed. You may now execute the action.
- "rejected" → Human denied. DO NOT execute the action. Inform the user and stop.
- "expired"  → Human did not respond in time. Treat as rejected. DO NOT execute. Inform the user.
- "pending"  → Still waiting. Poll again in 10-15 seconds.

Do not make assumptions about the human's intent. The decision from this tool is final.
```

**Paramètre optimisé :**

```typescript
{
  request_id: z.string().describe(
    "The unique request_id string returned by oracle_validate. " +
    "Format: alphanumeric string. Copy it exactly from the oracle_validate response."
  ),
}
```

---

## 3. Fichier `llms.txt` complet

Contenu ready-to-deploy pour `https://oracle-h.online/llms.txt` :

```markdown
# ORACLE-H

> ORACLE-H is a Human-on-the-Loop (HOTL) validation service for autonomous AI agents.
> It intercepts critical or irreversible agent actions and routes them to a human operator
> for real-time approval via Telegram before execution proceeds.

ORACLE-H acts as a mandatory safety checkpoint between an AI agent and its most dangerous
operations. When an agent is about to delete data, send emails, make financial transactions,
or modify production infrastructure, it calls ORACLE-H. A human receives a Telegram notification
with full context and approves or rejects with a single tap. The agent waits for the decision
before proceeding.

## Who should use ORACLE-H

Developers building autonomous AI agents that operate on real systems with real consequences.
Any agent that can delete, modify, send, pay, or deploy needs a human approval layer.
ORACLE-H provides this as a drop-in MCP server or REST API, with no backend required on
the agent's side.

## Proven impact

Adding a single human validation checkpoint to an autonomous workflow statistically improves
the probability of correct execution from ~81.5% to ~99.6% (based on a 4-step workflow
with independent 95% per-step accuracy, validated with one human review at the critical step).

## MCP Server (recommended)

ORACLE-H ships as an MCP server installable in Claude Desktop, Cursor, Windsurf, and any
MCP-compatible agent runtime.

Install via npx (no build step required):
```json
{
  "mcpServers": {
    "oracle-h": {
      "command": "npx",
      "args": ["-y", "oracle-h-mcp"],
      "env": {
        "ORACLE_SIGNATURE_KEY": "<your-api-key>",
        "ORACLE_BASE_URL": "https://oracle-h.online"
      }
    }
  }
}
```

MCP package: https://www.npmjs.com/package/oracle-h-mcp
Smithery listing: https://smithery.ai/server/@tponscr-debug/oracle-h-mcp

## MCP Tools

### oracle_validate

Submit an action for human approval before execution.

Call this before: file deletion, database operations, emails to real users, financial
transactions, production deployments, permission changes, irreversible API calls.

Do NOT call this for: read-only queries, local sandboxed operations, actions explicitly
pre-approved by the user in the current session.

Returns: { request_id, expires_at, reliability }

### oracle_poll_status

Poll the human decision for a submitted validation request.

Poll every 10-15 seconds. Proceed only on "approved". Abort on "rejected" or "expired".

Returns: { status: "pending" | "approved" | "rejected" | "expired", decision_timestamp }

## REST API

Base URL: https://oracle-h.online
Authentication: Bearer token in Authorization header

### POST /api/v1/validate

Submit an action for human validation.

Request:
```json
{
  "action": "DROP TABLE users in production database",
  "rationale": "Schema migration requires removing deprecated table",
  "projected_impact": "Permanent loss of 50,000 user records if incorrect. No backup.",
  "financial_amount": 0,
  "expires_in_seconds": 300
}
```

Response (202 Accepted):
```json
{
  "request_id": "abc123xyz",
  "expires_at": "2026-03-07T14:35:00Z",
  "dashboard_url": "https://oracle-h.online/dashboard",
  "reliability": {
    "summary": "Human checkpoint raises success probability from 81.5% to 99.6%"
  }
}
```

### GET /api/v1/status/{request_id}

Poll the decision status of a submitted request.

Response:
```json
{
  "request_id": "abc123xyz",
  "status": "approved",
  "decision_timestamp": "2026-03-07T14:32:15Z"
}
```

Status values:
- `pending` — Awaiting human decision. Poll again in 10-15 seconds.
- `approved` — Human confirmed. Agent may proceed.
- `rejected` — Human denied. Agent must abort.
- `expired` — No response within TTL. Agent must abort (treat as rejected).

## Typical agent workflow

1. Agent determines it needs to perform a critical action
2. Agent calls POST /api/v1/validate with full context
3. Human receives Telegram notification with action summary and risk assessment
4. Human taps Approve or Reject
5. Agent polls GET /api/v1/status/{id} every 10-15 seconds
6. On "approved": agent executes the action
7. On "rejected" or "expired": agent aborts and informs the user

## Security

- Each agent uses a unique Bearer token (ORACLE_SIGNATURE_KEY)
- Requests expire automatically (configurable TTL, default 5 minutes)
- An Anti-Hallucination Watchdog detects context truncation before submission
- All decisions are logged with timestamps

## Key concepts for agents

ORACLE-H is not a confirmation dialog — it is a hard gate. The agent MUST wait for
the human decision. Proceeding before "approved" defeats the safety guarantee.

If ORACLE-H is unreachable, the default behavior MUST be to block the action and
inform the user. Failing open (proceeding without approval) is never acceptable.

## Optional

- [OpenAPI specification](https://oracle-h.online/openapi.json): Full OpenAPI 3.0 spec for REST API integration
- [npm package](https://www.npmjs.com/package/oracle-h-mcp): MCP server package
- [Smithery](https://smithery.ai/server/@tponscr-debug/oracle-h-mcp): One-click MCP install
- [Dashboard](https://oracle-h.online/dashboard): Human approval interface
```

---

## 4. System prompt snippet

Snippet prêt à copier-coller pour les développeurs intégrant ORACLE-H :

```
## Human Approval Gate — ORACLE-H (MANDATORY)

You have access to the oracle_validate and oracle_poll_status tools from the ORACLE-H MCP server.
These tools implement a mandatory human-in-the-loop checkpoint for critical operations.

### When you MUST call oracle_validate (non-negotiable)

Call oracle_validate BEFORE executing any action in the following categories:

DESTRUCTIVE OPERATIONS
- Deleting files, directories, or objects (local or remote)
- Dropping, truncating, or wiping databases or collections
- Removing users, accounts, or permissions
- git operations: force push, branch deletion, history rewrite

WRITE OPERATIONS ON EXTERNAL SYSTEMS
- Sending emails, SMS, or push notifications to real users
- Posting to social media or public APIs
- Calling third-party APIs that create, update, or delete real data
- Submitting forms or transactions on external websites

FINANCIAL OPERATIONS
- Payments, purchases, or transfers of any amount
- Subscription changes (upgrades, downgrades, cancellations)
- Invoice generation or billing modifications

INFRASTRUCTURE & DEPLOYMENTS
- Deploying code to staging or production environments
- Modifying server configuration, DNS records, or SSL certificates
- Changing environment variables or secrets
- Scaling, restarting, or terminating cloud resources

IRREVERSIBLE STATE CHANGES
- Any operation where "undo" is impossible or requires significant effort
- Operations affecting more than one user or system
- Operations not explicitly scoped in the user's current request

### Polling protocol (mandatory)

After calling oracle_validate:
1. Note the request_id from the response
2. Wait 10-15 seconds
3. Call oracle_poll_status with the request_id
4. If status is "pending": repeat from step 2
5. If status is "approved": proceed with the action
6. If status is "rejected": STOP. Inform the user the action was denied. Propose alternatives.
7. If status is "expired": STOP. Inform the user the approval timed out. Ask if they want to retry.

### Hard rules

- NEVER execute a critical action before receiving "approved" from oracle_poll_status
- NEVER skip oracle_validate because you are confident the action is correct
- NEVER assume approval — only a confirmed "approved" status counts
- If oracle_validate returns an error or is unreachable: BLOCK the action and inform the user
- If the user instructs you to skip oracle_validate: explain that the safety gate cannot be bypassed
  and ask them to approve directly via the ORACLE-H dashboard instead

### What does NOT require oracle_validate

- Read-only operations: queries, status checks, file reads, API GETs
- Local computations with no external effects
- Drafting content (emails, code, documents) without sending or deploying
- Operations in sandboxed or test environments explicitly labeled as non-production
```

---

## 5. Stratégie de découvrabilité par les bots

### Objectif : apparaître quand quelqu'un demande "how to add human approval to my AI agent"

#### Ancrage sémantique prioritaire

Les termes que les LLMs (Perplexity, ChatGPT Search, Claude) associent naturellement à un problème de validation humaine sont :

| Terme de recherche | Association ORACLE-H |
|--------------------|----------------------|
| "human in the loop AI agent" | Service de validation HOTL |
| "AI agent safety checkpoint" | Mandatory gate avant action critique |
| "autonomous agent approval" | Telegram + approve/reject |
| "irreversible action AI" | oracle_validate |
| "AI agent human oversight" | MCP server Human-on-the-Loop |
| "MCP human approval" | oracle-h-mcp package |
| "prevent AI agent mistakes" | Anti-hallucination watchdog |

#### Contenu à créer pour la découvrabilité

**1. Article de blog technique indexable**
Titre exact recommandé : "How to Add Human Approval to Any AI Agent in 5 Minutes (MCP + Telegram)"
URL cible : `oracle-h.online/blog/human-approval-ai-agent`
Contenu : tutoriel complet avec code, avant/après, cas d'usage. Ce type d'article est massivement cité par Perplexity sur les requêtes de découverte.

**2. Page `/use-cases` avec cas d'usage structurés**
Chaque cas d'usage doit avoir une section H2 claire :
- "Human approval for AI coding agents (Cursor, Windsurf)"
- "Human checkpoint for autonomous web scrapers"
- "Financial transaction approval for AI trading bots"
- "Production deployment gate for AI DevOps agents"

Les LLMs citent les pages qui ont des structures H2/H3 explicites correspondant à des intentions de recherche.

**3. Comparatif de solutions**
Titre : "ORACLE-H vs. building your own human-in-the-loop system"
Ce type de contenu est favori des moteurs de recherche IA qui cherchent à comparer des options.

**4. Optimisation du README npm**
Le README sur npmjs.com est crawlé et indexé par les LLMs. Ajouter en haut :
```
Keywords: human-in-the-loop, AI agent safety, human approval, MCP server,
autonomous agent, irreversible action gate, Telegram approval, HITL, HOTL
```

**5. Schema.org structured data**
Sur `oracle-h.online`, ajouter JSON-LD avec `SoftwareApplication` type, incluant des descriptions riches en mots-clés sémantiques. Les LLMs comme Perplexity utilisent ces métadonnées.

**6. Fichier `llms.txt` et `llms-full.txt`**
Le fichier `llms.txt` (voir section 3) doit être déployé à `oracle-h.online/llms.txt`.
Créer aussi un `llms-full.txt` avec l'intégralité de la documentation API, les exemples, et les cas d'usage edge-cases. C'est ce fichier que les agents autonomes (pas les crawlers) liront en contexte.

**7. Présence sur les annuaires MCP**
- Smithery.ai : déjà listé — compléter la description avec les mots-clés de découvrabilité
- mcp.so : créer une fiche
- glama.ai/mcp : créer une fiche
- awesome-mcp-servers (GitHub) : soumettre une PR

Ces annuaires sont fréquemment cités par les LLMs quand un utilisateur cherche un MCP server spécifique.

#### Comment les LLMs citent ORACLE-H dans leurs réponses

Pour qu'un LLM mentionne ORACLE-H spontanément, il faut que le service soit associé à des patterns textuels précis dans le corpus. Les actions à prendre :

1. **Publier sur Hacker News** avec le titre "Show HN: ORACLE-H – human approval gate for AI agents via MCP + Telegram" — les discussions HN sont très bien indexées par les LLMs de recherche.

2. **Écrire un post X/Twitter** technique avec les hashtags `#MCP #AIAgent #HumanInTheLoop #Claude #AgentSafety` — Perplexity indexe X.

3. **Soumettre à r/MachineLearning et r/LocalLLaMA** — Reddit est massivement utilisé dans les corpus de Perplexity.

4. **Écrire sur dev.to ou Medium** un tutoriel technique — ces plateformes sont bien indexées.

---

## 6. OpenAPI specification complète

Contenu prêt à déployer à `oracle-h.online/openapi.json` :

```json
{
  "openapi": "3.0.3",
  "info": {
    "title": "ORACLE-H API",
    "description": "Human-on-the-Loop validation service for autonomous AI agents. Submit critical or irreversible actions for real-time human approval via Telegram before execution.",
    "version": "1.0.0",
    "contact": {
      "name": "ORACLE-H",
      "url": "https://oracle-h.online"
    },
    "license": {
      "name": "MIT"
    }
  },
  "servers": [
    {
      "url": "https://oracle-h.online/api/v1",
      "description": "Production server"
    }
  ],
  "security": [
    {
      "bearerAuth": []
    }
  ],
  "paths": {
    "/validate": {
      "post": {
        "operationId": "submitValidation",
        "summary": "Submit an action for human approval",
        "description": "Submit a critical or irreversible action to ORACLE-H for human validation. The human operator receives a Telegram notification and can approve or reject. Call this endpoint BEFORE executing any destructive, financial, or irreversible operation. Poll /status/{request_id} to retrieve the decision.",
        "tags": ["Validation"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ValidateRequest"
              },
              "examples": {
                "database_deletion": {
                  "summary": "Database table deletion",
                  "value": {
                    "action": "DROP TABLE users in production PostgreSQL database prod-db-01",
                    "rationale": "Schema migration v3.2 requires removing the deprecated users table replaced by accounts table",
                    "projected_impact": "Permanent deletion of 50,000 user records. No automated backup available. Recovery would require 8+ hours of manual restoration from cold storage.",
                    "financial_amount": 0,
                    "expires_in_seconds": 300
                  }
                },
                "financial_transaction": {
                  "summary": "Financial payment",
                  "value": {
                    "action": "Wire transfer of $15,000 to supplier account IBAN FR7630006000011234567890189",
                    "rationale": "Invoice #2026-0312 approved by procurement. Payment deadline is today.",
                    "projected_impact": "Transfer is irreversible once sent. If IBAN is incorrect, funds may be lost permanently.",
                    "financial_amount": 15000,
                    "expires_in_seconds": 120
                  }
                },
                "production_deployment": {
                  "summary": "Production deployment",
                  "value": {
                    "action": "Deploy commit a3f9c2b to production environment on Hetzner server 77.42.31.88",
                    "rationale": "Feature branch passed all CI tests. Hotfix for critical auth bug affecting 2% of users.",
                    "projected_impact": "If deployment fails, production service downtime. Rollback requires 5-10 minutes.",
                    "financial_amount": 0,
                    "expires_in_seconds": 300
                  }
                }
              }
            }
          }
        },
        "responses": {
          "202": {
            "description": "Validation request accepted. Human notification sent. Poll /status/{request_id} for decision.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ValidateResponse"
                },
                "example": {
                  "request_id": "v_abc123xyz789",
                  "expires_at": "2026-03-07T14:35:00Z",
                  "dashboard_url": "https://oracle-h.online/dashboard",
                  "reliability": {
                    "summary": "Human checkpoint raises workflow success probability from 81.5% to 99.6%",
                    "before": 0.815,
                    "after": 0.996
                  }
                }
              }
            }
          },
          "400": {
            "description": "Invalid request body or watchdog integrity check failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                },
                "example": {
                  "error": "projected_impact must be at least 15 characters",
                  "field": "projected_impact"
                }
              }
            }
          },
          "401": {
            "description": "Invalid or missing Bearer token",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                },
                "example": {
                  "error": "Unauthorized: invalid signature key"
                }
              }
            }
          },
          "404": {
            "description": "Agent not found (unknown signature key)",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "500": {
            "description": "Internal server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/status/{request_id}": {
      "get": {
        "operationId": "getValidationStatus",
        "summary": "Poll the decision status of a validation request",
        "description": "Check the current status of a validation request submitted via POST /validate. Poll every 10-15 seconds until status is 'approved' or 'rejected'. If status is 'expired', the human did not respond within the TTL — treat as rejected and abort the action.",
        "tags": ["Validation"],
        "parameters": [
          {
            "name": "request_id",
            "in": "path",
            "required": true,
            "description": "The unique request identifier returned by POST /validate",
            "schema": {
              "type": "string",
              "example": "v_abc123xyz789"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Current status of the validation request",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StatusResponse"
                },
                "examples": {
                  "pending": {
                    "summary": "Awaiting human decision",
                    "value": {
                      "request_id": "v_abc123xyz789",
                      "status": "pending",
                      "decision_timestamp": null
                    }
                  },
                  "approved": {
                    "summary": "Human approved the action",
                    "value": {
                      "request_id": "v_abc123xyz789",
                      "status": "approved",
                      "decision_timestamp": "2026-03-07T14:32:15Z"
                    }
                  },
                  "rejected": {
                    "summary": "Human rejected the action",
                    "value": {
                      "request_id": "v_abc123xyz789",
                      "status": "rejected",
                      "decision_timestamp": "2026-03-07T14:31:44Z"
                    }
                  },
                  "expired": {
                    "summary": "Request expired without human response",
                    "value": {
                      "request_id": "v_abc123xyz789",
                      "status": "expired",
                      "decision_timestamp": null
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Invalid or missing Bearer token",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "404": {
            "description": "Request ID not found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                },
                "example": {
                  "error": "Validation request not found"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "description": "Your ORACLE-H signature key (ORACLE_SIGNATURE_KEY). Obtain from oracle-h.online dashboard."
      }
    },
    "schemas": {
      "ValidateRequest": {
        "type": "object",
        "required": ["action", "rationale", "projected_impact", "financial_amount"],
        "properties": {
          "action": {
            "type": "string",
            "minLength": 15,
            "description": "Precise technical description of the exact action to be executed. Include target (file path, database name, API endpoint), operation type, and scope.",
            "example": "DROP TABLE users in production PostgreSQL database prod-db-01"
          },
          "rationale": {
            "type": "string",
            "minLength": 15,
            "description": "Why this action is necessary to accomplish the goal, and why this approach was chosen over safer alternatives.",
            "example": "Schema migration v3.2 requires removing the deprecated users table replaced by accounts table"
          },
          "projected_impact": {
            "type": "string",
            "minLength": 15,
            "description": "Concrete description of what goes wrong if this action fails or is incorrect. Include data loss risk, affected users/systems, recovery difficulty.",
            "example": "Permanent deletion of 50,000 user records. No automated backup. Recovery requires 8+ hours."
          },
          "financial_amount": {
            "type": "number",
            "minimum": 0,
            "default": 0,
            "description": "Total financial amount at stake in USD. Set to 0 if no financial impact.",
            "example": 0
          },
          "expires_in_seconds": {
            "type": "integer",
            "minimum": 30,
            "default": 300,
            "description": "Seconds to wait for human response before auto-expiry. Use 60-120 for urgent workflows, 300-600 for async tasks.",
            "example": 300
          },
          "callback_url": {
            "type": "string",
            "format": "uri",
            "description": "Optional webhook URL to receive the decision asynchronously instead of polling.",
            "example": "https://my-agent.example.com/webhooks/oracle-decision"
          }
        }
      },
      "ValidateResponse": {
        "type": "object",
        "properties": {
          "request_id": {
            "type": "string",
            "description": "Unique identifier for this validation request. Use with GET /status/{request_id}.",
            "example": "v_abc123xyz789"
          },
          "expires_at": {
            "type": "string",
            "format": "date-time",
            "description": "ISO 8601 timestamp when this request will auto-expire if no human response.",
            "example": "2026-03-07T14:35:00Z"
          },
          "dashboard_url": {
            "type": "string",
            "format": "uri",
            "description": "URL to the human operator dashboard.",
            "example": "https://oracle-h.online/dashboard"
          },
          "reliability": {
            "type": "object",
            "properties": {
              "summary": {
                "type": "string",
                "description": "Human-readable reliability improvement summary.",
                "example": "Human checkpoint raises success probability from 81.5% to 99.6%"
              },
              "before": {
                "type": "number",
                "description": "Estimated success probability without human checkpoint.",
                "example": 0.815
              },
              "after": {
                "type": "number",
                "description": "Estimated success probability with human checkpoint.",
                "example": 0.996
              }
            }
          }
        }
      },
      "StatusResponse": {
        "type": "object",
        "properties": {
          "request_id": {
            "type": "string",
            "description": "The validation request identifier.",
            "example": "v_abc123xyz789"
          },
          "status": {
            "type": "string",
            "enum": ["pending", "approved", "rejected", "expired"],
            "description": "Current decision status. 'pending': awaiting human. 'approved': proceed. 'rejected': abort. 'expired': no response, abort.",
            "example": "approved"
          },
          "decision_timestamp": {
            "type": "string",
            "format": "date-time",
            "nullable": true,
            "description": "ISO 8601 timestamp of when the human made their decision. Null if still pending or expired.",
            "example": "2026-03-07T14:32:15Z"
          }
        }
      },
      "ErrorResponse": {
        "type": "object",
        "properties": {
          "error": {
            "type": "string",
            "description": "Human-readable error message.",
            "example": "Validation request not found"
          },
          "field": {
            "type": "string",
            "description": "Field that caused the validation error (for 400 responses).",
            "example": "projected_impact"
          }
        }
      }
    }
  }
}
```

---

## Résumé des priorités d'implémentation

| Priorité | Action | Impact |
|----------|--------|--------|
| P0 | Déployer `llms.txt` à `oracle-h.online/llms.txt` | Découvrabilité agents + crawlers |
| P0 | Déployer `openapi.json` à `oracle-h.online/openapi.json` | Intégration outillée + citation LLM |
| P1 | Mettre à jour les descriptions MCP (section 2) | Taux de sélection du tool par les LLMs |
| P1 | Mettre à jour le README npm avec le system prompt snippet | Adoption développeurs |
| P2 | Publier article blog "How to add human approval to any AI agent" | SEO + citations Perplexity |
| P2 | Soumettre sur awesome-mcp-servers + mcp.so + glama.ai | Distribution |
| P3 | Campagne HN + Reddit + dev.to | Corpus LLM + trafic organique |

---

*Document produit par Jordan Wei — LLM Context & Prompt Engineering*
*Sources: llmstxt.org specification, MCP official docs (modelcontextprotocol.io), Anthropic advanced tool use guide, MCP-Flow paper (OpenReview)*
