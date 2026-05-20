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
};

/** Numéro WhatsApp au format wa.me (chiffres uniquement). */
function waDigits(phone: string | null): string {
  if (!phone) return "";
  return phone.replace(/[^\d]/g, "");
}

const LANDING_PROMPT = (lead: LeadForLanding) => {
  const wa = waDigits(lead.telephone);
  return `Tu es un développeur front-end de niveau Awwwards / primé en concours, spécialiste des HERO SECTIONS à fort impact pour commerces locaux en Afrique francophone.

Crée UNIQUEMENT une HERO SECTION (pas une page complète) pour cet établissement :

- Nom : ${lead.nom}
- Type : ${lead.type_business ?? "commerce local"}
- Ville : ${lead.ville ?? ""} ${lead.pays ?? ""}
- Téléphone / WhatsApp : ${lead.telephone ?? "(à compléter)"}
- Note Google : ${lead.note_google ?? "—"}/5 (${lead.nb_avis ?? 0} avis)
- Faiblesses du site actuel : ${(lead.problemes ?? []).join(" ; ") || "site obsolète, peu convaincant"}
- Angle : ${lead.angle_pitch ?? "rendre la première impression moderne et premium"}

OBJECTIF : une hero section qui provoque un effet "wow" immédiat, qui donne envie de réserver, et qui surclasse totalement leur site actuel.

EXIGENCES STRICTES :
- Renvoie UNIQUEMENT le code HTML, depuis <!DOCTYPE html> jusqu'à </html>. AUCUN texte, AUCUN commentaire, AUCUN bloc markdown autour.
- Un SEUL fichier autonome : tout le CSS dans une balise <style> dans le <head>.
- La page ne contient QUE le hero : il doit remplir l'écran (min-height: 100vh, 100svh).
- Mobile-first impeccable (90% du trafic est mobile en Afrique).

DIRECTION ARTISTIQUE (niveau primé) :
- Image de fond plein écran pertinente via https://images.unsplash.com (thème cohérent avec le type d'établissement, ambiance africaine premium), avec overlay sombre dégradé pour la lisibilité.
- Typographie soignée : titre display imposant (clamp() pour le responsive), Google Fonts (ex: "Playfair Display" pour le titre + "Inter" pour le texte).
- Hiérarchie claire : petit eyebrow (ex: type + ville), grand titre accrocheur, sous-titre court, puis CTA.
- Badge "note Google" élégant (étoiles + note + nb d'avis) bien visible.
- CTA principal "Réserver sur WhatsApp" → lien https://wa.me/${wa || "000000000"} (gros bouton, contraste fort, effet hover).
- Détails premium : micro-animation d'entrée (fade/slide via @keyframes), espacements généreux, accents dorés, glassmorphism léger sur le badge si pertinent.
- Palette : terracotta / vert profond / crème / accents dorés.
- Performance : pas de librairie JS lourde, animations CSS uniquement.
- Langue : français.

Commence directement par <!DOCTYPE html>.`;
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
