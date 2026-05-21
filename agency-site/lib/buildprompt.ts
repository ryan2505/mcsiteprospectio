/**
 * Génère un PROMPT optimisé (prêt à coller dans V0 / Lovable / Bolt / Claude)
 * pour construire le meilleur site amélioré possible pour ce prospect,
 * à partir de son site actuel + de l'audit.
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export function isAnthropicConfigured(): boolean {
  return Boolean(ANTHROPIC_API_KEY);
}

export type LeadForBuildPrompt = {
  nom: string;
  type_business: string | null;
  ville: string | null;
  pays: string | null;
  telephone: string | null;
  site_web: string | null;
  note_google: number | null;
  nb_avis: number | null;
  angle_pitch: string | null;
  problemes: string[] | null;
  langue?: string | null;
  couleurs?: string[] | null;
  style?: string | null;
  ton?: string | null;
};

const META_PROMPT = (lead: LeadForBuildPrompt) => {
  const couleurs =
    lead.couleurs && lead.couleurs.length > 0 ? lead.couleurs.join(", ") : "(à déduire)";
  return `Tu es un Creative Director + Prompt Engineer expert des générateurs de sites par IA (V0, Lovable, Bolt.new, Claude).

Ta mission : produire LE prompt parfait que je vais coller dans un de ces outils pour générer un site COMPLET, moderne et orienté conversion, qui surclasse le site actuel de ce commerce.

Données du prospect :
- Nom : ${lead.nom}
- Type : ${lead.type_business ?? "commerce local"}
- Ville/Pays : ${lead.ville ?? ""} ${lead.pays ?? ""}
- WhatsApp : ${lead.telephone ?? "(à compléter)"}
- Site actuel : ${lead.site_web ?? "(aucun)"}
- Note Google : ${lead.note_google ?? "—"}/5 (${lead.nb_avis ?? 0} avis)
- Langue du site : ${lead.langue ?? "fr"}
- Couleurs de marque : ${couleurs}
- Style actuel : ${lead.style ?? "à moderniser"}
- Ton de marque : ${lead.ton ?? "chaleureux premium"}
- Problèmes identifiés : ${(lead.problemes ?? []).join(" ; ") || "site obsolète"}
- Angle d'amélioration : ${lead.angle_pitch ?? "moderniser et augmenter les réservations"}

EXIGENCES pour le prompt que tu vas produire :
- Rédige-le directement à la 2e personne (instructions pour l'IA génératrice).
- Structure claire avec sections : Contexte & objectif, Public cible, Identité visuelle (couleurs, typo, ambiance), Arborescence/sections du site, Contenu de chaque section, Fonctionnalités (CTA WhatsApp, réservation, carte, avis Google), Direction artistique (niveau premium), Contraintes techniques (mobile-first, performance, SEO local, accessibilité), Ton & langue.
- Respecte l'identité de marque existante (couleurs/langue/ton) tout en la sublimant.
- Sois précis et actionnable, pas générique. Donne des exemples de wording quand utile.
- Optimise pour la CONVERSION (réservations / contacts), pas juste l'esthétique.

Renvoie UNIQUEMENT le prompt final, en Markdown, prêt à copier-coller. Aucune introduction du type "Voici le prompt".`;
};

export async function generateBuildPrompt(lead: LeadForBuildPrompt): Promise<string> {
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
      max_tokens: 2048,
      messages: [{ role: "user", content: META_PROMPT(lead) }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic a renvoyé ${res.status} : ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  return (data.content?.find((c) => c.type === "text")?.text ?? "").trim();
}
