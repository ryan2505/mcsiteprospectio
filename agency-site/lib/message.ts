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
};

const MESSAGE_PROMPT = (lead: LeadForMessage) => `Tu es expert en prospection WhatsApp pour le marché africain francophone.

Contexte sur le prospect :
- Établissement : ${lead.nom}
- Type : ${lead.type_business ?? "commerce local"}
- Ville : ${lead.ville ?? ""}
- Score actuel du site : ${lead.score_global ?? "?"}/100
- Problème principal / angle : ${lead.angle_pitch ?? "site obsolète"}
- Note Google : ${lead.note_google ?? "?"}/5 (${lead.nb_avis ?? 0} avis)

Rédige un message WhatsApp en français qui :
1. Commence par "Bonjour l'équipe de ${lead.nom}" (ou le prénom du gérant si connu, sinon l'équipe).
2. Mentionne UN détail spécifique prouvant qu'on a regardé leur établissement (note Google, type, etc.).
3. Pose UN constat factuel (pas accusateur) sur leur site actuel.
4. Annonce qu'on a déjà préparé une version améliorée, GRATUITE à voir.
5. Termine par UNE question fermée simple ("Je peux vous la montrer ?").

Règles STRICTES :
- 70 mots MAXIMUM.
- Ton respectueux et direct. Vouvoiement par défaut ; tutoiement seulement si type = lounge/bar.
- 1 emoji maximum, naturel. Pas d'emoji corporate.
- INTERDITS : "optimisation", "conversion", "ROI", "doublez vos ventes", "j'espère que vous allez bien".
- Pas de promesse magique.

Renvoie UNIQUEMENT le texte du message, rien d'autre (pas de guillemets autour, pas d'explication).`;

export async function generateWhatsAppMessage(
  lead: LeadForMessage
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
      messages: [{ role: "user", content: MESSAGE_PROMPT(lead) }],
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

  // Nettoyage : retire d'éventuels guillemets entourant tout le message.
  return raw.trim().replace(/^["«»\s]+|["«»\s]+$/g, "");
}
