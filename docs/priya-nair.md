# Distribution Audit & Ecosystem Strategy — ORACLE-H MCP Server
**Agent**: Priya Nair — Developer Ecosystem & Distribution Architect
**Date**: 2026-03-07
**Scope**: Full audit de la présence existante + roadmap de distribution 30/60/90 jours

---

## Executive Summary

ORACLE-H est un produit techniquement solide avec un angle unique : la validation humaine obligatoire pour agents IA autonomes. Ce positionnement "Human-on-the-Loop" est exactement ce que les développeurs réclament en 2026 (approval gates, audit trails, granular permissions). Le problème est structurel : **la distribution est quasiment inexistante**. Le package npm ne semble pas indexé dans les résultats standards, le README ne couvre que 3 clients sur 10+ disponibles, et le serveur n'est listé que sur Smithery. La marge de progression est considérable.

---

## 1. Audit des Registres MCP

### 1.1 Cartographie complète des registres

| Registre | URL | Taille catalogue | oracle-h-mcp listé ? | Méthode de soumission |
|---|---|---|---|---|
| **Official MCP Registry** | [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io/) | En croissance (lancé sep. 2025) | Non | CLI `mcp-publisher` + auth GitHub |
| **Smithery** | [smithery.ai](https://smithery.ai/server/@tponscr-debug/oracle-h-mcp) | Large | **Oui** (smithery.yaml present) | smithery.yaml dans le repo |
| **PulseMCP** | [pulsemcp.com](https://www.pulsemcp.com/servers) | 8 590+ serveurs (màj quotidienne) | Non (non détecté) | Soumission manuelle : pulsemcp.com/submit |
| **Glama** | [glama.ai/mcp/servers](https://glama.ai/mcp/servers) | Milliers, màj quotidienne | Non | Via Discord ou GitHub PR |
| **mcp.so** | [mcp.so](https://mcp.so/) | Large, vérifié | Non | Bouton "Submit" sur la homepage |
| **LobeHub MCP** | [lobehub.com/mcp](https://lobehub.com/mcp) | Large marketplace | Non | PR GitHub sur le repo LobeHub |
| **awesome-mcp-servers (punkpeye)** | [github.com/punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) | Curated, synced avec web directory | Non | PR GitHub |
| **awesome-mcp-servers (wong2)** | [github.com/wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers) | Curated list | Non | PR GitHub |
| **MCP Server Finder** | [mcpserverfinder.com](https://www.mcpserverfinder.com/) | Directory agrégé | Non | Soumission directe |
| **mcpservers.org** | [mcpservers.org](https://mcpservers.org) | Agrégateur | Non | À vérifier |
| **Docker MCP Catalog** | [hub.docker.com/mcp](https://hub.docker.com/mcp) | Docker officiel | Non | Image Docker requise |
| **ClawHub** | [clawhub.ai](https://clawhub.ai/) | Skills registry agentique | Non | À explorer |

### 1.2 Priorité de soumission

**Tier 1 — Impact maximal, action immédiate**
1. **Official MCP Registry** : Le registre officiel Anthropic/MCP. Être listé ici donne une légitimité institutionnelle. Prérequis : `mcp-publisher login` (auth GitHub). Naming convention : `io.github.tponscr-debug/oracle-h-mcp`.
2. **PulseMCP** : 8 590+ serveurs, mise à jour quotidienne, intégré dans des outils tiers. Soumission en 5 minutes via [pulsemcp.com/submit](https://www.pulsemcp.com/submit).
3. **Glama** : Considéré comme le "registre le plus complet". Rejoindre leur Discord + PR sur leur repo.

**Tier 2 — Distribution curated**
4. **awesome-mcp-servers (punkpeye)** : Fork le plus actif, synced avec un web directory. PR GitHub avec la catégorie "Security" ou "Human-in-the-loop".
5. **mcp.so** : Processus de vérification = badge de légitimité. Soumission via le bouton Submit.
6. **LobeHub MCP** : Large audience, interface marketplace soignée.

**Tier 3 — Long tail**
7. awesome-mcp-servers (wong2), MCP Server Finder, mcpservers.org, Docker MCP Catalog (nécessite Dockerfile), ClawHub.

---

## 2. Audit npm

### 2.1 État actuel du package

| Attribut | Valeur actuelle | Problème identifié |
|---|---|---|
| `name` | `oracle-h-mcp` | OK — nom unique, mais peu découvrable sans connaître le projet |
| `description` | `"MCP Server for ORACLE-H — Human-on-the-Loop validation for autonomous AI agents"` | Bonne base, manque de keywords SEO dans la description |
| `keywords` | `["mcp", "oracle-h", "human-in-the-loop", "ai-safety", "validation"]` | Critique — 5 keywords seulement, manque tous les termes de découverte |
| `repository` | Absent du package.json | Lien vers le GitHub manquant — pénalise le npm score |
| `homepage` | Absent | Lien vers oracle-h.online manquant |
| `bugs` | Absent | |
| `author` | Absent | |
| `engines` | Absent | Recommandé pour spécifier Node.js version |
| Badges README | 1 seul (Smithery) | Manque : npm version, license, downloads |

### 2.2 Keywords critiques manquants

Le scoring npm (npms.io) favorise les packages avec des keywords pertinents. Keywords à ajouter immédiatement :

```json
"keywords": [
  "mcp",
  "model-context-protocol",
  "human-in-the-loop",
  "human-on-the-loop",
  "ai-safety",
  "ai-agent",
  "autonomous-agent",
  "agent-validation",
  "approval-workflow",
  "telegram",
  "claude",
  "cursor",
  "windsurf",
  "cline",
  "agentic-ai",
  "oversight",
  "validation",
  "checkpoint",
  "mcp-server"
]
```

### 2.3 Champs package.json à ajouter

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/tponscr-debug/oracle-h-mcp"
  },
  "homepage": "https://oracle-h.online",
  "bugs": {
    "url": "https://github.com/tponscr-debug/oracle-h-mcp/issues"
  },
  "author": "tponscr-debug",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 2.4 Badges README à ajouter

```markdown
[![npm version](https://badge.fury.io/js/oracle-h-mcp.svg)](https://www.npmjs.com/package/oracle-h-mcp)
[![npm downloads](https://img.shields.io/npm/dm/oracle-h-mcp.svg)](https://www.npmjs.com/package/oracle-h-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![smithery badge](https://smithery.ai/badge/@tponscr-debug/oracle-h-mcp)](https://smithery.ai/server/@tponscr-debug/oracle-h-mcp)
```

---

## 3. Intégrations manquantes dans la documentation

### 3.1 Matrice de support par client

| Client / Framework | Support MCP | Config ORACLE-H documentée ? | Priorité |
|---|---|---|---|
| Claude Desktop | Oui (natif) | **Oui** | — |
| Cursor | Oui | **Oui** | — |
| Windsurf | Oui | **Oui** | — |
| **Cline (VS Code)** | Oui — `cline_mcp_settings.json` | **Non** | Haute |
| **Roo Code (VS Code)** | Oui — `mcp_settings.json` ou `.roo/mcp.json` | **Non** | Haute |
| **Continue.dev** | Oui — `.continue/mcpServers/` YAML | **Non** | Moyenne |
| **Zed Editor** | Oui — `context_servers` dans settings.json | **Non** | Moyenne |
| **GitHub Copilot (VS Code)** | Oui depuis jul. 2025 — config MCP dans VS Code | **Non** | Haute |
| **OpenHands** | Oui — MCP Settings dans l'interface | **Non** | Moyenne |
| **n8n** | Oui — MCP Client Tool node | **Non** | Haute (workflow automation) |
| **LangGraph (Python)** | Oui — `langchain_mcp_adapters` | **Non** | Haute (dev Python) |
| **AutoGen / MS Agent Framework** | Oui — `autogen_ext.tools.mcp` | **Non** | Moyenne |
| **Aider** | Pas natif (workarounds via AiderDesk) | **Non** | Basse |

### 3.2 Snippets de configuration à documenter

**Cline (VS Code)** — fichier `cline_mcp_settings.json` :
```json
{
  "mcpServers": {
    "oracle-h": {
      "command": "npx",
      "args": ["-y", "oracle-h-mcp"],
      "env": {
        "ORACLE_SIGNATURE_KEY": "<your-signature-key>",
        "ORACLE_BASE_URL": "https://oracle-h.online"
      }
    }
  }
}
```

**Roo Code (VS Code)** — fichier `.roo/mcp.json` (project-level) :
```json
{
  "mcpServers": {
    "oracle-h": {
      "command": "npx",
      "args": ["-y", "oracle-h-mcp"],
      "env": {
        "ORACLE_SIGNATURE_KEY": "<your-signature-key>",
        "ORACLE_BASE_URL": "https://oracle-h.online"
      }
    }
  }
}
```

**Continue.dev** — fichier `.continue/mcpServers/oracle-h.yaml` :
```yaml
name: oracle-h
version: 1.0.0
schema: v1
mcpServers:
  - name: oracle-h
    command: npx
    args:
      - -y
      - oracle-h-mcp
    env:
      ORACLE_SIGNATURE_KEY: <your-signature-key>
      ORACLE_BASE_URL: https://oracle-h.online
```

**Zed Editor** — dans `settings.json` :
```json
{
  "context_servers": {
    "oracle-h": {
      "command": {
        "path": "npx",
        "args": ["-y", "oracle-h-mcp"]
      },
      "env": {
        "ORACLE_SIGNATURE_KEY": "<your-signature-key>",
        "ORACLE_BASE_URL": "https://oracle-h.online"
      }
    }
  }
}
```

**LangGraph (Python)** :
```python
from langchain_mcp_adapters.client import MultiServerMCPClient

async with MultiServerMCPClient({
    "oracle-h": {
        "command": "npx",
        "args": ["-y", "oracle-h-mcp"],
        "env": {
            "ORACLE_SIGNATURE_KEY": "your-key",
            "ORACLE_BASE_URL": "https://oracle-h.online"
        },
        "transport": "stdio"
    }
}) as client:
    tools = client.get_tools()
```

**n8n** — Utiliser le noeud "MCP Client Tool" en pointant vers le serveur ORACLE-H via supergateway (proxy stdio→HTTP) pour exposer l'endpoint SSE à n8n.

---

## 4. Plan de contenu pour la distribution

### 4.1 Articles Dev.to / Hashnode (contenu long-form)

| Titre | Angle | Canal | Impact estimé |
|---|---|---|---|
| "Why Your AI Agent Needs a Kill Switch: Building Human Oversight with MCP" | Sécurité, philosophique | Dev.to | Viral potential |
| "Stop Your Claude Agent Before It Does Something Stupid — ORACLE-H MCP Tutorial" | Tutoriel pratique | Hashnode | SEO fort |
| "Human-on-the-Loop vs Human-in-the-Loop: The Architecture Choice That Defines Autonomous AI" | Conceptuel | Dev.to | Thought leadership |
| "5 Lines of MCP Config That Give You Complete Control Over Your AI Agent" | Quick win | Dev.to | High shareability |
| "I Let Claude Manage My Production Server — Here's the Safety Net I Built" | Case study | Hashnode | Relatable |

### 4.2 Reddit — threads ciblés

| Subreddit | Type de post | Timing |
|---|---|---|
| r/ClaudeAI | "Anyone else worried about Claude agents running amok? Here's what I built" | Après article Dev.to |
| r/LocalLLaMA | "MCP server that pauses your agent and asks you via Telegram before destructive actions" | Demo vidéo disponible |
| r/AIAgents | "Show r/AIAgents: ORACLE-H — Human approval gateway for autonomous agents via MCP" | Jour 1 |
| r/MachineLearning | "Human-on-the-Loop patterns for production AI agents: architecture and implementation" | Semaine 4 |
| r/n8n | "Use ORACLE-H with n8n to gate your AI workflows with Telegram approval" | Après doc n8n |

### 4.3 Hacker News — Show HN Strategy

**Post optimal** :
```
Show HN: ORACLE-H – Telegram approval gate for autonomous AI agents via MCP

Built this after my Claude agent almost deleted a production DB.
ORACLE-H is an MCP server that intercepts risky agent actions and sends
a Telegram notification with Approve/Reject buttons.

Demo key included — works with Claude Desktop, Cursor, Cline in 60 seconds.
```

**Timing** : Mardi ou mercredi matin 9h EST (peak HN traffic).
**Préparation** : Avoir la démo vidéo prête, les commentaires des early testers, et un article détaillé à linker.

### 4.4 Twitter/X Thread Strategy

Thread en 8 tweets :
1. Hook : "I let Claude autonomously manage a production server. It tried to run `rm -rf`. Here's how I caught it."
2. Gif/vidéo de la notification Telegram arrivant
3. Explication du flow : agent → oracle_validate → Telegram → approve/reject
4. Code snippet : 5 lignes de config
5. Le chiffre clé : 81.5% → 99.6% de fiabilité avec checkpoint humain
6. Liste des clients supportés (avec les nouveaux après audit)
7. Démo key disponible — try it now
8. CTA : Star le repo, lien npm

### 4.5 YouTube Demo Script Outline

**Durée cible** : 4-6 minutes
**Structure** :
1. (0:00-0:30) Hook : "Your AI agent just deleted your database. This video shows how to prevent that."
2. (0:30-1:30) Démo live : agent Claude qui tente une action risquée → notification Telegram arrive en temps réel → approval → agent continue
3. (1:30-2:30) Installation en 60 secondes : Claude Desktop config, démo key
4. (2:30-3:30) Architecture : comment fonctionne oracle_validate + oracle_poll_status
5. (3:30-4:30) Use cases : deployments, DB migrations, file deletions, API calls coûteuses
6. (4:30-5:00) CTA : lien npm, Smithery, GitHub

---

## 5. Documentation manquante

### 5.1 Guides d'intégration manquants (priorités)

| Document | Format | Urgence |
|---|---|---|
| Guide Cline (VS Code) avec screenshots | Markdown + images | Haute |
| Guide Roo Code avec project-level config | Markdown | Haute |
| Guide GitHub Copilot MCP | Markdown | Haute |
| Guide n8n workflow complet | Markdown + template JSON | Haute |
| Guide LangGraph Python | Notebook / article | Moyenne |
| Guide Continue.dev | Markdown | Moyenne |
| Guide Zed Editor | Markdown | Moyenne |

### 5.2 Exemples de code par langage

**Python (LangGraph/direct)** :
```python
# oracle_guard.py — wrapper ORACLE-H pour agents Python
import httpx
import time

class OracleGuard:
    def __init__(self, signature_key: str, base_url: str = "https://oracle-h.online"):
        self.key = signature_key
        self.base = base_url

    def validate(self, action: str, rationale: str, impact: str, ttl: int = 300) -> bool:
        headers = {"Authorization": f"Bearer {self.key}"}
        r = httpx.post(f"{self.base}/api/validate", json={
            "action": action, "rationale": rationale,
            "projected_impact": impact, "ttl": ttl
        }, headers=headers)
        request_id = r.json()["request_id"]

        # Poll for decision
        for _ in range(ttl // 5):
            time.sleep(5)
            status = httpx.get(f"{self.base}/api/status/{request_id}", headers=headers)
            decision = status.json().get("status")
            if decision == "approved": return True
            if decision in ("rejected", "expired"): return False
        return False
```

**TypeScript (direct HTTP)** :
```typescript
// oracle-guard.ts
export async function oracleValidate(
  action: string, rationale: string, impact: string,
  key: string, ttl = 300
): Promise<boolean> {
  const base = "https://oracle-h.online";
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  const { request_id } = await fetch(`${base}/api/validate`, {
    method: "POST", headers,
    body: JSON.stringify({ action, rationale, projected_impact: impact, ttl })
  }).then(r => r.json());

  for (let i = 0; i < ttl / 5; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const { status } = await fetch(`${base}/api/status/${request_id}`, { headers }).then(r => r.json());
    if (status === "approved") return true;
    if (status === "rejected" || status === "expired") return false;
  }
  return false;
}
```

### 5.3 Guides de déploiement manquants

| Guide | Utilité | Effort |
|---|---|---|
| Docker (auto-hébergement ORACLE-H server) | Enterprises qui ne veulent pas SaaS | Moyen |
| Railway deploy (1-click) | Développeurs solo | Faible |
| Vercel (API routes) | Si refactor serverless possible | Élevé |
| `supergateway` bridge (stdio → HTTP/SSE) | Nécessaire pour n8n, OpenHands cloud | Faible |

### 5.4 Documentation API à enrichir

Le fichier `llms.txt` à [oracle-h.online/llms.txt](https://oracle-h.online/llms.txt) est une excellente initiative. Compléter avec :
- Exemples curl complets pour chaque endpoint
- Guide d'authentification détaillé (génération de clé, rotation)
- Codes d'erreur documentés
- Rate limits explicites

---

## 6. Plan de distribution priorisé — Roadmap 30/60/90 jours

### Phase 1 — Fondations (Jours 1-30)

| Action | Impact | Effort | Lien/Ressource |
|---|---|---|---|
| **Publier sur Official MCP Registry** | Elevé | Faible (CLI) | [modelcontextprotocol.io/registry/quickstart](https://modelcontextprotocol.io/registry/quickstart) |
| **Soumettre sur PulseMCP** | Elevé | Très faible | [pulsemcp.com/submit](https://www.pulsemcp.com/submit) |
| **Soumettre sur mcp.so** | Elevé | Très faible | [mcp.so](https://mcp.so/) — bouton Submit |
| **PR awesome-mcp-servers (punkpeye)** | Elevé | Faible | [github.com/punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) |
| **Optimiser package.json npm** (keywords, repo, homepage) | Elevé | Très faible | Voir section 2.3 |
| **Ajouter badges npm au README** | Moyen | Très faible | Voir section 2.4 |
| **Documenter Cline + Roo Code + GitHub Copilot** | Elevé | Faible | Voir section 3.2 |
| **Créer repo GitHub public** | Elevé | Faible | Prérequis pour Official Registry |
| **Post r/AIAgents Show** | Moyen | Faible | Après README enrichi |

### Phase 2 — Amplification (Jours 31-60)

| Action | Impact | Effort | Lien/Ressource |
|---|---|---|---|
| **Soumettre sur Glama** | Elevé | Moyen | Discord Glama + PR |
| **Soumettre sur LobeHub MCP** | Moyen | Faible | PR GitHub LobeHub |
| **Documenter n8n + LangGraph** | Elevé | Moyen | Voir section 3.2 |
| **Article Dev.to "Why Your AI Agent Needs a Kill Switch"** | Elevé | Moyen | [dev.to](https://dev.to) |
| **Thread Twitter/X** (avec démo GIF Telegram) | Elevé | Faible | Voir section 4.4 |
| **Démo vidéo YouTube** (4-6 min) | Elevé | Élevé | Voir section 4.5 |
| **Show HN** | Très élevé | Moyen | Timing : mardi 9h EST |
| **Ajouter exemples Python + TypeScript** | Moyen | Faible | Voir section 5.2 |
| **PR awesome-mcp-servers (wong2)** | Moyen | Très faible | [github.com/wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers) |

### Phase 3 — Expansion (Jours 61-90)

| Action | Impact | Effort | Lien/Ressource |
|---|---|---|---|
| **Guide déploiement Railway** (1-click self-host) | Elevé | Moyen | [railway.app](https://railway.app) |
| **Image Docker officielle + Docker MCP Catalog** | Moyen | Moyen | [hub.docker.com/mcp](https://hub.docker.com/mcp) |
| **Article Hashnode "5 Lines of MCP Config"** | Moyen | Faible | [hashnode.com](https://hashnode.com) |
| **Threads Reddit ciblés** (r/LocalLLaMA, r/ClaudeAI, r/n8n) | Moyen | Faible | Voir section 4.2 |
| **Intégration Continue.dev + Zed documentées** | Moyen | Faible | Voir section 3.2 |
| **Page de documentation dédiée par client** | Elevé | Moyen | Site oracle-h.online/docs |
| **Outreach influenceurs MCP** (builders actifs sur Twitter) | Très élevé | Moyen | DM builders avec > 5k followers MCP |
| **Guide AutoGen / MS Agent Framework** | Moyen | Moyen | Audience enterprise |

---

## 7. Insights stratégiques

### 7.1 Positionnement différentiant

L'écosystème MCP en 2026 compte 8 500+ serveurs. La majorité sont des **connecteurs** (databases, APIs, fichiers). ORACLE-H est rare dans la catégorie **sécurité et oversight agentique**. Ce positionnement doit être le cœur de toute communication : pas "un MCP server de plus", mais **"la sécurité obligatoire avant que vos agents IA ne fassent une connerie irréversible"**.

L'angle émotionnel fonctionne : les développeurs ont peur de leurs propres agents. Le chiffre 81.5% → 99.6% de fiabilité avec checkpoint humain est une accroche puissante qui doit figurer dans TOUTE communication.

### 7.2 L'urgence de la présence GitHub publique

L'Official MCP Registry nécessite un repo GitHub vérifiable (`io.github.username/...`). PulseMCP et Glama crawlent automatiquement GitHub. awesome-mcp-servers est sur GitHub. **Sans repo GitHub public, la moitié des canaux de distribution sont bloqués.** C'est le prérequis n°1.

### 7.3 La démo clé est un avantage compétitif

La démo key immédiate (`demo-signature-key-change-in-production`) est un avantage majeur. Elle doit être **dans les 3 premières lignes de tout article, post Reddit, ou description**. La friction zéro est rare dans l'écosystème MCP — exploiter ça.

### 7.4 Telegram comme différentiateur viral

La notification Telegram avec boutons Approve/Reject est visuellement impressionnante. Un GIF animé montrant la notification arriver en temps réel pendant qu'un agent tourne est le meilleur asset marketing possible. **Créer ce GIF avant tout post public.**

---

## Sources

- [Official MCP Registry](https://registry.modelcontextprotocol.io/)
- [PulseMCP — 8590+ serveurs](https://www.pulsemcp.com/servers)
- [Glama MCP Directory](https://glama.ai/mcp/servers)
- [17+ MCP Registries — Medium](https://medium.com/demohub-tutorials/17-top-mcp-registries-and-directories-explore-the-best-sources-for-server-discovery-integration-0f748c72c34a)
- [Top 5 MCP Directories 2025](https://www.allvoicelab.com/blog/top-5-directories-to-discover-mcp-servers-for-smarter-ai-workflows)
- [Smithery alternatives 2026 — Composio](https://composio.dev/blog/smithery-alternative)
- [Cline MCP Configuration](https://docs.cline.bot/mcp/configuring-mcp-servers)
- [Continue.dev MCP Integration](https://docs.continue.dev/customize/deep-dives/mcp)
- [Roo Code MCP Overview](https://docs.roocode.com/features/mcp/overview)
- [Zed Editor MCP](https://zed.dev/docs/ai/mcp)
- [GitHub Copilot MCP](https://docs.github.com/copilot/customizing-copilot/using-model-context-protocol/extending-copilot-chat-with-mcp)
- [OpenHands MCP Settings](https://docs.openhands.dev/openhands/usage/settings/mcp-settings)
- [n8n MCP Integration](https://docs.n8n.io/advanced-ai/accessing-n8n-mcp-server/)
- [LangGraph MCP Guide 2026](https://generect.com/blog/langgraph-mcp/)
- [AutoGen MCP Integration](https://llmmultiagents.com/en/blogs/autogen_mcp_blog)
- [MCP Registry Quickstart](https://modelcontextprotocol.io/registry/quickstart)
- [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)
- [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers)
- [Aider MCP Support Issues](https://github.com/Aider-AI/aider/issues/3314)
- [Human-in-the-Loop AI Agents 2025](https://fast.io/resources/ai-agent-human-in-the-loop/)
- [MCP Servers are the new npm packages](https://grith.ai/blog/mcp-servers-new-npm-packages)
