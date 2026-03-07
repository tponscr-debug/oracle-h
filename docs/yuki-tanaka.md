# Dr. Yuki Tanaka — Audit Technique ORACLE-H
**AI Safety & Agent Infrastructure Architect**

> "La sécurité n'est pas une contrainte — c'est le produit. Un agent qui n'a pas de checkpoint humain n'est pas un agent, c'est un bug en attente d'exécution."

---

## Executive Summary

ORACLE-H est une implémentation solide et cohérente d'un système Human-on-the-Loop (HotL). Le protocole est fonctionnel, le watchdog anti-hallucination est une idée originale et pertinente, et la signature HMAC des webhooks démontre une bonne conscience sécurité. Cependant, l'audit révèle des lacunes structurelles importantes par rapport aux besoins réels des agents en production : le surface MCP est trop minimal, le protocole de polling est fragile à l'échelle, et plusieurs patterns agentiques critiques ne sont pas supportés. Ces gaps limitent l'adoption par les frameworks avancés (LangGraph, AutoGen, CrewAI) et bloquent les cas d'usage enterprise.

---

## 1. Gaps MCP — Ce qui manque dans les outils

### 1.1. Surface MCP trop réduite (2 tools, c'est insuffisant)

L'état de l'art des MCP servers de référence (Sequential Thinking, Filesystem, GitHub MCP) expose entre 8 et 25 tools distincts, chacun avec une responsabilité atomique. Avec seulement `oracle_validate` et `oracle_poll_status`, ORACLE-H souffre de plusieurs anti-patterns :

**Anti-patterns détectés :**
- **Couplage polling-validation** : L'agent est contraint de gérer lui-même la boucle de polling, ce qui consomme du contexte et génère des appels inutiles. Le MCP spec (juin 2025) introduit les **Output Schemas** et l'**Elicitation** précisément pour éviter ces patterns impératifs.
- **Absence de tool `oracle_cancel`** : Un agent ne peut pas annuler une requête en cours. Si le contexte change (ex: les conditions marché ont évolué pendant l'attente), l'agent est bloqué à attendre une décision sur une requête devenue caduque.
- **Absence de tool `oracle_list_pending`** : Un agent ne peut pas auditer ses propres requêtes en cours. En cas de crash/redémarrage, il ne sait pas si une requête précédente est encore active.
- **Absence de tool `oracle_subscribe`** (SSE ou long-polling) : Forcer le polling manuel toutes les 10-15 secondes via un tool séparé est un pattern 2020. Les frameworks modernes (LangGraph) supportent les interrupts natifs — ORACLE-H devrait exposer un mécanisme d'attente bloquante avec timeout configurable.

**Tools MCP manquants recommandés :**

| Tool | Priorité | Description |
|------|----------|-------------|
| `oracle_cancel` | HAUTE | Annuler une requête pending avant décision |
| `oracle_list_pending` | HAUTE | Lister ses requêtes actives (idempotence, recovery) |
| `oracle_get_context` | MOYENNE | Récupérer le contexte complet d'une requête par ID |
| `oracle_wait` | HAUTE | Attente bloquante avec long-polling (max 120s) — élimine le polling manuel |
| `oracle_batch_validate` | MOYENNE | Soumettre plusieurs actions en un seul appel |
| `oracle_escalate` | BASSE | Réescalader une requête expirée à un autre superviseur |

### 1.2. Descriptions de tools sous-optimisées pour la sélection LLM

La recherche arxiv (Feb 2026) sur les "MCP Tool Description Smells" identifie que 89.3% des MCP servers souffrent de **Missing Usage Guidelines** et 84.3% d'**Opaque Parameters**. ORACLE-H est affecté :

- `financial_amount` : Le paramètre accepte 0, mais il n'est pas clair si 0 signifie "montant inconnu" ou "aucun enjeu financier". Un agent DeFi qui gère des transactions on-chain sans valeur USD connue à l'avance sera confus.
- `expires_in_seconds` : Aucune guidance sur les valeurs recommandées selon le contexte (ex: "pour une action critique financière, utilisez minimum 600s").
- `projected_impact` : Le watchdog vérifie les safety keywords, mais l'agent n'en est pas informé dans la description du tool. Il ne sait pas qu'un `projected_impact` sans mots-clés de risque sera rejeté.
- Aucun exemple `usage` ou `examples` dans les tool definitions — pourtant supporté par le MCP SDK via annotations.

### 1.3. Absence de MCP Resources et Prompts

Le MCP spec définit 3 primitives : **Tools**, **Resources**, **Prompts**. ORACLE-H n'utilise que les Tools. Les manques :

- **Resources manquantes** : L'agent devrait pouvoir lire `oracle://agents/me` (ses propres infos), `oracle://requests/pending` (ses requêtes actives), `oracle://history/recent` (ses 10 dernières décisions). Ces resources permettraient à l'agent de construire un contexte sans multiplier les appels.
- **Prompts manquants** : Un prompt `oracle_safety_assessment` pourrait guider l'agent pour rédiger un `projected_impact` conforme aux attentes du watchdog. Les Prompts MCP sont des templates réutilisables que l'agent peut invoquer — parfait pour standardiser la rédaction des requêtes ORACLE.

---

## 2. Robustesse du Protocole

### 2.1. Race Condition : Double-décision Telegram + Dashboard

**Vulnérabilité identifiée (sévérité : HAUTE)**

Le handler Telegram (`/api/webhook/telegram`) et le handler dashboard (`/api/v1/decide`) peuvent traiter la même requête simultanément. Le Telegram handler utilise `WHERE id = ? AND status = 'pending'` avec vérification de `result.changes === 0`, ce qui est une protection correcte au niveau applicatif. Cependant :

- La protection n'est pas encapsulée dans une **transaction SQLite atomique**. Entre le `SELECT` et l'`UPDATE`, une window de race condition existe dans un contexte multi-process (Next.js peut scaler horizontalement).
- Le handler `/api/v1/decide` effectue un `SELECT` puis un `UPDATE` séparés sans transaction — si deux décisions arrivent en parallèle (double-clic Telegram + dashboard simultané), les deux peuvent passer le check `status === "pending"` avant que l'une n'ait écrit.

**Fix recommandé** : Encapsuler la paire SELECT+UPDATE dans une transaction SQLite atomique avec `BEGIN IMMEDIATE` pour forcer un verrou d'écriture dès le début.

### 2.2. Requêtes "Orphelines" (Expiration non persistée)

**Vulnérabilité : MOYENNE**

Actuellement, l'expiration est calculée dynamiquement dans `/api/v1/status` : si `status === 'pending'` et `expires_at < now()`, le status retourné est `"expired"`. Mais en base, le status reste `"pending"` indéfiniment.

Conséquences :
- La table `validation_requests` accumule des requêtes `pending` périmées. Un agent qui crash et redémarre verra ses anciennes requêtes comme `"pending"` si requêtées directement en DB (ex: via un admin dashboard).
- `oracle_list_pending` (si implémenté) retournerait des requêtes mortes.
- Pas de nettoyage automatique (pas de cron, pas de job de cleanup). La DB grossit infiniment.

**Fix recommandé** : Un job de nettoyage (cron SQLite ou un middleware Next.js qui s'exécute sur chaque requête avec throttling) doit mettre à jour le status en `"expired"` dans la DB pour les requêtes dont `expires_at < NOW()`.

### 2.3. Webhook sans Retry Logic

**Vulnérabilité : HAUTE pour les cas d'usage production**

Le dispatcher de webhook (`webhook.ts`) effectue un seul appel avec un timeout de 5 secondes. Si l'agent est temporairement indisponible (redémarrage, latence réseau), le webhook est perdu et `webhook_sent = 0`.

Aucun mécanisme de retry n'existe. L'agent qui poll via `oracle_poll_status` récupérera quand même le résultat, mais l'agent qui attend uniquement via webhook (mode callback_url) ne recevra jamais la décision. Le `callback_url` est un champ de la table `agents` mais pas du payload de validate — l'agent ne peut pas surcharger le callback URL par requête.

**Fix recommandé** : File de retry persistée en DB avec backoff exponentiel (3 tentatives : 5s, 30s, 5min).

### 2.4. Pas de Circuit Breaker sur Telegram

Le send Telegram est exécuté en fire-and-forget (`fetch(...).then(...).catch(...)`) sans circuit breaker. Si le bot est banni ou l'API Telegram est en panne, chaque requête de validation génère une erreur silencieuse. L'opérateur n'est pas alerté, et les requêtes s'accumulent en pending sans notification.

### 2.5. Pas de mécanisme d'idempotence côté agent

Un agent qui crash immédiatement après l'appel à `oracle_validate` (avant de recevoir le `request_id`) ne peut pas savoir si sa requête a bien été créée. Il n'y a pas de `idempotency_key` dans le payload — l'agent peut donc créer des requêtes en double en cas de retry.

**Fix recommandé** : Support d'un header ou champ `idempotency_key` (ex: hash de l'action) qui retourne la requête existante si la même clé est soumise dans un fenêtre de 5 minutes.

---

## 3. Patterns Agentiques Manquants

### 3.1. Validation par Lots (Batch Validation)

Les agents autonomes de trading, de déploiement ou d'orchestration doivent souvent soumettre plusieurs actions en séquence rapide (ex: arbitrage sur 3 paires simultanées, déploiement de 5 microservices). Le protocole actuel force un appel `oracle_validate` séquentiel par action, avec un polling indépendant pour chacune.

**Pattern manquant** : `oracle_batch_validate` — soumet un tableau d'actions et retourne un tableau de `request_id`. L'humain voit un résumé groupé sur Telegram/dashboard et peut approuver/rejeter le lot entier ou action par action.

### 3.2. Niveaux de Priorité et Escalade

Toutes les requêtes sont traitées de manière égale. En production, un agent DeFi gérant une liquidation urgente (fenêtre de 30 secondes) et un agent de reporting qui soumet un rapport mensuel ne devraient pas avoir la même priorité.

**Manquants :**
- `priority` field (LOW / MEDIUM / HIGH / CRITICAL) avec routage différentiel (SMS pour CRITICAL, Telegram pour MEDIUM, email digest pour LOW)
- `auto_approve_if_no_response` boolean — pour les cas où l'inaction est plus risquée que l'action
- `escalate_to` — ID d'un superviseur alternatif si le principal ne répond pas dans X secondes

### 3.3. Délégation et Multi-superviseur

Le système actuel est mono-superviseur (un seul `TELEGRAM_CHAT_ID`). Les cas d'usage enterprise exigent :
- **Quorum** : "Approuvé seulement si 2 superviseurs sur 3 approuvent"
- **Délégation temporaire** : "Si superviseur A est offline, router vers superviseur B"
- **Séparation des rôles** : "Les actions > $10,000 requièrent le CFO, les actions < $1,000 peuvent être approuvées par n'importe quel admin"

### 3.4. Contexte Partagé Inter-Agents (Multi-Agent Coordination)

AutoGen, CrewAI et LangGraph supportent des architectures multi-agents où un agent orchestrateur délègue à des agents spécialisés. Dans ce contexte, l'action critique peut résulter de la collaboration de 3 agents différents. ORACLE-H ne permet pas d'attacher un contexte de conversation ou une trace d'exécution à une requête de validation. L'humain voit uniquement les 3 champs textuels, sans savoir quel sous-agent a initié l'action.

**Manquant** : `execution_trace` (array d'étapes) et `parent_agent_id` pour les architectures multi-agents.

### 3.5. Feedback Loop et Apprentissage

Aucun mécanisme ne permet à l'humain de laisser un commentaire lors du rejet. L'agent reçoit `"rejected"` mais pas le raisonnement humain. Cela brise la boucle de feedback qui est le cœur de la valeur long-terme d'un système HITL.

**Manquant** : `rejection_reason` (string libre) optionnel dans la décision, transmis dans le webhook payload à l'agent.

---

## 4. Sécurité — Analyse et Hardening

### 4.1. Secret par défaut en production (Critique)

```
const ADMIN_SECRET = process.env.ORACLE_ADMIN_SECRET || "oracle-admin-dev-secret";
const WEBHOOK_SECRET = process.env.ORACLE_WEBHOOK_SECRET || "oracle-h-dev-secret-change-in-production";
```

Ces fallbacks sont dangereux. Si la variable d'environnement n'est pas définie en production (oubli de configuration), le service démarre avec un secret connu publiquement. **Il n'y a aucune vérification au démarrage que ces secrets ont bien été configurés.**

**Fix recommandé** : Au démarrage (`getDb()` ou un module `startup.ts`), vérifier que toutes les variables critiques sont définies et non-vides. Si ce n'est pas le cas, `process.exit(1)` avec un message explicite.

### 4.2. Demo Key en Production

La `demo-signature-key-change-in-production` est seedée en base au démarrage si l'agent de démo n'existe pas. En production live (`oracle-h.online`), cela signifie que **n'importe qui connaissant cette clé publique peut soumettre des requêtes de validation légitimes**.

Bien que le site soit un démo, si le `TELEGRAM_CHAT_ID` de l'opérateur est configuré, l'opérateur recevra des notifications pour des requêtes soumises par des tiers malveillants utilisant la clé démo.

**Fix recommandé** : Désactiver le seed de l'agent démo en production (variable d'env `SEED_DEMO_AGENT=false`), ou limiter son `expires_at` à une durée courte.

### 4.3. Telegram Webhook sans Vérification de Signature

Le handler `/api/webhook/telegram` ne vérifie pas la signature Telegram (`X-Telegram-Bot-Api-Secret-Token`). N'importe qui qui connaît l'URL du webhook peut envoyer un faux `callback_query` avec un `decide|req_xxx|approved` et approuver une requête.

Telegram fournit un mécanisme de `secret_token` lors de la registration du webhook via `setWebhook`. Ce token doit être vérifié dans le header `X-Telegram-Bot-Api-Secret-Token`.

**Sévérité : CRITIQUE** — C'est une vulnérabilité permettant une élévation de privilège complète.

**Fix recommandé** :
```typescript
const telegramSecret = req.headers.get("x-telegram-bot-api-secret-token");
if (telegramSecret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
}
```

### 4.4. Injection via `callback_data` Telegram

Le parsing de `callback_data` utilise `data.split("|")` avec une validation `parts.length !== 3`. Un attaquant contrôlant le `callback_data` (ex: via manipulation du bot) pourrait injecter un `requestId` d'une requête d'un autre agent. La vérification d'appartenance (`agent_id`) n'est pas faite dans le handler Telegram.

### 4.5. Pas de Rate Limiting sur `/api/v1/validate`

Un agent malveillant (ou un bug de boucle infinie) peut spammer l'endpoint `/api/v1/validate` avec des requêtes valides et inonder l'opérateur de notifications Telegram. Aucun rate limiting par `agent_id` n'est implémenté.

**Fix recommandé** : Rate limiting par `agent_id` en mémoire (ou Redis si multi-instance) : max 10 requêtes pending simultanées par agent.

### 4.6. Le ADMIN_SECRET Transit en Header HTTP Non-Hashé

Le secret admin est envoyé en clair dans le header `X-Oracle-Admin-Secret`. Bien que HTTPS protège le transit, ce secret apparaît en clair dans les logs Next.js si le logging est verbeux.

---

## 5. Scalabilité — SQLite sous Charge Multi-Agents

### 5.1. Performances actuelles avec WAL Mode

SQLite avec WAL mode (correctement configuré dans `db.ts`) offre :
- **Lectures concurrentes illimitées** (non bloquantes entre elles, non bloquées par un writer)
- **Un seul writer à la fois** — toutes les écritures sont sérialisées
- Performances typiques : 5,000-50,000 writes/sec en local, 500-5,000 writes/sec sur un VPS Hetzner avec I/O partagé

### 5.2. Goulots d'étranglement identifiés

**Contexte ORACLE-H** : Chaque requête de validation génère :
1. 1 `INSERT` dans `validation_requests` (`/validate`)
2. 1 `UPDATE` + 1 `INSERT` dans `decisions` (`/decide`)
3. N `SELECT` de polling (`/status`) — reads, non-bloquants

Les writes sont rares (une décision = 2 statements). Les reads de polling sont potentiellement fréquents mais non-bloquants avec WAL.

**Seuil de viabilité SQLite pour ORACLE-H** :
- **< 50 agents simultanés** avec fréquence de validation < 1/min chacun : SQLite est parfaitement adapté, aucune migration nécessaire.
- **50-500 agents** : Surveiller la contention en écriture. Implémenter un connection pool (better-sqlite3 est synchrone et single-threaded — en Next.js multi-process, chaque process a sa propre connexion WAL, ce qui est correct).
- **> 500 agents actifs** ou validations > 100/min : Migrer vers **Turso** (SQLite distribué, multi-writer via libSQL) ou **PostgreSQL** (Neon, Supabase).

### 5.3. Problème spécifique : Singleton DB en Next.js

```typescript
let db: Database.Database | null = null;
export function getDb(): Database.Database {
  if (db) return db;
  // ...
}
```

Ce singleton fonctionne correctement **dans un seul process Node.js**. Mais Next.js en production peut spawner **plusieurs workers** (mode cluster, ou sur Vercel/Railway). Chaque worker a son propre singleton — ce qui est correct pour SQLite WAL (multiple readers, one writer per file). Cependant, si le déploiement est sur un provider serverless (Vercel Edge), SQLite ne peut pas être utilisé du tout.

**Recommandation** : Documenter explicitement que ORACLE-H nécessite un déploiement sur serveur persistant (VPS Hetzner, Railway, Fly.io) — pas Vercel Edge/Cloudflare Workers.

### 5.4. Quand migrer de SQLite ?

| Critère | Action |
|---------|--------|
| > 100 agents actifs simultanément | Ajouter monitoring SQLite WAL lag |
| > 10 writes/seconde en moyenne | Profiler et envisager connection pooling |
| > 1 instance du service | Migrer vers Turso ou PostgreSQL |
| Besoin de backups automatiques | Litestream (streaming SQLite → S3) |
| Compliance/audit externe | PostgreSQL + audit log table dédiée |

---

## 6. État de l'Art HITL 2025-2026

### 6.1. Frameworks de référence

**LangGraph** est le standard de facto pour les workflows HITL structurés en 2025-2026. Sa primitive `interrupt()` permet de pauser un graph mid-execution, attendre une décision humaine, et reprendre proprement. Le state est persisté automatiquement. C'est le pattern qu'ORACLE-H devrait pouvoir servir nativement.

**OpenAI Agents SDK** (mars 2025) intègre les `guardrails` comme primitive de premier niveau — ce qui positionne ORACLE-H comme un guardrail external.

**CrewAI** expose `HumanTool` — un tool que l'agent peut appeler pour demander une input humaine. ORACLE-H est conceptuellement un `HumanTool` avancé et distribué.

**AutoGen** supporte `human_input_mode` (ALWAYS / NEVER / TERMINATE) mais reste conversationnel — moins adapté aux approbations structurées.

### 6.2. Patterns HITL en production (2025)

Les patterns les plus adoptés en 2025-2026 :
1. **Confidence threshold routing** : Si score de confiance < seuil → validation humaine automatique
2. **Interrupt and resume** : Pause du workflow, wait async, resume avec la décision injectée dans le state
3. **Optimistic execution with rollback** : L'agent exécute mais peut rollback si rejeté dans une fenêtre de temps
4. **Audit trail as first-class citizen** : Chaque décision humaine devient du training data
5. **Multi-modal notification** : Telegram + email + Slack selon urgence et disponibilité du superviseur

ORACLE-H implémente correctement les patterns 1 (watchdog), 2 (polling/webhook), et 5 (Telegram). Les patterns 3, 4 sont manquants.

---

## 7. Améliorations Priorisées

### Niveau 1 — Correctifs Critiques (à faire immédiatement)

| # | Amélioration | Effort | Impact |
|---|--------------|--------|--------|
| 1 | **Vérification signature Telegram webhook** (`X-Telegram-Bot-Api-Secret-Token`) | 30min | CRITIQUE — sécurité |
| 2 | **Fail-fast au démarrage** si secrets non configurés (pas de fallback silencieux) | 1h | HAUTE — prod safety |
| 3 | **Transaction SQLite atomique** pour les updates de décision (race condition Telegram + dashboard) | 2h | HAUTE — data integrity |
| 4 | **Désactiver le seed demo en production** via env var | 30min | HAUTE — sécurité |

### Niveau 2 — Amélioration Protocole (sprint 1)

| # | Amélioration | Effort | Impact |
|---|--------------|--------|--------|
| 5 | **Tool `oracle_cancel`** — annulation d'une requête pending | 3h | HAUTE — UX agent |
| 6 | **Tool `oracle_list_pending`** — recovery après crash agent | 3h | HAUTE — robustesse |
| 7 | **Tool `oracle_wait`** — long-polling bloquant (élimine le polling manuel) | 1 jour | HAUTE — DX |
| 8 | **Job de cleanup** — marquer expired les requêtes périmées en DB | 2h | MOYENNE — data hygiene |
| 9 | **Retry logic webhook** — 3 tentatives backoff exponentiel | 4h | HAUTE — fiabilité |
| 10 | **Idempotency key** sur `oracle_validate` | 3h | MOYENNE — agent resilience |

### Niveau 3 — Features Avancées (sprint 2)

| # | Amélioration | Effort | Impact |
|---|--------------|--------|--------|
| 11 | **`rejection_reason`** dans le webhook payload | 2h | HAUTE — feedback loop |
| 12 | **Niveaux de priorité** (LOW/MEDIUM/HIGH/CRITICAL) avec routage différentiel | 1 jour | HAUTE — enterprise |
| 13 | **Rate limiting** par `agent_id` sur `/validate` | 3h | MOYENNE — sécurité |
| 14 | **`oracle_batch_validate`** — validation groupée | 2 jours | MOYENNE — trading bots |
| 15 | **MCP Resources** (`oracle://requests/pending`, `oracle://agents/me`) | 1 jour | MOYENNE — DX |

### Niveau 4 — Vision Long-terme

| # | Amélioration | Effort | Impact |
|---|--------------|--------|--------|
| 16 | **Multi-superviseur avec quorum** | 1 semaine | HAUTE — enterprise |
| 17 | **`execution_trace`** pour multi-agent coordination | 3 jours | MOYENNE — AutoGen/CrewAI |
| 18 | **Migration Turso** pour scaling multi-instance | 3 jours | HAUTE — scalabilité |
| 19 | **Webhook retry queue** persistée avec visibility dashboard | 2 jours | MOYENNE — ops |
| 20 | **Audit export** (CSV/JSON) des décisions pour compliance | 1 jour | MOYENNE — enterprise |

---

## 8. Synthèse Architecturale

```
ORACLE-H v1.0 (état actuel)
────────────────────────────
Forces :
  ✓ Watchdog anti-hallucination — original et pertinent
  ✓ Signature HMAC webhooks — bonne primitive sécurité
  ✓ SQLite WAL — correct pour la charge actuelle
  ✓ SSE dashboard — temps réel fonctionnel
  ✓ MCP stdio — compatible Claude Desktop, Cursor, Windsurf

Failles critiques :
  ✗ Telegram webhook non authentifié — CVE potentiel
  ✗ Race condition sur double-décision
  ✗ Secrets avec fallback en production
  ✗ Expiration non persistée en DB
  ✗ Surface MCP insuffisante (2 tools sur ~8 nécessaires)

ORACLE-H v2.0 (cible recommandée)
────────────────────────────────────
  + 4 correctifs sécurité (Niveau 1)
  + 6 tools MCP (cancel, list, wait, batch, resources, prompts)
  + Retry webhook avec file persistée
  + Priority routing + multi-superviseur basique
  + Rejection reason dans feedback
  + Cleanup job + monitoring SQLite
```

---

*Rapport établi par Dr. Yuki Tanaka — AI Safety & Agent Infrastructure Architect*
*Basé sur l'analyse du code source ORACLE-H (commit courant) et l'état de l'art HITL 2025-2026*

### Sources de référence

- [Human-in-the-Loop for AI Agents — Permit.io](https://www.permit.io/blog/human-in-the-loop-for-ai-agents-best-practices-frameworks-use-cases-and-demo)
- [Future of HITL AI (2026) — Parseur](https://parseur.com/blog/future-of-hitl-ai)
- [Human-in-the-Loop HitL Agentic AI for High-Stakes Oversight 2026 — OneReach](https://onereach.ai/blog/human-in-the-loop-agentic-ai-systems/)
- [MCP Tools Specification (2025-06-18) — Anthropic](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
- [MCP Tool Description Smells — arxiv Feb 2026](https://arxiv.org/html/2602.14878v1)
- [Code execution with MCP — Anthropic Engineering](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [LangGraph vs AutoGen vs CrewAI 2026 — DEV.to](https://dev.to/synsun/autogen-vs-langgraph-vs-crewai-which-agent-framework-actually-holds-up-in-2026-3fl8)
- [SQLite Concurrent Writes and Database Locked — 10000meters](https://tenthousandmeters.com/blog/sqlite-concurrent-writes-and-database-is-locked-errors/)
- [SQLite WAL Internals — Fly.io](https://fly.io/blog/sqlite-internals-wal/)
- [Beyond Single-Writer Limitation with Turso — Turso.tech](https://turso.tech/blog/beyond-the-single-writer-limitation-with-tursos-concurrent-writes)
- [MCP Best Practices 2025 — modelcontextprotocol.info](https://modelcontextprotocol.info/docs/best-practices/)
- [7 MCP Server Best Practices — MarkTechPost](https://www.marktechpost.com/2025/07/23/7-mcp-server-best-practices-for-scalable-ai-integrations-in-2025/)
- [Exposing Agents as MCP Servers — Glama.ai](https://glama.ai/blog/2025-09-09-exposing-agents-as-mcp-servers-with-mcp-agent)
