/**
 * Génération du message commercial WhatsApp personnalisé via Claude.
 * Ton adapté au marché africain francophone, court, sans jargon.
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export function isAnthropicConfigured(): boolean {
  return Boolean(ANTHROPIC_API_KEY);
}

export type LeadForMessage = {
  nom: string;
  type_business: string | null;
  ville: string | null;
  note_google: number | null;
  nb_avis: number | null;
  score_global: number | null;
  angle_pitch: string | null;
  problemes?: string[] | null;
};

export type MessageOptions = {
  previewUrl?: string;
  calendlyUrl?: string;
  comparisonUrl?: string;
};

const MESSAGE_PROMPT = (lead: LeadForMessage, opts?: MessageOptions) => {
  const hasExtra = opts?.previewUrl || opts?.calendlyUrl;
  const majorProblem = lead.problemes?.[0] ?? lead.angle_pitch ?? "site web à moderniser";

  if (hasExtra) {
    return `Tu es expert en prospection WhatsApp pour le marché africain francophone.

Contexte sur le prospect :
- Établissement : ${lead.nom}
- Type : ${lead.type_business ?? "commerce local"}
- Ville : ${lead.ville ?? ""}
- Score actuel du site : ${lead.score_global ?? "?"}/100
- Problème principal : ${majorProblem}
- Note Google : ${lead.note_google ?? "?"}/5 (${lead.nb_avis ?? 0} avis)
${opts?.comparisonUrl ? `- Image comparaison AVANT/APRÈS (à joindre en pièce jointe) : ${opts.comparisonUrl}` : ""}
${opts?.previewUrl ? `- Lien aperçu du nouveau site : ${opts.previewUrl}` : ""}
${opts?.calendlyUrl ? `- Lien prise de RDV : ${opts.calendlyUrl}` : ""}

Rédige un message WhatsApp en français qui :
1. Commence par "Bonjour l'équipe de ${lead.nom}".
2. Mentionne UN détail spécifique (note Google, type d'établissement, etc.).
3. Pose UN constat factuel sur leur site — problème précis, sans accuser.
4. Annonce qu'on a préparé leur nouvelle page web GRATUITEMENT et qu'on leur envoie la comparaison AVANT/APRÈS en image${opts?.previewUrl ? ` + lien : ${opts.previewUrl}` : ""}.
5. Propose un call de 30 min sans engagement${opts?.calendlyUrl ? ` : ${opts.calendlyUrl}` : ""}.
6. Termine par une question courte ("Ça vous intéresse ?").

Règles STRICTES :
- 110 mots MAXIMUM.
- Vouvoiement par défaut ; tutoiement seulement si type = lounge/bar.
- 1 emoji maximum, naturel.
- INTERDITS : "optimisation", "conversion", "ROI", "doublez vos ventes", "j'espère".
- Inclus les liens tels quels dans le texte (ne les reformule pas).
- Mentionne explicitement qu'une image comparaison AVANT/APRÈS est jointe.

Renvoie UNIQUEMENT le texte du message, rien d'autre.`;
  }

  return `Tu es expert en prospection WhatsApp pour le marché africain francophone.

Contexte sur le prospect :
- Établissement : ${lead.nom}
- Type : ${lead.type_business ?? "commerce local"}
- Ville : ${lead.ville ?? ""}
- Score actuel du site : ${lead.score_global ?? "?"}/100
- Problème principal / angle : ${majorProblem}
- Note Google : ${lead.note_google ?? "?"}/5 (${lead.nb_avis ?? 0} avis)

Rédige un message WhatsApp en français qui :
1. Commence par "Bonjour l'équipe de ${lead.nom}".
2. Mentionne UN détail spécifique prouvant qu'on a regardé leur établissement.
3. Pose UN constat factuel (pas accusateur) sur leur site actuel.
4. Annonce qu'on a déjà préparé une version améliorée, GRATUITE à voir.
5. Termine par UNE question fermée simple ("Je peux vous la montrer ?").

Règles STRICTES :
- 70 mots MAXIMUM.
- Vouvoiement par défaut ; tutoiement seulement si type = lounge/bar.
- 1 emoji maximum, naturel. Pas d'emoji corporate.
- INTERDITS : "optimisation", "conversion", "ROI", "doublez vos ventes", "j'espère que vous allez bien".
- Pas de promesse magique.

Renvoie UNIQUEMENT le texte du message, rien d'autre (pas de guillemets autour, pas d'explication).`;
};

export async function generateWhatsAppMessage(
  lead: LeadForMessage,
  opts?: MessageOptions
): Promise<string> {
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
      max_tokens: 512,
      messages: [{ role: "user", content: MESSAGE_PROMPT(lead, opts) }],
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

  return raw.trim().replace(/^["«»\s]+|["«»\s]+$/g, "");
}
