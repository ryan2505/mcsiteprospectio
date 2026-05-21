/**
 * Génération automatique de mots-clés de recherche Google Maps via Claude.
 * Adaptés au marché africain francophone selon le type de service ciblé.
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export async function generateKeywords(
  serviceType: string,
  pays: string,
  ville?: string
): Promise<string[]> {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY manquant");

  const loc = ville ? `${ville}, ${pays}` : pays;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `Tu es expert en prospection digitale pour les PME d'Afrique francophone.

Génère 8 mots-clés de recherche Google Maps variés pour trouver des "${serviceType}" à ${loc} ayant un site web à améliorer.
Inclus les synonymes locaux courants (ex: "maquis" ou "restaurant traditionnel" pour Cameroun, etc.).
Varie les formulations pour couvrir différentes niches de ce secteur.

Réponds UNIQUEMENT avec un tableau JSON de strings, sans explication ni markdown :
["mot-clé 1", "mot-clé 2", ...]`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic ${res.status}`);

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const raw = data.content?.find((c) => c.type === "text")?.text ?? "[]";

  try {
    const arr = JSON.parse(
      raw.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim()
    );
    return Array.isArray(arr)
      ? arr.slice(0, 8).map(String)
      : [`${serviceType} ${pays}`];
  } catch {
    return [`${serviceType} ${pays}`];
  }
}
