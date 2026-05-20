# MCSite — Site marketing de l'agence

Site marketing public en **Next.js 15 + Tailwind + shadcn/ui + Supabase**, déployable gratuitement sur **Vercel**.

Le site présente ton service de refonte (restaurants/hôtels/commerces en Afrique francophone), pousse les visiteurs vers WhatsApp, et collecte les leads du formulaire dans Supabase.

---

## 🚀 Démarrage rapide (5 commandes)

> Pré-requis : **Node.js 18.18+** installé. Vérifie avec `node -v`.

```bash
# 1. Va dans le dossier
cd "agency-site"

# 2. Installe les dépendances
npm install

# 3. Crée ton fichier d'environnement
cp .env.local.example .env.local
#    (sous Windows PowerShell : copy .env.local.example .env.local)

# 4. Ouvre .env.local et remplis tes clés (voir section Supabase ci-dessous)

# 5. Lance en local
npm run dev
```

Ouvre **http://localhost:3000** — le site est en ligne en local. 🎉

> 💡 Astuce vibe coding : ouvre ce dossier dans **Claude Code** (`claude` dans le terminal) et demande-lui de modifier les sections directement. Tout est dans `app/page.tsx`.

---

## 🔑 Configuration Supabase (5 min)

1. Crée un projet gratuit sur [supabase.com](https://supabase.com).
2. Va dans **SQL Editor → New query**, colle le contenu de `supabase/schema.sql`, clique **Run**.
3. Va dans **Project Settings → API** et récupère :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (secret) → `SUPABASE_SERVICE_ROLE_KEY`
4. Colle ces 3 valeurs dans `.env.local`.
5. Mets ton numéro WhatsApp (format international **sans le +**) dans `NEXT_PUBLIC_WHATSAPP_NUMBER`, ex : `237600000000`.

> Sans Supabase configuré, le site fonctionne quand même : les leads du formulaire s'affichent dans la console serveur au lieu d'être stockés. Pratique pour tester vite.

Les leads reçus apparaissent dans **Supabase → Table Editor → `inbound_leads`**.

---

## ☁️ Déploiement sur Vercel (gratuit)

### Méthode recommandée — via GitHub

```bash
# Dans le dossier agency-site, initialise git
git init
git add .
git commit -m "MCSite marketing site"

# Crée un repo vide sur github.com puis :
git remote add origin https://github.com/TON_USER/mcsite.git
git branch -M main
git push -u origin main
```

Ensuite :
1. Va sur [vercel.com](https://vercel.com) → **Add New → Project**.
2. Importe ton repo GitHub `mcsite`.
3. Vercel détecte Next.js automatiquement → laisse les réglages par défaut.
4. Avant de déployer, ouvre **Environment Variables** et ajoute les 4 variables de ton `.env.local` :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`
5. Clique **Deploy**. En ~1 min, ton site est en ligne sur `https://mcsite-xxx.vercel.app`. ✅

À chaque `git push`, Vercel redéploie automatiquement.

### Méthode express — CLI (sans GitHub)

```bash
npm i -g vercel
vercel           # suit les questions, lie le projet
vercel --prod    # déploie en production
```

(Pense à ajouter les variables d'environnement avec `vercel env add` ou dans le dashboard.)

---

## 🌐 Sous-domaine gratuit → domaine custom plus tard

- **Maintenant :** ton site est sur `https://ton-projet.vercel.app` (gratuit, HTTPS inclus). Tu peux personnaliser le sous-domaine dans **Vercel → Settings → Domains**.
- **Plus tard :** quand tu achètes un domaine (Namecheap, Cloudflare, OVH...), va dans **Vercel → Settings → Domains → Add**, entre ton domaine, et suis les 2 enregistrements DNS à ajouter chez ton registrar. Vercel gère le HTTPS automatiquement.

> Pense à mettre à jour `metadataBase` dans `app/layout.tsx` avec ton vrai domaine pour le SEO.

---

## 🎨 Personnaliser le site

| Quoi changer | Où |
|---|---|
| Nom de l'agence "MCSite" | `app/page.tsx` (Header + Footer), `app/layout.tsx` (metadata) |
| Textes, sections, prix | `app/page.tsx` — chaque section est un composant clair (Hero, Pricing, FAQ…) |
| Couleurs (terracotta par défaut) | `app/globals.css` → variables `--primary`, `--accent` |
| Vrais avant/après | Section `Showcase` dans `app/page.tsx` (remplace les placeholders par des `<img>`) |
| Vrais témoignages | Section `Testimonials` dans `app/page.tsx` |
| Numéro WhatsApp | Variable `NEXT_PUBLIC_WHATSAPP_NUMBER` |
| Tarifs (FCFA) | Section `Pricing` dans `app/page.tsx` |

---

## 📁 Structure

```
agency-site/
├── app/
│   ├── layout.tsx          # SEO, polices, métadonnées
│   ├── page.tsx            # 🟢 TOUTE la homepage (toutes les sections)
│   ├── globals.css         # thème + couleurs
│   └── api/contact/route.ts# endpoint formulaire → Supabase
├── components/
│   ├── contact-form.tsx    # formulaire client
│   └── ui/                 # composants shadcn (button, input, accordion…)
├── lib/
│   ├── supabase.ts         # clients Supabase
│   └── utils.ts
├── supabase/schema.sql     # 🟢 à exécuter dans Supabase
├── .env.local.example      # 🟢 modèle de variables
└── package.json
```

---

## ✅ Checklist avant mise en ligne

- [ ] `npm install` puis `npm run dev` fonctionne en local
- [ ] Schéma SQL exécuté dans Supabase
- [ ] 4 variables d'environnement remplies (local + Vercel)
- [ ] Numéro WhatsApp testé (clic → ouvre WhatsApp avec message pré-rempli)
- [ ] Formulaire testé (un lead apparaît dans `inbound_leads`)
- [ ] Nom "MCSite" remplacé par ton vrai nom d'agence
- [ ] Tarifs FCFA ajustés à ton offre réelle
- [ ] Déployé sur Vercel

---

## 🤖 Moteur de prospection (`/admin`)

En plus du site marketing public, l'app contient un **dashboard de prospection** sur `/admin` qui implémente les **étapes 1-2 du pipeline MVP** :

1. **Recherche Google Maps (enrichie)** — tu entres un mot-clé (ex: `restaurant Douala`) + un pays → scraping via **Apify** (acteur `lukaskrivka/google-maps-with-contact-details`) qui récupère, en plus du téléphone et du site, les **emails + Facebook + Instagram + LinkedIn** de chaque établissement. Le job tourne en **mode asynchrone** (le dashboard suit la progression en temps réel, jusqu'à 50 leads par recherche, sans timeout). Seules les entreprises avec un site web sont conservées.
   - Pour revenir à un scraping basique/rapide (sans contacts), définis `APIFY_ACTOR=compass~crawler-google-places` dans `.env.local`.
2. **Audit IA** — un clic sur "Auditer" récupère le HTML du site, l'envoie à **Claude**, et renvoie un score /100 + 3 problèmes + un angle de pitch, stockés sur le lead.
3. **Génération de landing** — un clic sur "Landing" demande à **Claude** de générer une landing page complète (HTML autonome, mobile-first, CTA WhatsApp) à partir des données du lead + de l'angle d'audit. Elle est servie sur une URL publique `/preview/<id>` (idéale pour le screenshot "après" et pour la montrer au prospect). Bouton "Voir" pour l'ouvrir.
4. **Comparatif avant/après** — bouton "Comparatif" → page publique `/compare/<id>` qui affiche côte à côte le screenshot du site actuel (AVANT) et de la nouvelle landing (APRÈS), via **thum.io** (gratuit, sans clé). Screenshote cette page pour l'envoyer sur WhatsApp.
5. **Message WhatsApp** — bouton "Message" → **Claude** rédige un message commercial personnalisé (< 70 mots, ton local, sans jargon) à partir du lead + de l'audit. Boutons "Copier" et "Ouvrir WhatsApp" (lien `wa.me` pré-rempli avec le numéro et le message).

### Le pipeline complet en un clic chacun

Pour chaque lead : **Auditer → Landing → Comparatif → Message → Ouvrir WhatsApp**. Tu valides à chaque étape (Human-Assisted AI), puis tu envoies manuellement. Statut du lead mis à jour automatiquement (`nouveau → audité → landing_prête → message_prêt`).

> ⚠️ **Screenshots "après" en local :** thum.io ne peut pas voir `http://localhost`, donc l'aperçu APRÈS du comparatif ne s'affiche **qu'une fois l'app déployée sur Vercel** (URL publique). L'aperçu AVANT (site du prospect, public) fonctionne partout.

### Variables nécessaires (en plus de Supabase)

| Variable | Où l'obtenir |
|---|---|
| `APIFY_TOKEN` | [console.apify.com](https://console.apify.com/account/integrations) (5$ de crédit offert) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `ANTHROPIC_MODEL` | optionnel, défaut `claude-sonnet-4-6` |
| `ADMIN_USER` / `ADMIN_PASSWORD` | tu les choisis — protègent `/admin` en Basic Auth |

> **Important :** ajoute aussi ces variables dans **Vercel → Settings → Environment Variables**. Sans `ADMIN_PASSWORD`, l'admin est en accès libre (OK en local, **à NE PAS laisser en prod**).

### Notes techniques

- Le scraping utilise l'actor Apify `compass/crawler-google-places` en mode synchrone, limité à 15 résultats pour rester sous le timeout serverless (60s). Pour des volumes plus gros, passe en mode asynchrone (run + polling).
- Un index unique sur `site_web` évite les doublons entre recherches.
- Les routes `/api/scrape`, `/api/audit` et `/admin` sont protégées par le `middleware.ts`.

### Prochains maillons du pipeline (pas encore codés)

3. Génération de la landing améliorée
4. Screenshots avant/après + comparatif
5. Génération du message WhatsApp personnalisé
6. Bouton "Copier message + envoyer" dans le dashboard

Voir `../MVP_PLAN.md` pour le détail de ces étapes.

---

## ▶️ Étapes suivantes possibles

- Ajouter une page `/realisations` avec tes vrais cas clients
- Brancher l'API d'audit IA (clé `ANTHROPIC_API_KEY` déjà prévue dans `.env`) : un visiteur entre l'URL de son site → audit instantané affiché → hook de conversion ultra fort
- Connecter ce site au pipeline de prospection décrit dans `../MVP_PLAN.md`
- Ajouter un pixel Meta / Google pour retargeter les visiteurs

Bon build. 🚀
