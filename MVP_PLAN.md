# MVP — Système de Prospection IA pour Refonte de Sites Web
**Cible : Afrique francophone · Budget : 30-100€/mois · Profil : Vibe coding avec Claude Code**

> Posture du document : je te parle en CTO senior. Pas de bullshit, pas d'over-engineering. On vise **3 prospects qualifiés livrés en 7 jours, et 1 client signé en 30 jours**. Tout le reste, c'est du bonus.

---

## 0. TL;DR — La décision en 30 secondes

**Ce que tu vas construire :**
Un pipeline semi-automatique qui, à partir d'un mot-clé (ex: *"restaurant Douala"*), te livre chaque matin **10 fiches prospect prêtes à envoyer sur WhatsApp**, contenant :
- Le nom + numéro WhatsApp de l'entreprise
- Un screenshot "avant" de leur site moche
- Un screenshot "après" d'une landing page refaite par IA
- Un message WhatsApp personnalisé (ton local, hook précis, CTA clair)

**Stack finale recommandée (lean + Afrique-friendly) :**
| Brique | Outil | Coût |
|---|---|---|
| Scraping Google Maps | **Apify** (Google Maps Scraper) | ~5-15€/mois usage |
| Orchestration | **n8n self-hosted sur Railway** | 5€/mois |
| Base de données | **Supabase** (free tier) | 0€ |
| Audit IA + génération texte | **Claude Sonnet via Anthropic API** (ou OpenRouter pour mixer) | ~10-25€/mois |
| Génération landing | **Bolt.new** (vibe coding, deploy auto) | 0-20€/mois |
| Screenshots | **ScreenshotOne** ou Playwright local | 0-7€/mois |
| Envoi WhatsApp | **Manuel** (toi) via WhatsApp Web + extension | 0€ |
| **TOTAL** | | **~20-70€/mois** |

**Temps de dev estimé : 5-7 jours en vibe coding avec Claude Code.**

---

## 1. Recommandation de cible : commence par les **restaurants & hôtels**

Tu m'as demandé mon avis. Voici la logique CTO :

### Pourquoi restaurants / hôtels / commerces locaux (en Afrique francophone) ?

| Critère | Restaurants/Hôtels | Artisans BTP | Cabinets pro |
|---|---|---|---|
| Volume Google Maps | 🟢 Énorme | 🟡 Moyen | 🔴 Faible |
| Site web actuel | 🟢 Souvent inexistant ou très moche | 🟡 Souvent une page Facebook | 🔴 Souvent corrects |
| Décideur joignable WhatsApp | 🟢 Le patron répond direct | 🟢 Oui | 🔴 Filtré par secrétariat |
| Sensibilité visuelle | 🟢 Forte (photos = ventes) | 🟡 Moyenne | 🔴 Faible |
| Budget moyen refonte | 🟡 200-800€ | 🟡 300-1000€ | 🟢 800-3000€ |
| Cycle de vente | 🟢 Court (1-2 semaines) | 🟡 2-4 semaines | 🔴 1-3 mois |
| Effet WOW screenshot | 🟢 Massif | 🟡 Bon | 🟡 Bon |

**Verdict :** Démarre par les **restaurants haut/moyen de gamme** dans les capitales économiques (Douala, Abidjan, Dakar, Yaoundé, Kinshasa). Tu obtiendras tes premiers oui en 2 semaines. Une fois le process rodé et 2-3 clients en poche, tu pourras attaquer les hôtels (ticket plus élevé) puis les cabinets médicaux/dentaires.

**Niche de départ ultra précise (ICP MVP) :**
> Restaurants & lounges à Douala, Abidjan ou Dakar, ayant **un site web qui existe mais date d'avant 2020** (Wix moche, HTML statique, ou WordPress non maintenu). Pas de site = pas notre cible (cycle de vente trop long pour expliquer la valeur).

---

## 2. Architecture MVP simplifiée

```
┌─────────────────────────────────────────────────────────────────┐
│  INPUT : "restaurant Douala" (toi, dans un Google Sheet ou n8n) │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │  1. APIFY scrape  │  → Nom, site, tel/WhatsApp,
                  │  Google Maps      │     adresse, note, reviews
                  └─────────┬─────────┘
                            │
                  ┌─────────▼─────────┐
                  │  2. FILTRE n8n    │  → On garde uniquement
                  │  "a un site web"  │     ceux avec un domaine
                  └─────────┬─────────┘
                            │
                  ┌─────────▼─────────┐
                  │  3. SCREENSHOT    │  → Capture du site actuel
                  │  ScreenshotOne    │     (desktop + mobile)
                  └─────────┬─────────┘
                            │
                  ┌─────────▼─────────┐
                  │  4. AUDIT IA      │  → Claude analyse le site :
                  │  Claude API       │     UX, SEO, conversion,
                  │                   │     score /100, 3 problèmes
                  └─────────┬─────────┘
                            │
                  ┌─────────▼─────────┐
                  │  5. GÉNÉRATION    │  → Bolt.new (manuel J1-15)
                  │  LANDING (Bolt)   │     puis automatisé via API
                  └─────────┬─────────┘
                            │
                  ┌─────────▼─────────┐
                  │  6. SCREENSHOT    │  → Capture de la nouvelle
                  │  AFTER            │     landing
                  └─────────┬─────────┘
                            │
                  ┌─────────▼─────────┐
                  │  7. COMPARATIF    │  → Image avant/après côte-à-
                  │  visuel (PIL)     │     côte (Python n8n node)
                  └─────────┬─────────┘
                            │
                  ┌─────────▼─────────┐
                  │  8. MESSAGE       │  → Claude rédige le message
                  │  WhatsApp (IA)    │     WhatsApp personnalisé
                  └─────────┬─────────┘
                            │
                  ┌─────────▼─────────┐
                  │  9. DASHBOARD     │  → Toutes les fiches dans
                  │  Supabase + UI    │     Supabase + page HTML
                  │  validation       │     "à envoyer / envoyé"
                  └─────────┬─────────┘
                            │
                  ┌─────────▼─────────┐
                  │ 10. ENVOI MANUEL  │  → Toi, WhatsApp Web,
                  │  (humain)         │     5-10 messages/jour
                  └───────────────────┘
```

**Principe directeur :** *Human-Assisted AI*. L'IA fait 80%, tu valides et tu envoies. Pas d'envoi auto avant d'avoir validé que les messages convertissent (sinon tu cames ton numéro).

---

## 3. Stack exacte avec coûts détaillés

### Coeur du système (obligatoire)

| Outil | Rôle | Tarif réel | Pourquoi celui-là |
|---|---|---|---|
| **n8n self-hosted** (Railway/Hetzner) | Orchestration | 5€/mois (Railway) | Open source, visuel, communauté massive, parfait pour vibe coding |
| **Supabase** | DB + auth + storage | Free (jusqu'à 500MB) | Postgres managé, free tier généreux |
| **Apify — Google Maps Scraper** | Lead source | ~0,007€/résultat (pay-as-you-go) + 5$ crédit offert | Le scraper Google Maps le + fiable, pas de captchas à gérer |
| **Anthropic API (Claude Sonnet 4.6)** | Audit + rédaction | ~0,003€/1k tokens input | Meilleur ratio qualité/prix pour FR + nuance culturelle |
| **ScreenshotOne** | Captures site | 7€/mois (1000 shots) ou Playwright local = 0€ | Plus simple que Playwright en cloud, mais Playwright = gratuit |
| **Bolt.new** | Génération landing | Free tier + 20€/mois si besoin | Génération + preview live + deploy en 1 clic |

### Optionnel (selon avancée)

| Outil | Rôle | Tarif |
|---|---|---|
| **OpenRouter** | Multi-modèle (Gemini, GPT, Claude via 1 API) | Pay-as-you-go |
| **Cloudflare R2** | Stockage screenshots si Supabase saturé | 0€ jusqu'à 10GB |
| **Vercel** | Hosting landing pages générées | Free tier |
| **Resend** | Email transactionnel (si tu ajoutes l'email plus tard) | Free jusqu'à 3000/mois |

### Ce que tu **NE** prends **PAS** maintenant (piège)

- ❌ **Make.com** : plus cher que n8n pour ce volume, moins flexible
- ❌ **Firecrawl** : excellent mais doublon avec ScreenshotOne+Apify, ajoute 19€/mois
- ❌ **Lovable** payant : tu peux faire pareil avec Bolt gratuit
- ❌ **Une app full custom (Next.js)** : tu n'as pas besoin d'un front pour le MVP. Un Google Sheet + Supabase suffit.

---

## 4. Pipeline EXACT : que se passe-t-il quand tu entres "restaurant Douala" ?

### Étape 1 — Saisie du mot-clé
**Outil :** Google Sheet (colonne A : "keyword") ou trigger n8n manuel.
**Action :** Tu écris `restaurant Douala` dans une cellule. n8n détecte la nouvelle ligne.

### Étape 2 — Scraping Google Maps (Apify)
**Outil :** Apify Actor `compass/google-maps-scraper`.
**Configuration :**
```json
{
  "searchStringsArray": ["restaurant Douala"],
  "maxCrawledPlacesPerSearch": 30,
  "language": "fr",
  "countryCode": "cm"
}
```
**Output :** JSON avec nom, adresse, téléphone, site web, note, nb d'avis, catégorie.
**Coût :** ~0,20€ pour 30 résultats.

### Étape 3 — Nettoyage & filtrage (n8n)
**Filtres :**
- Le champ `website` est rempli
- Le téléphone existe (au format international)
- Note ≥ 3.5 (un client mécontent ne va pas investir)
- Pas déjà dans Supabase (anti-doublon)

### Étape 4 — Screenshot AVANT
**Outil :** ScreenshotOne ou Playwright (gratuit, dans un container n8n).
**Action :** 2 captures par site → desktop (1440x900) + mobile (375x812). Stockées dans Supabase Storage.

### Étape 5 — Mini audit IA (Claude Sonnet)
**Input à Claude :** URL du site + HTML brut (récupéré via simple `curl` n8n).
**Output structuré (JSON) :**
```json
{
  "score_global": 32,
  "score_design": 25,
  "score_mobile": 40,
  "score_conversion": 20,
  "problemes": [
    "Pas de CTA clair pour réserver",
    "Photos pixelisées (< 720p)",
    "Aucune mention WhatsApp visible"
  ],
  "angle_pitch": "Tu perds 7 réservations/semaine à cause d'un site qui charge mal sur mobile"
}
```

### Étape 6 — Génération landing (semi-auto au début)
**MVP semaine 1-2 :** TU le fais à la main dans **Bolt.new** avec un prompt template (3 minutes par landing).
**MVP semaine 3+ :** Tu automatises via API Bolt ou Claude Artifacts.
Voir section 7 pour le détail.

### Étape 7 — Screenshot APRÈS
Même outil qu'étape 4, sur l'URL de la landing déployée (Bolt te donne une URL Vercel/Bolt).

### Étape 8 — Comparatif visuel
**Outil :** Petit script Python dans n8n (15 lignes, généré par Claude Code en 2 min) qui :
- Met les 2 screenshots côte à côte
- Ajoute "AVANT" / "APRÈS" en titre
- Sauvegarde en PNG dans Supabase Storage

### Étape 9 — Message WhatsApp personnalisé (Claude)
Voir section 6 pour le prompt exact.

### Étape 10 — Dashboard de validation
**Format :** Une simple **page HTML statique** (générée par n8n, hostée sur Vercel) ou directement la table Supabase via l'éditeur Supabase. Pas besoin de front custom.
**Colonnes :** Nom, Score, Téléphone, Bouton "Voir landing", Bouton "Copier message", Statut (À envoyer / Envoyé / Réponse / Closé).

### Étape 11 — Envoi (TOI)
Tu ouvres **WhatsApp Web**, tu colles le message, tu attaches le PNG comparatif, tu envoies.
**Astuce :** L'extension Chrome **"WA Web Plus"** (gratuite) permet d'envoyer à plusieurs contacts en gardant la personnalisation.

---

## 5. Méthode ultra rapide — Jour 1 à 7

### **Jour 1 — Setup infra (3-4h)**
1. Créer compte Supabase, créer 1 table `leads` (schéma en bas du doc)
2. Déployer n8n sur Railway (template officiel, 1 clic) — 10 min
3. Créer compte Apify, lancer 1 scraping test "restaurant Douala", vérifier le JSON
4. Créer clé API Anthropic, tester un appel curl

**Livrable J1 :** Tu peux scraper et stocker 10 leads en BDD.

### **Jour 2 — Audit IA + screenshots (4-5h)**
1. Workflow n8n : Apify → Filtre → Supabase
2. Ajouter node screenshot (ScreenshotOne ou Playwright)
3. Ajouter node Claude qui prend l'URL et renvoie le JSON d'audit
4. Stocker audit + screenshots dans Supabase

**Livrable J2 :** 10 leads enrichis avec score + screenshot dans la BDD.

### **Jour 3 — Génération landing (manuel) + screenshot après (3-4h)**
1. Crée 1 template Bolt.new pour restaurants (voir prompt section 7)
2. Génère 3 landings à la main avec le template
3. Configure le screenshot du site après
4. Crée le script Python comparatif (Claude Code va le pondre en 2 min)

**Livrable J3 :** 3 PNG avant/après en main.

### **Jour 4 — Message WhatsApp + dashboard (3-4h)**
1. Prompt Claude pour le message WhatsApp (section 6)
2. Page HTML simple générée par n8n : liste des leads + bouton "copier message"
3. Test bout en bout sur 3 leads

**Livrable J4 :** Pipeline complet fonctionnel pour 1 mot-clé.

### **Jour 5 — Premiers envois manuels (2-3h)**
1. Envoie tes 5 premiers messages WhatsApp
2. Note les retours dans Supabase (champ `reaction`)
3. Itère sur le message si pas de réponse après 24h

**Livrable J5 :** 5 conversations engagées (objectif réaliste : 1-2 réponses).

### **Jour 6 — Itération & 2e niche (3-4h)**
1. Améliore le prompt audit (si pas assez précis)
2. Améliore le prompt WhatsApp (si pas assez personnel)
3. Lance un 2e mot-clé : "restaurant Abidjan" ou "hôtel Yaoundé"

**Livrable J6 :** 30 leads en pipeline.

### **Jour 7 — Polish & cron (2-3h)**
1. Ajoute un cron n8n : tous les matins à 8h, scrape 1 nouveau mot-clé
2. Crée un mini Notion/Sheet de suivi commercial (status, prochain follow-up)
3. Bilan : taux de réponse, problèmes process

**Livrable J7 :** Le système tourne tout seul chaque matin. Toi tu envoies et closes.

---

## 6. Prompts IA recommandés (copy-paste)

### 6.1 Prompt AUDIT (Claude Sonnet)

```
Tu es un expert UX/UI et conversion spécialisé dans les sites web de
restaurants en Afrique francophone.

Voici l'URL et le HTML d'un site à auditer :
URL : {{url}}
HTML : {{html_brut_première_2000_chars}}

Analyse le site et renvoie UNIQUEMENT un JSON valide (pas de markdown,
pas d'explication autour), avec ces champs :

{
  "score_global": int (0-100),
  "score_design": int (0-100),
  "score_mobile": int (0-100),
  "score_conversion": int (0-100),
  "problemes": [string, string, string] (3 problèmes max, formulés simplement, en français, pas de jargon tech),
  "angle_pitch": string (1 phrase qui explique CONCRÈTEMENT ce que ce site fait perdre comme business — ex: "Tu perds X réservations/semaine à cause de Y"),
  "type_business": string (ex: "restaurant", "lounge", "fast-food"),
  "ton_recommandé": string ("formel" ou "amical" selon le type d'établissement)
}

Critères :
- Un score >70 = site déjà correct, on le passe.
- Un score <50 = grosse opportunité.
- Sois sévère mais juste.
- Pense MOBILE FIRST (90% du trafic en Afrique est mobile).
```

### 6.2 Prompt MESSAGE WhatsApp (Claude Sonnet)

```
Tu es expert en prospection WhatsApp pour le marché africain francophone.

Contexte sur le prospect :
- Nom de l'établissement : {{nom}}
- Type : {{type_business}}
- Ville : {{ville}}
- Score actuel du site : {{score}}/100
- Problème principal : {{angle_pitch}}
- Note Google : {{note}}/5 ({{nb_avis}} avis)

Rédige un message WhatsApp en français qui :

1. Commence par "Bonjour {{prenom_du_gerant_si_dispo_sinon_'l'équipe_de_{{nom}}'}}"
2. Mentionne UN détail spécifique qui prouve qu'on a regardé leur établissement (note Google, plat populaire si visible, etc.)
3. Pose UN constat factuel (pas accusateur) sur leur site
4. Annonce qu'on a déjà préparé une version améliorée (GRATUIT à voir)
5. Termine par UNE question fermée simple ("Je peux te montrer ?")

Règles strictes :
- 70 mots MAX.
- Ton respectueux mais direct (tutoiement OK si type = lounge/bar, vouvoiement si restaurant gastro/hôtel)
- AUCUN emoji corporate. 1 emoji max et naturel.
- Pas de jargon ("optimisation", "conversion", "ROI" = INTERDITS)
- Pas de promesse magique ("doublez vos ventes" = INTERDIT)
- Pas de "j'espère que vous allez bien"

Renvoie UNIQUEMENT le texte du message, rien d'autre.
```

### 6.3 Prompt LANDING (Bolt.new)

```
Crée une landing page moderne et conversion-first pour ce restaurant.

NOM : {{nom}}
VILLE : {{ville}}, {{pays}}
TYPE : {{type_business}}
NOTE GOOGLE : {{note}}/5 ({{nb_avis}} avis)
SPÉCIALITÉS À METTRE EN AVANT : {{specialites}} (ou "cuisine locale + plats du jour")
TÉLÉPHONE / WHATSAPP : {{tel}}

Exigences :
- Mobile-first (90% du trafic = mobile en Afrique)
- Hero plein écran avec photo restaurant (placeholder Unsplash : restaurant africain)
- CTA principal : "Réserver via WhatsApp" (lien wa.me/{{tel_sans_+}})
- Sections : Hero, Spécialités (3 cards), Horaires + Adresse, Galerie (4 photos), Avis Google (intégrer 2-3 vrais avis), Footer avec carte
- Style : moderne, africain élégant (palette : terracotta, vert sapin, blanc cassé, accents dorés)
- Police : Inter ou DM Sans
- Animations : subtiles (fade-in au scroll), pas de carrousels
- Performance : images en WebP, lazy load, < 2s de chargement
- Pas de cookies, pas de chat bot, pas de pop-up

Stack : React + Tailwind + Framer Motion. Single file App.tsx.
```

---

## 7. Comparatif générateurs de landing (le choix qui te fera gagner 5h/jour)

| Outil | Vitesse | Qualité visuelle | Coût | Export code | Verdict pour TOI |
|---|---|---|---|---|---|
| **Bolt.new** | 🟢 Très rapide (1 prompt, 60s) | 🟢 Très bonne | Free + 20$/mois (token-based) | 🟢 Oui (Stackblitz) | ✅ **RECOMMANDÉ** |
| **Lovable** | 🟡 Rapide | 🟢 Très bonne (le plus joli) | Free limité + 25$/mois | 🟢 Oui (GitHub) | À tester si Bolt ne suit pas |
| **V0 (Vercel)** | 🟡 Moyen | 🟢 Excellente, mais "très Vercel" | Free + 20$/mois | 🟢 Oui | Bon mais moins "fini" sans dev complémentaire |
| **Claude Artifacts** | 🟢 Très rapide | 🟡 Bonne mais générique | Inclus dans Claude Pro | 🟢 Code copié manuel | Backup gratuit |
| **Cursor / Claude Code** | 🔴 Plus lent (boucle dev) | 🟢 Top si tu sais piloter | Coût modèle | 🟢 Total contrôle | Phase 2, pour industrialiser |

**Mon verdict CTO :**
1. **Semaines 1-3 :** **Bolt.new** en manuel (3 min par landing, deploy auto). Tu valides que la valeur est là.
2. **Semaines 4-8 :** Tu testes Lovable en parallèle sur 5 leads, tu compares les taux de réponse.
3. **Phase 2 :** Tu industrialises avec **Claude Code + un template Next.js custom** que tu remplis programmatiquement via Claude API. Ça te coûte 0,05€ par landing au lieu de 0,40€.

---

## 8. Automatisation Screenshot — méthode simple

### Option A — ScreenshotOne (recommandé pour démarrer)
- 1 endpoint API : `GET https://api.screenshotone.com/take?url=...&viewport_width=1440&full_page=true`
- 7€/mois, 1000 captures, c'est large pour le MVP.
- Avantage : gère les sites lents, le cookie banner, le scroll, etc.

### Option B — Playwright dans n8n (gratuit mais setup)
- Node n8n "Execute Command" qui appelle un petit script Playwright.
- Avantage : 0€.
- Inconvénient : tu dois maintenir un container avec les browsers.

### Comparatif visuel avant/après
**Script Python (à mettre dans n8n via le node "Code") :**
```python
from PIL import Image, ImageDraw, ImageFont

def make_comparison(before_path, after_path, output_path):
    b = Image.open(before_path)
    a = Image.open(after_path)
    h = 1200
    bw, aw = int(b.width * h / b.height), int(a.width * h / a.height)
    b = b.resize((bw, h))
    a = a.resize((aw, h))
    canvas = Image.new("RGB", (bw + aw + 40, h + 80), (255, 255, 255))
    canvas.paste(b, (10, 70))
    canvas.paste(a, (bw + 30, 70))
    draw = ImageDraw.Draw(canvas)
    draw.text((bw // 2 - 50, 20), "AVANT", fill="red", font=ImageFont.load_default(size=40))
    draw.text((bw + 30 + aw // 2 - 50, 20), "APRÈS", fill="green", font=ImageFont.load_default(size=40))
    canvas.save(output_path, optimize=True)
```

Demande à Claude Code de te le générer + brancher dans n8n. 5 min.

---

## 9. Ce qui peut être no-code vs ce qu'il faut coder

### ✅ 100% NO-CODE (n8n + outils)
- Scraping Google Maps (Apify HTTP node)
- Stockage en BDD (Supabase node)
- Appels Claude/GPT (HTTP node ou Claude node si dispo)
- Envoi de notifs (Telegram/Discord pour t'avertir)
- Cron quotidien
- Dashboard (page Supabase + filtres natifs)

### 🛠️ À CODER (mais < 50 lignes chaque, généré par Claude Code)
- Le script Python du comparatif avant/après (15 lignes)
- Un mini template HTML pour le dashboard de validation (1 fichier, généré)
- Un petit utilitaire pour formater les numéros WhatsApp au format international

### 🚫 À NE PAS CODER (piège vibe coder)
- Un front custom Next.js : tu n'en as pas besoin avant 3 clients
- Une API backend : Supabase EST ton API
- Une intégration WhatsApp officielle (WhatsApp Business API) : trop cher, trop complexe, et l'envoi manuel est PLUS efficace pour closer
- Un système de paiement : Stripe/CinetPay ça sera dans 2 mois

---

## 10. Schéma Supabase (à créer dès J1)

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- Source
  keyword text,          -- "restaurant Douala"
  ville text,
  pays text,

  -- Identité prospect
  nom text not null,
  type_business text,
  adresse text,
  telephone text,        -- format international +237...
  whatsapp text,
  email text,
  site_web text,
  note_google numeric,
  nb_avis int,

  -- Audit
  audit_json jsonb,
  score_global int,
  problemes text[],
  angle_pitch text,

  -- Assets
  screenshot_before_url text,
  screenshot_after_url text,
  comparison_url text,
  landing_url text,

  -- Message
  whatsapp_message text,

  -- Commercial
  status text default 'nouveau',
  -- nouveau / valide / envoye / repondu / rdv / client / refus
  envoye_le timestamptz,
  reponse_le timestamptz,
  notes text
);
```

---

## 11. Risques & limites (à connaître)

| Risque | Probabilité | Mitigation |
|---|---|---|
| **Apify ban Google Maps** | Faible (ils utilisent rotation IP) | Avoir un fallback : Outscraper ou scraping manuel via Phantom |
| **Numéro WhatsApp banni** | 🔴 RÉELLE si tu spammes | Max 20 messages/jour les 2 premières semaines. Espacer. Utiliser ton numéro perso au début. JAMAIS de message identique. |
| **Sites prospects rendus en JS** (site shell vide) | Moyenne | Audit basé aussi sur le screenshot (Claude Vision) + reviews Google |
| **Qualité du français WA généré** | Moyenne | Claude Sonnet est très bon, mais relis les 10 premiers messages, ajuste le prompt |
| **Coût API qui dérape** | Faible si tu monitores | Limiter à 30 audits/jour. Mettre un budget cap dans Anthropic Console (10€/mois pour démarrer) |
| **Conversion <1%** | Moyenne au début | Itère le message AVANT d'industrialiser. 0 envoi auto avant 5% de réponse. |
| **Aucun GDPR formel en Afrique, MAIS** | — | Loi camerounaise sur les données perso à respecter. Toujours offrir une sortie (« si ça ne vous intéresse pas, dites-le moi et je vous laisse tranquille »). |

---

## 12. Coûts estimés mensuels — 3 scénarios

### Scénario A — 100 leads/mois (test)
- Apify : ~1€
- Anthropic API : ~5€
- ScreenshotOne : 7€ (ou 0€ Playwright)
- n8n Railway : 5€
- Supabase : 0€
- Bolt.new : 0€ (free tier)
- **Total : ~18€/mois**

### Scénario B — 500 leads/mois (vitesse de croisière)
- Apify : ~5€
- Anthropic API : ~20€
- ScreenshotOne : 7€
- n8n Railway : 5€
- Supabase : 0€ encore
- Bolt.new Pro : 20€
- **Total : ~57€/mois**

### Scénario C — 2000 leads/mois (scaling)
- Apify : ~15€
- Anthropic API : ~70€
- ScreenshotOne : 17€
- n8n Railway : 10€
- Supabase Pro : 25€
- Bolt.new Pro : 20€
- **Total : ~157€/mois**

→ Tu restes dans ton budget tant que tu factures **1 client à 250€ /mois** (un client suffit à autofinancer le système jusqu'à 1000 leads/mois).

---

## 13. Plan d'évolution vers SaaS

### Phase 1 (Maintenant — Mois 1-2) : MVP perso
Tu utilises le système pour TOI uniquement. 3-5 clients fermés.

### Phase 2 (Mois 3-4) : Service délivré
- Tu vends la refonte ("Site refait en 7 jours pour 400€")
- Tu utilises Bolt + Cursor pour livrer
- Le système te sert UNIQUEMENT à prospecter

### Phase 3 (Mois 5-8) : Productisation
- Tu transformes le système en outil que d'autres freelances peuvent utiliser
- Front Next.js custom (Claude Code, 2-3 semaines)
- Auth Supabase
- Pricing : 49€/mois pour 200 leads, 99€/mois pour 1000 leads
- Cible : agences web + freelances en Afrique francophone

### Phase 4 (Mois 9-12) : Multi-niches
- Templates landing par verticale (resto, hôtel, médecin, salon de coiffure...)
- Intégration WhatsApp Business API (avec un nombre limité de templates approuvés)
- Marketplace de prompts d'audit

### Architecture cible SaaS (à ne pas construire AVANT phase 3)
```
Next.js (Vercel) ←→ Supabase (DB+Auth+Storage) ←→ n8n Cloud (workflows)
                          ↓
                    Stripe + CinetPay
                          ↓
              Cron jobs (audits quotidiens par user)
```

---

## 14. Comment commencer SEUL aujourd'hui (anti-procrastination)

**Action immédiate (45 minutes) — fais-le après avoir lu ce doc :**
1. Crée le compte Anthropic Console → mets 5€ de crédit
2. Crée le compte Supabase → projet vide
3. Crée le compte Apify → fais 1 scraping de 10 restaurants à Douala
4. Ouvre Bolt.new → génère 1 landing avec le prompt 6.3 sur l'un des 10 restos
5. Envoie le screenshot + un message basique sur WhatsApp à 1 patron de resto

→ Si en 45 min tu as ENVOYÉ 1 message à 1 vrai prospect avec 1 vraie maquette, **tu as déjà validé 60% du MVP**.

Le reste, c'est de l'industrialisation.

---

## 15. Checklist de démarrage

- [ ] Compte Anthropic + clé API + budget cap 10€
- [ ] Compte Apify + clé API
- [ ] Compte Supabase + table `leads` créée
- [ ] Compte Railway + n8n déployé
- [ ] Compte Bolt.new
- [ ] Compte ScreenshotOne (ou skip si Playwright)
- [ ] Premier workflow n8n : scrape → Supabase
- [ ] Premier audit IA testé sur 1 site
- [ ] Première landing générée dans Bolt
- [ ] Premier comparatif PNG généré
- [ ] Premier message WhatsApp ENVOYÉ à un vrai prospect

---

## 16. Métriques à suivre dès J5

| KPI | Cible mois 1 |
|---|---|
| Leads scrapés/jour | 30 |
| Leads validés (score < 50) | 10/jour |
| Messages envoyés/jour | 5-10 (max, anti-ban) |
| Taux de réponse | ≥ 15% |
| Rendez-vous booké | ≥ 5% des envois |
| Closing | 1 client en 30 jours |
| LTV moyen visé | 250-500€ |

---

## Notes finales du CTO

1. **Ne code pas un front avant d'avoir 3 clients.** Supabase + Google Sheets + un script Python suffisent.
2. **N'achète pas LinkedIn Sales Nav.** En Afrique francophone, c'est WhatsApp ou rien.
3. **Le message > la landing.** Si ton premier message ne convertit pas, change le PROMPT avant de changer la landing.
4. **Pas d'envoi auto avant 5% de réponse soutenu.** Sinon ban WhatsApp = -2 semaines.
5. **Tracke TOUT dans Supabase** (status, dates, raisons de refus). C'est ton dataset le plus précieux.
6. **Itère sur 1 verticale 30 jours minimum.** Ne saute pas restaurant → médecin → BTP en 2 semaines.

**Quand tu seras bloqué, reviens ici et dis-moi : "Étape X, problème Y." Je t'aide à débloquer.**

Bon build. 🚀
