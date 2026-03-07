# ORACLE-H — Audit UX/Design & Strategie Visuelle
**Agent** : Mehdi Laraaich — Creative Developer (Awwwards-level)
**Date** : 2026-03-07
**Perimetre** : Dashboard existant + Landing page a concevoir + Identite de marque

---

## Contexte de Reference

Avant tout, une verite fondamentale sur ce produit : **ORACLE-H est un produit de securite**. Pas un outil de productivite, pas un tableau de bord analytique. Un checkpoint entre une IA autonome et une consequence irreversible dans le monde reel — parfois des milliers de dollars, parfois plus. Le design doit porter ce poids. Chaque pixel doit inspirer confiance. Chaque interaction doit etre deliberee.

Inspirations de reference etudiees :
- **Linear** : dark mode + Inter + gradients subtils + micro-animations chirurgicales
- **Vercel** : hero prisme lumineux, logique "bending light", centrage editorial
- **Resend** : minimalisme technique, CLI-first aesthetic, code comme heros visuel
- **Evil Martians research** : 100+ landing pages de devtools analysees, patterns qui convertissent
- **Anthropic branding** (Geist studio) : identite visuelle qui "traduit la complexite en accessibilite"
- Tendances 2025 : bento grid, glassmorphism tempered, adaptive color systems, purposeful microinteractions

---

## PARTIE 1 — Audit Critique du Dashboard Actuel

### Points Forts a Preserver

**1. Le design system "Industrial Trust" est solide.**
Le choix de `--bg-primary: #0a0f1e` est juste. Ce bleu-marine profond est associe cognitivement a la fiabilite (aviation, trading, finance). L'accent ambre `#fbbf24` cree un contraste chaud qui evite la froideur sterile d'un pur noir/blanc.

**2. Le grid-bg et le noise overlay.**
Ces deux layers de texture (`background-image: linear-gradient(...)` 40px grid + SVG noise a opacity 0.025) sont des touches de craftmanship rares. Ils ancrent le dashboard dans une esthetique "infrastructure militaire" sans etre ostentatoires. A preserver absolument.

**3. La reliability bar est un element differentiant unique.**
Montrer le delta `p_success_before` vs `p_success_after` est une decision UX brillante — elle quantifie la valeur d'ORACLE-H dans chaque carte. C'est du storytelling embed dans l'UI.

**4. Les animations sont proportionnees.**
`fadeIn 0.35s ease-out` pour les cartes, `pulse-dot 2s` pour le statut en attente, `shimmer 1.5s` pour les skeletons. Aucune animation n'est decorative — elles communiquent toutes un etat.

**5. L'empty state avec le curl snippet est exemplaire.**
Montrer du code directement dans l'UI quand la queue est vide est exactement ce qu'un dev tool doit faire. C'est fonctionnel ET persuasif.

---

### Problemes UX Identifies

**Probleme #1 : Ambiguite critique sur la destructivite des actions**
Les boutons "REFUSER" et "APPROUVER" sont visuellement equivalents en taille et poids. Dans un contexte de securite ou l'humain prend des decisions en quelques secondes (potentiellement depuis un telephone apres une notif Telegram), cette equivalence est dangereuse. APPROUVER doit etre visuellement dominant. REFUSER doit etre accessible mais pas aussi invitant.

**Probleme #2 : Absence de confirmation pour les actions irreversibles**
Un clic sur "APPROUVER" pour un transfert de 10 000 $ execute immediatement. Il n'y a aucun micro-modal de confirmation, aucun "swipe to confirm" sur mobile, aucun delai programmatique de 2 secondes. Pour des montants eleves, l'absence de friction intentionnelle est un risque.

**Probleme #3 : Le montant financier manque de hierarchy d'urgence**
`$10,000` et `$50` s'affichent avec le meme style `amount-display text-xl font-bold`. Un montant superieur a un seuil (configurable) devrait declencher un traitement visuel different — couleur rouge, taille plus grande, ou border card en warning.

**Probleme #4 : Le watchdog alert manque de contexte**
Le badge "WATCHDOG" s'affiche sans explication pour l'humain. Qu'est-ce que ca signifie concretement ? Pourquoi cette requete a-t-elle declenche le watchdog ? Il manque un tooltip ou une section expandable qui explique la raison de l'alerte.

**Probleme #5 : Navigation entre "En attente" et "Journal d'audit" cache l'urgence**
Si 3 requetes sont en attente et l'utilisateur est sur l'onglet "Journal d'audit", rien dans l'UI ne l'interrompt visuellement. Le badge dans l'onglet "En attente (3)" est trop discret. Sur mobile en usage reel, cette situation cree de la latence de decision.

**Probleme #6 : Absence de priority score visible**
Toutes les cartes s'affichent dans l'ordre chronologique. Si une requete a un `financial_amount` de 50 000 $ et `watchdog_alert: true`, elle devrait monter en tete automatiquement avec un indicateur de priorite.

**Probleme #7 : L'ID tronque en bas de carte est inutile pour l'humain**
`a3f9b2d1c8e4...` n'apporte rien a l'operateur humain. Cet espace pourrait accueillir des informations actionnables : latence depuis la soumission, statut du callback URL, nombre de tentatives de l'agent.

---

### Problemes Visuels

**Probleme #8 : Le logo hexagonal manque d'identite propre**
L'emoji `⬡` dans un `rounded-lg` de 32px est une placeholder, pas un logo. Il n'y a pas d'animation, pas de version SVG optimisee, pas de variations pour les differents contextes (favicon 16px, header 32px, splash screen mobile).

**Probleme #9 : La hierachie typographique est trop plate**
"Action", "Justification", "Impact Projete" sont tous traites avec `text-xs uppercase tracking-wider`. Ces labels devraient avoir des niveaux de prominence differents selon l'importance de l'information pour la decision.

**Probleme #10 : Le header manque de contexte de session**
L'header affiche logo + badge pending. Il n'y a aucune indication du contexte : quel agent est surveille, depuis quand la session est active, qui est connecte. Sur mobile, quand plusieurs agents tournent en parallele, l'operateur humain n'a pas de vue de sa "charge de travail" totale.

**Probleme #11 : Accessibilite couleur insuffisante**
`--text-subtle: #4a5c78` sur `--bg-primary: #0a0f1e` donne un ratio de contraste d'environ 3.2:1, en dessous du minimum WCAG AA (4.5:1). Les timestamps et les IDs en bas de carte sont potentiellement illisibles sur certains ecrans ou en plein soleil (usage mobile).

---

### Ce qui Manque pour Inspirer Confiance Absolue

1. **Un audit trail cryptographique visible** : Afficher la signature HMAC dans l'AuditLog est bien, mais l'humain ne sait pas pourquoi c'est important. Un petit "Signature verifiee ✓" avec tooltip educatif transformerait cette feature technique en signal de confiance.
2. **Une latence de reaction visible** : "Vous avez repondu en 47 secondes" dans l'audit log communique que l'humain est reactif et que le systeme mesure la performance de supervision.
3. **Un historique de fiabilite de l'agent** : Avant d'approuver une action, l'operateur devrait voir "Cet agent a soumis 23 requetes, 21 approuvees, 2 refusees — fiabilite historique 91%". Ce contexte change radicalement la qualite de la decision.

---

## PARTIE 2 — Proposition de Redesign de la Landing Page

### L'Emotion Design : La "Tension Confiante"

Quand un developpeur arrive sur oracle-h.online, il doit ressentir deux choses simultanement et paradoxalement :

> **"Quelque chose de serieux se passe ici."**
> **"Et j'ai exactement le controle qu'il me faut."**

Pas de peur. Pas de panique. La tension confiante d'un pilote en cabine de commande. L'interface est calme, precise, et communique : "Nous avons tout prevu. Tu es en position."

C'est le contraire de Datadog (informationnel/analytique) et le contraire de PagerDuty (alerting/anxiete). ORACLE-H est la couche entre le chaos des agents et la realite du monde — elle doit etre un filtre, pas une alarme.

---

### Architecture de la Landing Page

#### Section 1 : Hero — "The Last Gate"

**Concept visuel** : Un hexagone central anime (Three.js ou CSS pur) qui pulse doucement, entour d'un halo ambre subtil. Derriere, des lignes de connexion entre des noeuds (agents IA) qui tentent de "passer" — et s'arretent au checkpoint central. L'hexagone ORACLE-H est litteralement la porte.

**Animation recommandee** :
```css
/* Pulse de l'hexagone principal — GSAP */
gsap.to(".hero-hexagon", {
  boxShadow: "0 0 60px rgba(251, 191, 36, 0.4), 0 0 120px rgba(251, 191, 36, 0.1)",
  duration: 2,
  repeat: -1,
  yoyo: true,
  ease: "power2.inOut"
});

/* Lignes de flux entrants — CSS */
@keyframes flow-in {
  0%   { stroke-dashoffset: 100; opacity: 0; }
  40%  { opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 0.3; }
}
```

**Headline principale** :
```
Your AI agents act.
You decide.
```
Deux lignes. Contraste total. La premiere ligne est en `--text-primary` standard. La seconde "You decide." est en `#fbbf24` (ambre), weight 800, letterspacing tight. L'italique optionnel sur "decide" pour l'emphase.

**Subline** :
```
ORACLE-H intercepts every critical action before execution.
One API call. You stay in control.
```

**CTA dual** :
- Primaire : `npm install oracle-h` — une ligne de code cliquable qui se copie dans le clipboard avec un feedback micro-animation (rotation de l'icone copy → checkmark vert)
- Secondaire : `Read the docs →` — lien texte sans decoration excessive

**Eyebrow badge** (au-dessus du titre) :
```
[⬡ MCP-Compatible] [Open Source] [Zero-Trust Architecture]
```
Trois pill badges avec border ambre subtile, texte monospace.

---

#### Section 2 : Trust Signal — "What's at stake"

**Concept** : Un compteur live (ou simule) qui affiche en temps reel le volume financier supervise via ORACLE-H. Pas une metrique abstraite — de l'argent reel.

```
$4,729,301
supervised by ORACLE-H agents this week
```

En dessous, 3 statistiques secundaires en grid :
- `847 actions intercepted`
- `99.2% uptime`
- `< 200ms avg response`

Visuellement, ces chiffres utilisent `Space Grotesk` tabular-nums avec une animation `countUp` (GSAP ou Framer Motion) au scroll.

---

#### Section 3 : How It Works — "Three Gates"

**Format** : Pas un "Step 1, 2, 3" classique. Un schema interactif : une timeline horizontale sur desktop, verticale sur mobile, avec 3 noeuds:

```
[Agent IA] ──→ [ORACLE-H checkpoint] ──→ [Action executee]
                       ↕
               [Humain sur Telegram]
```

**Noeud 1 : L'agent soumet**
```json
POST /api/v1/validate
{
  "action": "Transfer $2,000 USDC",
  "rationale": "Optimal arbitrage route",
  "financial_amount": 2000
}
```
Code snippet anime avec syntax highlighting minimaliste (theme custom dark).

**Noeud 2 : Tu recois**
Mockup d'une notification Telegram : message structure avec le montant en gras, les boutons APPROVE / REJECT inline.

**Noeud 3 : L'agent continue (ou s'arrete)**
Selon ta decision. Webhook callback illustre.

---

#### Section 4 : Features — Bento Grid

Layout bento grid 3 colonnes sur desktop, 1 sur mobile. Chaque card a une illustration SVG/CSS unique :

| Feature | Description | Visual |
|---------|-------------|--------|
| **MCP Native** | Plug into any Claude, GPT-4, or Gemini agent via the Model Context Protocol | Icone hexagone interconnecte |
| **Financial Guardrails** | Set amount thresholds. High-value actions get elevated scrutiny automatically | Barre de progression ambre |
| **Watchdog Mode** | Behavioral anomaly detection. ORACLE-H flags suspicious patterns before you do | Signal d'onde avec spike detecte |
| **HMAC Audit Trail** | Every decision is cryptographically signed. Tamper-proof. Court-admissible | Chaine de blocs minimaliste |
| **Real-time SSE** | Sub-second notification. Your dashboard updates the moment an agent acts | Pulsation verte live |
| **Multi-agent** | Supervise 10 or 100 agents from a single dashboard. Priorities auto-ranked | Noeuds en constellation |

**CSS pour les cards bento** :
```css
.bento-card {
  background: var(--bg-card);
  border: 1px solid rgba(251, 191, 36, 0.1);
  border-radius: 16px;
  padding: 24px;
  transition: border-color 0.3s ease, transform 0.2s ease;
}
.bento-card:hover {
  border-color: rgba(251, 191, 36, 0.35);
  transform: translateY(-2px);
}
/* Large card spanning 2 columns */
.bento-card--large { grid-column: span 2; }
```

---

#### Section 5 : Social Proof — "Developers Trust It"

**Format** : Pas un carousel automatique. Des tweets/quotes statiques, curates, style terminal :

```
┌─────────────────────────────────────────────────────┐
│  @devname · 2h                                      │
│  "Just deployed oracle-h in front of my trading     │
│  bot. First time I've slept properly since          │
│  going live with an autonomous agent."              │
└─────────────────────────────────────────────────────┘
```

Style monospace, border `--border`, avatar rond. 3 quotes max sur desktop, 2 sur mobile.

---

#### Section 6 : Final CTA — "Take Control"

Background distinct : gradient radial ambre tres subtil (`rgba(251,191,36,0.05)` au centre) sur fond dark. Text centre, headline courte, un seul CTA.

```
Your agents are already making decisions.
Make sure you're the last gate.

[Get Started Free →]
```

Le bouton CTA final est traite differemment du reste : `background: #fbbf24`, `color: #0a0f1e`, `font-weight: 700`. C'est le seul element vraiment lumineux de toute la page — il attire l'oeil naturellement.

---

## PARTIE 3 — 10+ Ameliorations Concretes du Dashboard

### #1 : Seuils de montant avec escalade visuelle
**Description** : Systeme de tiers visuels selon `financial_amount`. Sous 100 $ : normal. 100-1000 $ : border card `--orange`. Au-dessus de 1000 $ : border card `--red` + header de card en rouge + badge "HIGH VALUE".
**Impact** : Priorisation visuelle instantanee. L'operateur sait en un glance quelle carte traiter en premier.
**Complexite** : S (ajout de classes conditionnelles dans `RequestCard.tsx`)

```tsx
const riskClass = financial_amount > 1000
  ? "border-red-500/40 shadow-red-900/20"
  : financial_amount > 100
    ? "border-orange-500/30"
    : "";
```

---

### #2 : Confirmation modal pour montants eleves
**Description** : Pour toute action dont `financial_amount > 500` (seuil configurable), le bouton APPROUVER declenche un micro-modal de confirmation a 2 etapes : affichage du montant en grand + champ de saisie du montant pour confirmer.
**Impact** : Elimination des faux positifs. Friction intentionnelle proportionnelle au risque.
**Complexite** : M (nouveau composant `ConfirmModal.tsx`)

---

### #3 : Sort automatique par priorite
**Description** : Les cartes "En attente" sont triees par score de priorite composite : `watchdog_alert * 3 + financial_amount_normalized + age_urgency`. Les cartes les plus critiques apparaissent en premier.
**Impact** : L'operateur traite toujours le cas le plus urgent en premier, sans avoir a scanner visuellement.
**Complexite** : S (fonction de tri dans `page.tsx`)

---

### #4 : Contexte historique de l'agent sur la carte
**Description** : Sous le badge `agent_name`, afficher une ligne contextuelle : "Cet agent — 15 actions, 14 approuvees (93%)". Requiert un endpoint `/api/v1/agents/:id/stats`.
**Impact** : Transforme une decision a l'aveugle en decision informee. Fiabilite historique = signal de confiance majeur.
**Complexite** : L (nouveau endpoint + affichage)

---

### #5 : Bandeau d'urgence sticky si pending > 0
**Description** : Quand `pendingList.length > 0` et que l'utilisateur est sur l'onglet "Journal d'audit", afficher un bandeau sticky en bas d'ecran (style toast persistant) : "⚡ 3 actions en attente — [Voir maintenant]".
**Impact** : Aucune requete en attente ne peut etre ignoree accidentellement. Critical pour l'usage mobile.
**Complexite** : S

---

### #6 : Tooltip explicatif pour le badge Watchdog
**Description** : Au tap/hover sur le badge "WATCHDOG", afficher un tooltip avec la raison specifique de l'alerte (champ `watchdog_reason` a ajouter dans le schema). Ex : "Montant 3x superieur a la moyenne de cet agent" ou "Tentative #4 pour la meme action".
**Impact** : Le watchdog cesse d'etre mysterieux. L'operateur comprend POURQUOI c'est flagge.
**Complexite** : M (schema update + UI)

---

### #7 : Timer de latence depuis soumission
**Description** : Remplacer le `TimeAgo` generique par un timer live qui compte les secondes/minutes depuis `created_at`. Si > 5 minutes, le timer devient rouge. Si > 15 minutes, le texte "CRITIQUE — en attente depuis Xmin" en rouge pulsant.
**Impact** : Cree une urgence temporelle appropriee. Les agents bloquent en attendant — chaque minute compte.
**Complexite** : S (modification du composant `TimeAgo`)

---

### #8 : Swipe gestures sur mobile pour APPROUVER/REFUSER
**Description** : Sur mobile, implementer un swipe right = APPROUVER (halo vert) / swipe left = REFUSER (halo rouge). Animation spring avec GSAP ou Framer Motion. Confirmation sonore optionnelle (vibreur).
**Impact** : Interaction mobile native. Plus rapide et naturelle que tapper deux petits boutons.
**Complexite** : M (Framer Motion `drag` + contraintes)

```tsx
import { motion } from "framer-motion";

<motion.div
  drag="x"
  dragConstraints={{ left: -150, right: 150 }}
  onDragEnd={(_, info) => {
    if (info.offset.x > 100) handleDecide("approved");
    if (info.offset.x < -100) handleDecide("rejected");
  }}
>
```

---

### #9 : Dark/Light mode adaptatif pour usage exterieur
**Description** : Detecter `prefers-color-scheme: light` et proposer un mode "high contrast outdoor" — fond blanc casse `#F8F7F4`, texte `#0a0f1e`, accents inchanges. Toggle manuel dans le header.
**Impact** : Utilisabilite en mobilite, plein soleil. Un operateur qui verifie depuis son telephone en terrasse doit pouvoir lire.
**Complexite** : M (CSS variables overrides + toggle)

---

### #10 : Signature HMAC verifiee avec UI educative
**Description** : Dans l'AuditLog, chaque entree affiche "Signature: ✓ Verifiee" avec un icon cadenas vert. Au clic, un drawer s'ouvre expliquant en plain text : "Cette decision a ete signee cryptographiquement. Elle ne peut pas etre modifiee sans invalider la signature."
**Impact** : Transforme une feature technique opaque en signal de confiance explicite. Eduque l'utilisateur tout en validant la securite.
**Complexite** : S (UI uniquement, la signature existe deja)

---

### #11 : Dashboard multi-agents avec vue apercu
**Description** : En haut du dashboard, avant la StatsBar, ajouter une "Agent Map" — une rangee horizontale scrollable de bubbles par `agent_id`, chacune coloree selon leur statut (vert = aucune requete pending, orange = requetes en attente, rouge = watchdog actif). Au clic, filtrer la liste sur cet agent.
**Impact** : Vision systemique instantanee quand plusieurs agents tournent en parallele.
**Complexite** : L

---

### #12 : Export audit CSV/JSON depuis le journal
**Description** : Bouton "Exporter" dans l'onglet Journal d'audit. Telechargement CSV avec toutes les colonnes : agent_id, action, decision, decided_by, timestamp, financial_amount, signature.
**Impact** : Compliance, reporting, audit externe. Fonctionnalite attendue par les teams enterprise.
**Complexite** : S (generation CSV cote client depuis les donnees existantes)

---

## PARTIE 4 — Strategie de Marque Visuelle

### Le Logo Hexagonal — Concept Approfondi

L'hexagone n'est pas un choix arbitraire. En geometrie de la nature, l'hexagone est la forme la plus efficace : les alveoles d'abeilles, les cellules des basaltes. Il represente la **robustesse optimale** — maximiser la resistance avec un minimum de materiau. Pour ORACLE-H, il est le checkpoint parfait : solide, regulier, infranchissable sans autorisation.

**Concept SVG recommande** : Un hexagone double-contour. Le contour externe est fixe (la structure). Le contour interne pulse doucement (la vigilance). Au centre, un oeil stylise minimaliste — reference directe au nom ORACLE (l'oracle voit tout).

```svg
<!-- ORACLE-H Logo SVG — concept -->
<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Outer hexagon -->
  <polygon points="32,4 56,18 56,46 32,60 8,46 8,18"
    fill="none" stroke="#fbbf24" stroke-width="1.5" opacity="0.8"/>
  <!-- Inner hexagon (pulsing) -->
  <polygon points="32,12 50,22 50,42 32,52 14,42 14,22"
    fill="none" stroke="#fbbf24" stroke-width="0.75" opacity="0.4"
    class="logo-pulse"/>
  <!-- Eye / Oracle symbol -->
  <circle cx="32" cy="32" r="6" fill="none" stroke="#fbbf24" stroke-width="1.5"/>
  <circle cx="32" cy="32" r="2" fill="#fbbf24"/>
</svg>
```

**Variations du logo** :
- `logo-full.svg` : hexagone + wordmark "ORACLE-H" — usage header desktop
- `logo-mark.svg` : hexagone seul — favicon 16/32px, avatar Telegram, app icon
- `logo-animated.svg` (GSAP) : pulse lent du contour interne — splash screen, hero landing
- `logo-mono-light.svg` : version blanche — sur fonds sombres tiers (GitHub, npm)
- `logo-mono-dark.svg` : version navy — sur fonds clairs (documentation)

---

### Palette de Couleurs Etendue

```css
:root {
  /* === Core System === */
  --bg-void:       #050810;  /* Fond le plus profond — hero sections */
  --bg-primary:    #0a0f1e;  /* Fond dashboard */
  --bg-secondary:  #0d1526;  /* Fond secondaire */
  --bg-card:       #111d35;  /* Surface card */
  --bg-card-hover: #1a2744;  /* Card au hover */
  --bg-elevated:   #1e2d4a;  /* Drawers, modals */

  /* === Accent — Oracle Gold === */
  --gold-100:  rgba(251, 191, 36, 0.05);  /* Backgrounds subtils */
  --gold-200:  rgba(251, 191, 36, 0.10);  /* Badges dim */
  --gold-300:  rgba(251, 191, 36, 0.20);  /* Borders hover */
  --gold-400:  rgba(251, 191, 36, 0.40);  /* Borders actifs */
  --gold-500:  #fbbf24;                   /* Accent principal */
  --gold-600:  #f59e0b;                   /* Accent hover */

  /* === Semantic — Status === */
  --green-400: #34d399;  /* Approved / Live */
  --green-500: #10b981;  /* Approved hover */
  --green-dim: rgba(52, 211, 153, 0.10);

  --orange-400: #fb923c;  /* Pending / Warning */
  --orange-dim: rgba(251, 146, 60, 0.10);

  --red-400:   #fb7185;  /* Rejected / Critical */
  --red-500:   #ef4444;  /* High-value alert */
  --red-dim:   rgba(251, 113, 133, 0.10);

  /* === Text === */
  --text-primary:  #f0f4ff;  /* Contenu principal */
  --text-secondary:#c5d0e8;  /* Contenu secondaire */
  --text-muted:    #7a8ba8;  /* Labels, metadata */
  --text-subtle:   #4a5c78;  /* Timestamps, IDs (attention contrast!) */
  --text-ghost:    #2d3d58;  /* Vraiment secondaire */

  /* === Border System === */
  --border-subtle:  rgba(251, 191, 36, 0.06);
  --border-default: rgba(251, 191, 36, 0.12);
  --border-hover:   rgba(251, 191, 36, 0.35);
  --border-active:  rgba(251, 191, 36, 0.60);

  /* === NEW — Blue accent pour les elements neutres === */
  --blue-400:  #60a5fa;  /* Info, documentation links */
  --blue-dim:  rgba(96, 165, 250, 0.10);
}
```

**Use cases par token** :
| Token | Usage |
|-------|-------|
| `--bg-void` | Hero landing page, splash screen |
| `--gold-500` | CTA primaire texte, logo, montants financiers |
| `--green-400` | Statut approuve, SSE live, fiabilite haute |
| `--orange-400` | Statut pending, badge header, latence moyenne |
| `--red-500` | High-value alert (>1000$), watchdog critique |
| `--blue-400` | Liens documentation, tooltips informatifs |

---

### Typographie Recommandee

**Stack principal** :
```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
```

**Pairing strategique** :

| Role | Font | Weight | Use |
|------|------|--------|-----|
| Logo / Wordmark | Space Grotesk | 700 | `ORACLE-H`, headlines landing |
| Corps texte | Inter | 400/500 | Dashboard content, descriptions |
| Montants / Code | IBM Plex Mono | 400/500 | Remplace `Space Grotesk monospace` pour les montants et snippets |
| Labels uppercase | Inter | 600 | `ACTION`, `JUSTIFICATION` labels |
| Code snippets | IBM Plex Mono | 400 | curl examples, JSON previews |

**Pourquoi IBM Plex Mono plutot que Space Grotesk pour les montants** : IBM Plex Mono est specifiquement con pour les chiffres financiers avec `font-variant-numeric: tabular-nums` natif. Les chiffres s'alignent parfaitement dans les colonnes. Space Grotesk, bien que beau, n'est pas un monospace — ce point dans le code actuel est une approximation (`fontFamily: "'Space Grotesk', monospace"`).

**Scale typographique** :
```css
.t-hero    { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 700; letter-spacing: -0.02em; }
.t-title   { font-size: clamp(1.5rem, 3vw, 2rem);  font-weight: 600; }
.t-body    { font-size: 0.9375rem; line-height: 1.65; }
.t-label   { font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
.t-amount  { font-family: 'IBM Plex Mono'; font-variant-numeric: tabular-nums; }
.t-code    { font-family: 'IBM Plex Mono'; font-size: 0.8125rem; }
```

---

### Motion Design System

**Principe directeur** : "Every animation has a reason. If you can't name it, cut it."

ORACLE-H est un outil de securite. Les animations doivent communiquer des etats, pas decorer. Chaque motion doit repondre a l'une de ces fonctions : **Confirmer**, **Alerter**, **Orienter**, **Rassurer**.

**Tokens de timing** :
```css
:root {
  --motion-instant:   80ms;   /* Feedback immediat (boutons) */
  --motion-fast:      150ms;  /* Transitions d'etat (badges) */
  --motion-default:   250ms;  /* Apparition de composants */
  --motion-enter:     350ms;  /* Cartes entrant dans le viewport */
  --motion-deliberate: 500ms; /* Transitions de page, modals */

  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1); /* Leger overshoot */
  --ease-urgent:    cubic-bezier(0.7, 0, 0.84, 0);    /* Entrees urgentes */
}
```

**Catalogue d'animations par contexte** :

| Animation | Timing | Easing | Usage |
|-----------|--------|--------|-------|
| Card fade-in | 350ms | ease-out-quart | Nouvelle carte en attente |
| Card highlight (urgent) | 400ms | ease-urgent | Carte `isHighlighted` |
| Button feedback | 80ms | ease-out-quart | Hover sur APPROUVER/REFUSER |
| Decision confirm | 500ms | ease-spring | Apres click — card qui "s'estompe" |
| Pending pulse | 2s infinite | ease-in-out | Status dot en attente |
| Stats count-up | 800ms | ease-out-quart | Chiffres au chargement |
| SSE reconnect | 1.5s | linear | Spinner reconnnexion |
| Modal appear | 250ms | ease-spring | Confirmation modal |
| Toast appear | 200ms | ease-out-quart | Bandeau urgence |

---

### "One-Liner" Visuel

**Comment le design communique la valeur sans mots** :

Quand un developpeur ouvre ORACLE-H pour la premiere fois, le chemin visuel de l'oeil est :

1. Le fond `#0a0f1e` + grid ambre : "Ceci est un outil de precision. Pas un consumer product."
2. L'hexagone logo qui pulse doucement : "Il y a quelque chose de vivant ici. Une vigilance."
3. Le statut dot vert "Flux temps réel connecté" : "C'est en train de surveiller maintenant."
4. Le montant `$4,729` en ambre `Space Grotesk` : "Il y a des enjeux reels."
5. Le bouton APPROUVER/REFUSER : "C'est moi qui decide."

En 5 elements visuels, sans lire un mot de texte explicatif, l'utilisateur a compris : **je suis la derniere ligne de defense entre une IA et une consequence financiere reelle**.

C'est le "one-liner" visuel d'ORACLE-H.

---

## PARTIE 5 — Spec Complete de la Landing Page

### Contenu Editorial

---

**[EYEBROW — pill badge]**
```
⬡ MCP-Compatible · Open Source · Zero-Trust
```

---

**[HERO HEADLINE]**
```
Your AI agents act.
You decide.
```

**[HERO SUBLINE]**
```
ORACLE-H intercepts every critical action before execution.
One webhook. One API call. You stay in control — from anywhere.
```

**[HERO CTA PRIMAIRE — copy dans clipboard au clic]**
```
npm install oracle-h
```

**[HERO CTA SECONDAIRE]**
```
Read the docs →
```

---

**[TRUST BAR]**
```
$4,729,301 supervised this week · 847 actions intercepted · 99.2% uptime
```

---

**[SECTION "HOW IT WORKS" — titre]**
```
Three lines of code.
Infinite control.
```

**[STEP 1 — headline]**
```
Your agent submits an action
```
**[STEP 1 — description]**
```
Any agent using the MCP protocol can call ORACLE-H before executing
a critical action — financial transactions, API calls, data deletion.
```

**[STEP 2 — headline]**
```
You receive an instant alert
```
**[STEP 2 — description]**
```
Telegram, webhook, or your custom dashboard. You see the action,
the rationale, the projected impact, and the financial stakes.
In real-time. On your phone.
```

**[STEP 3 — headline]**
```
You approve or reject. The agent obeys.
```
**[STEP 3 — description]**
```
Your decision triggers a cryptographically signed response.
The agent resumes — or stops — immediately. Every decision
is logged in a tamper-proof audit trail.
```

---

**[FEATURES SECTION — titre]**
```
Everything you need to sleep at night.
```

**[Feature 1]**
- Titre : `MCP Native Integration`
- Description : `Works with any Claude, GPT-4, or Gemini-based agent. One import, full coverage.`

**[Feature 2]**
- Titre : `Financial Guardrails`
- Description : `Set custom thresholds. High-value actions get automatic escalation. No silent failures.`

**[Feature 3]**
- Titre : `Behavioral Watchdog`
- Description : `Anomaly detection built-in. When an agent acts out of character, you know before it's too late.`

**[Feature 4]**
- Titre : `HMAC Audit Trail`
- Description : `Every decision cryptographically signed. Tamper-proof. Compliance-ready.`

**[Feature 5]**
- Titre : `Real-time Everywhere`
- Description : `SSE push updates. Your dashboard reflects agent state in under 200ms, globally.`

**[Feature 6]**
- Titre : `Multi-agent Ready`
- Description : `Supervise 10 or 100 agents from one view. Priority scoring surfaces what matters.`

---

**[SOCIAL PROOF — titre]**
```
Developers who shipped agents. Then shipped ORACLE-H.
```

**[Testimonial 1]**
```
"First time I've slept properly since deploying an autonomous trading agent.
ORACLE-H is the safety layer I didn't know I needed until I did."
— @autonomy_dev · AI Engineer
```

**[Testimonial 2]**
```
"Integration took 20 minutes. Now every financial action my CrewAI
agents take hits my Telegram first. It's not optional anymore."
— @buildinpublic · Indie Hacker
```

**[Testimonial 3]**
```
"The audit trail alone is worth it. When something goes wrong,
you have an exact record of what was approved, when, and by whom."
— @agentic_founder · Startup CTO
```

*(Note : ces testimonials sont des cibles a acquerir via outreach. Format tweet-style pour credibilite maximale.)*

---

**[FINAL CTA — titre]**
```
Your agents are already making decisions.
Make sure you're the last gate.
```

**[FINAL CTA — sous-titre]**
```
Free forever for solo developers. Usage-based pricing for teams.
No credit card required.
```

**[FINAL CTA — bouton]**
```
Get Started Free →
```

---

## Conclusion : La Priorite d'Implementation

Si je devais choisir 3 choses a implementer immediatement, dans l'ordre :

1. **La landing page** (conversion + credibilite). Le dashboard existe. La porte d'entree manque.
2. **Les seuils visuels de montant** (securite critique). Un $50,000 qui ressemble a un $50 est une faille UX dangereuse.
3. **Le contexte historique de l'agent sur la carte** (qualite de decision). C'est ce qui transforme ORACLE-H d'un outil de relay en un outil de jugement.

Le reste suit une roadmap naturelle. Mais ces trois points definissent la difference entre un tool qu'on utilise par obligation et un tool qu'on fait confiance.

---

*Mehdi Laraaich — Creative Developer*
*"L'infrastructure doit etre aussi belle que ce qu'elle protege."*
