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

const MESSAGE_PROMPT = (lead: LeadForMessage, opts?: MessageOptions): string => {
  const majorProblem = lead.problemes?.[0] ?? lead.angle_pitch ?? "site web à moderniser";
  const calendlyUrl = opts?.calendlyUrl?.trim() || null;
  const previewUrl  = opts?.previewUrl?.trim()  || null;
  const comparisonUrl = opts?.comparisonUrl?.trim() || null;

  // Numérotation dynamique des étapes selon les URLs disponibles
  let stepNum = 4;
  const stepPreview   = previewUrl   ? `${++stepNum}. [OBLIGATOIRE] Inclus ce lien aperçu tel quel dans le texte : ${previewUrl}` : null;
  const stepCalendly  = calendlyUrl  ? `${++stepNum}. [OBLIGATOIRE] Propose un appel de 30 min sans engagement et inclus ce lien tel quel : ${calendlyUrl}` : null;
  const closingStep   = `${++stepNum}. Termine par une question fermée courte.`;
  const closingExample = calendlyUrl || previewUrl ? "Ça vous intéresse ?" : "Je peux vous la montrer ?";

  const steps = [
    `1. Commence par "Bonjour l'équipe de ${lead.nom}".`,
    "2. Cite UN détail précis qui prouve qu'on a étudié leur établissement (note Google, ville, type de business, problème identifié).",
    "3. Formule UN constat factuel sur leur site actuel — neutre, jamais accusateur.",
    `4. [OBLIGATOIRE] Annonce qu'on a déjà préparé leur nouveau site GRATUITEMENT et qu'on joint la comparaison AVANT/APRÈS en pièce jointe image.`,
    stepPreview,
    stepCalendly,
    closingStep,
  ]
    .filter(Boolean)
    .join("\n");

  const contextLines = [
    comparisonUrl ? `- Comparaison AVANT/APRÈS (image à joindre en pièce jointe) : ${comparisonUrl}` : null,
    previewUrl    ? `- Lien aperçu du nouveau site : ${previewUrl}`    : null,
    calendlyUrl   ? `- Lien réservation appel : ${calendlyUrl}`        : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `Tu es expert en prospection WhatsApp pour le marché africain francophone.

Contexte sur le prospect :
- Établissement : ${lead.nom}
- Type : ${lead.type_business ?? "commerce local"}
- Ville : ${lead.ville ?? "non précisée"}
- Score actuel du site web : ${lead.score_global ?? "?"}/100
- Problème principal identifié : ${majorProblem}
- Note Google : ${lead.note_google ?? "?"}/5 (${lead.nb_avis ?? 0} avis)
${contextLines}

STRUCTURE OBLIGATOIRE du message (respecte cet ordre) :
${steps}

Exemple de question finale : "${closingExample}"

RÈGLES STRICTES :
- 120 mots MAXIMUM.
- Vouvoiement par défaut ; tutoiement uniquement si type = lounge / bar / boîte de nuit.
- 1 seul emoji, en tout début de message.
- INTERDITS absolus : "optimisation", "conversion", "ROI", "doublez vos ventes", "j'espère que vous allez bien", "n'hésitez pas".
- Les liens doivent apparaître tels quels dans le texte — ne les reformule pas, ne les raccourcis pas.
- Pas de promesse magique ni de superlatif creux.

Renvoie UNIQUEMENT le texte du message, sans guillemets autour, sans explication, sans signature.`;
};

export async function generateWhatsAppMessage(
  lead: LeadForMessage,
  opts?: MessageOptions
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY manquant.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    signal: AbortSignal.timeout(30_000),
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 600,
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
