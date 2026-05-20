# 🚀 Déployer MCSite sur Vercel (gratuit)

Une fois en ligne, ton app aura une vraie URL publique (`https://...vercel.app`).
Résultat : **les screenshots du hero fonctionneront**, et tes prospects pourront
ouvrir les liens `/preview` et `/compare`.

Tu n'as **rien à reconfigurer dans le code** : il détecte automatiquement l'URL
publique. Tu fais juste le déploiement + tu recopies tes variables d'environnement.

---

## Méthode A — La plus simple (Vercel CLI, sans GitHub)

### 1. Crée un compte Vercel
Va sur **https://vercel.com** → "Sign Up" (tu peux utiliser ton compte Google/GitHub).

### 2. Lance le déploiement
Double-clique sur **`DEPLOYER-VERCEL.bat`** (dans ce dossier).

La première fois, il va :
1. te demander de te connecter (une page web s'ouvre, tu confirmes),
2. poser quelques questions simples — réponds comme ceci :
   - *Set up and deploy?* → **Y** (oui)
   - *Which scope?* → choisis ton compte
   - *Link to existing project?* → **N** (non)
   - *Project name?* → appuie sur Entrée (garde `agency-site`)
   - *In which directory is your code?* → appuie sur Entrée (`./`)
   - *Modify settings?* → **N** (non)

À la fin, il affiche une URL `https://agency-site-xxx.vercel.app`. 🎉
(Pour l'instant le dashboard n'aura pas encore tes clés — étape suivante.)

### 3. Ajoute tes variables d'environnement
1. Va sur **https://vercel.com** → ouvre ton projet `agency-site`.
2. **Settings → Environment Variables**.
3. Ouvre ton fichier `.env.local`, copie **chaque ligne** (clé = valeur) et ajoute-les
   une par une (ou colle tout le contenu d'un coup, Vercel sait importer un `.env`).

   Variables à mettre :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`
   - `APIFY_TOKEN`
   - `APIFY_ACTOR`
   - `ANTHROPIC_API_KEY`
   - `ANTHROPIC_MODEL`
   - `ADMIN_USER`
   - `ADMIN_PASSWORD`  ⚠️ **mets un mot de passe fort** (pas "admin") — c'est ce qui protège ton /admin en ligne.

### 4. Re-déploie avec les variables
Double-clique de nouveau sur **`DEPLOYER-VERCEL.bat`** (cette fois ce sera direct).

### 5. C'est en ligne !
- Site public : `https://agency-site-xxx.vercel.app`
- Dashboard : `https://agency-site-xxx.vercel.app/admin` (login : ton ADMIN_USER / ADMIN_PASSWORD)

Refais un test : **Auditer → Générer hero → le screenshot s'affiche enfin** ✅

---

## Méthode B — Via GitHub (recommandée si tu veux du versionnage)

1. Crée un dépôt vide sur **github.com**.
2. Dans le dossier `agency-site`, ouvre un terminal et lance :
   ```
   git init
   git add .
   git commit -m "MCSite"
   git remote add origin https://github.com/TON_USER/mcsite.git
   git branch -M main
   git push -u origin main
   ```
3. Sur **vercel.com → Add New → Project**, importe ce dépôt.
4. Avant de déployer, ajoute les variables d'environnement (voir étape 3 ci-dessus).
5. Clique **Deploy**. Ensuite, chaque `git push` redéploiera automatiquement.

---

## ⚠️ Points importants

- **Ton `.env.local` n'est PAS envoyé sur Vercel** (il est ignoré par git/CLI).
  C'est pour ça qu'il faut recopier les variables dans Vercel manuellement. C'est normal et voulu (sécurité).
- **Change `ADMIN_PASSWORD`** pour la prod : avec "admin/admin", n'importe qui pourrait
  accéder à ton dashboard en ligne.
- **Supabase** : assure-toi d'avoir bien exécuté `supabase/schema.sql` (avec les colonnes
  `facebook`, `instagram`, `linkedin`).
- Le **site marketing** est public (normal). Le **/admin** est protégé par mot de passe.

---

## En cas de souci au déploiement

Si le build échoue, copie le message d'erreur affiché par Vercel et envoie-le.
Les causes les plus fréquentes : une variable mal copiée, ou Node trop ancien
(Vercel utilise Node 20+ par défaut, donc normalement aucun souci).
