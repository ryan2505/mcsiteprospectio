/**
 * Génération de la landing page améliorée via Claude.
 * Claude renvoie un document HTML complet, autonome (CSS inline),
 * mobile-first, avec CTA WhatsApp. On le sert ensuite sur /preview/<id>.
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export function isAnthropicConfigured(): boolean {
  return Boolean(ANTHROPIC_API_KEY);
}

export type LeadForLanding = {
  nom: string;
  type_business: string | null;
  ville: string | null;
  pays: string | null;
  adresse: string | null;
  telephone: string | null;
  note_google: number | null;
  nb_avis: number | null;
  angle_pitch: string | null;
  problemes: string[] | null;
  // Identité de marque détectée par l'audit (optionnelle)
  langue?: string | null;
  couleurs?: string[] | null;
  style?: string | null;
  ton?: string | null;
};

/** Numéro WhatsApp au format wa.me (chiffres uniquement). */
function waDigits(phone: string | null): string {
  if (!phone) return "";
  return phone.replace(/[^\d]/g, "");
}

const LANDING_PROMPT = (lead: LeadForLanding) => {
  const wa = waDigits(lead.telephone);
  const langue = (lead.langue || "fr").trim();
  const couleurs =
    lead.couleurs && lead.couleurs.length > 0
      ? lead.couleurs.join(", ")
      : "à déduire du secteur (élégant, premium)";
  const style = lead.style || "moderne";
  const ton = lead.ton || "chaleureux premium";

  return `Tu es un Lead Designer & Front-End Engineer primé (Awwwards "Site of the Day", FWA, CSS Design Awards). Tu factures 10 000 $ une hero section. Tu vas livrer une hero d'agence haut de gamme.

CLIENT :
- Nom : ${lead.nom}
- Type : ${lead.type_business ?? "commerce local"}
- Ville : ${lead.ville ?? ""} ${lead.pays ?? ""}
- Téléphone / WhatsApp : ${lead.telephone ?? "(à compléter)"}
- Note Google : ${lead.note_google ?? "—"}/5 (${lead.nb_avis ?? 0} avis)
- Faiblesses du site actuel : ${(lead.problemes ?? []).join(" ; ") || "site obsolète, peu convaincant"}
- Angle de vente : ${lead.angle_pitch ?? "première impression moderne et premium"}

IDENTITÉ DE MARQUE À RESPECTER (issue de leur site actuel) :
- LANGUE DE RÉDACTION : ${langue} → TOUS les textes (titre, sous-titre, CTA, badges) DOIVENT être dans cette langue.
- Couleurs de marque : ${couleurs} → pars de cette palette mais SUBLIME-la (versions plus riches, contrastes maîtrisés). Ne trahis pas l'ADN visuel.
- Style à faire évoluer vers le haut de gamme : ${style}
- Ton de marque : ${ton} → l'écriture du copy doit refléter ce ton.

OBJECTIF : une hero qui provoque un "wow" immédiat, digne d'une marque premium, et qui écrase visuellement leur site actuel — tout en restant fidèle à leur identité.

EXIGENCES TECHNIQUES :
- Renvoie UNIQUEMENT le HTML, de <!DOCTYPE html> à </html>. AUCUN texte/commentaire/markdown autour.
- UN SEUL fichier autonome, tout le CSS dans <style> dans le <head>. JS uniquement si trivial (ex: année).
- La page ne contient QUE le hero : min-height: 100vh; min-height: 100svh.
- Mobile-first irréprochable, puis sublime en desktop.

DIRECTION ARTISTIQUE (niveau 10 000 $) :
- Composition éditoriale soignée : layout avec tension visuelle (asymétrie maîtrisée, grille, marges généreuses), PAS un hero centré générique.
- Typographie de haut niveau via Google Fonts : titre display à fort caractère (ex: "Playfair Display", "Fraunces", "Cormorant" selon le secteur) + texte net ("Inter", "Manrope"). Utilise clamp() pour un scaling fluide, un letter-spacing et une line-height travaillés.
- Image de fond premium et PERTINENTE via https://images.unsplash.com (cohérente avec le type d'établissement + ambiance locale), avec traitement pro : overlay en dégradé multidirectionnel, léger grain/vignette, contraste maîtrisé pour la lisibilité.
- Profondeur & finition : couches superposées, glassmorphism subtil sur les badges, ombres douces, filet doré ou trait d'accent, micro-détails (séparateurs, puces icônes).
- Badge note Google élégant (étoiles + note + nb d'avis) + 1-2 "trust signals" courts.
- CTA principal irrésistible "${langue === "en" ? "Book on WhatsApp" : "Réserver sur WhatsApp"}" → https://wa.me/${wa || "000000000"} (bouton à fort contraste, états hover/active soignés, micro-interaction). CTA secondaire discret (ex: voir le menu / appeler).
- Motion de classe : animations d'entrée orchestrées (fade + slide + scale légers, délais en cascade) via @keyframes, transitions fluides (cubic-bezier). Respecte prefers-reduced-motion.
- Accessibilité : contrastes AA, focus visibles, alt pertinents.
- Performance : aucune librairie JS lourde, animations CSS uniquement, images en background-size: cover.

Vise un rendu qu'un directeur artistique senior validerait sans retouche. Commence directement par <!DOCTYPE html>.`;
};

/** Génère le HTML de la landing pour un lead. */
export async function generateLandingHtml(lead: LeadForLanding): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY manquant.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 8000,
      messages: [{ role: "user", content: LANDING_PROMPT(lead) }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic a renvoyé ${res.status} : ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const raw = data.content?.find((c) => c.type === "text")?.text ?? "";

  return extractHtml(raw);
}

/** Nettoie la réponse : retire d'éventuels fences markdown, isole le HTML. */
function extractHtml(raw: string): string {
  let html = raw.trim();

  // Retire les fences ```html ... ```
  const fence = html.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fence) html = fence[1].trim();

  // Isole à partir de <!DOCTYPE ou <html
  const start = html.search(/<!doctype html|<html/i);
  if (start > 0) html = html.slice(start);

  if (!/<html/i.test(html)) {
    throw new Error("La réponse IA ne contient pas de HTML valide.");
  }
  return html;
}
