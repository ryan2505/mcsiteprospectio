/**
 * Audit IA d'un site web via l'API Anthropic (Claude).
 * 1) On récupère le HTML du site (server-side).
 * 2) On l'envoie à Claude avec un prompt structuré.
 * 3) Claude renvoie un JSON d'audit (score, problèmes, angle de pitch).
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export type AuditResult = {
  score_global: number;
  score_design: number;
  score_mobile: number;
  score_conversion: number;
  problemes: string[];
  angle_pitch: string;
  type_business: string;
  ton_recommande: string;
};

export function isAnthropicConfigured(): boolean {
  return Boolean(ANTHROPIC_API_KEY);
}

/** Récupère le HTML brut d'un site, avec timeout et garde-fous. */
export async function fetchSiteHtml(url: string, maxChars = 6000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MCSiteAuditBot/1.0; +https://mcsite.example)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    const html = await res.text();
    // On retire scripts/styles pour garder du signal utile.
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned.slice(0, maxChars);
  } finally {
    clearTimeout(timeout);
  }
}

const AUDIT_PROMPT = (url: string, html: string) => `Tu es un expert UX/UI et conversion spécialisé dans les sites web de commerces locaux en Afrique francophone (restaurants, hôtels, salons).

Voici l'URL et le HTML (nettoyé) d'un site à auditer :
URL : ${url}
HTML : ${html}

Analyse le site et renvoie UNIQUEMENT un JSON valide (aucun texte autour, pas de markdown), avec EXACTEMENT ces champs :

{
  "score_global": <int 0-100>,
  "score_design": <int 0-100>,
  "score_mobile": <int 0-100>,
  "score_conversion": <int 0-100>,
  "problemes": [<3 chaînes max, en français simple, sans jargon technique>],
  "angle_pitch": "<1 phrase concrète sur ce que ce site fait perdre comme business, ex: 'Tu perds des réservations car aucun bouton WhatsApp visible'>",
  "type_business": "<ex: restaurant, hôtel, salon, autre>",
  "ton_recommande": "<'amical' ou 'formel'>"
}

Règles :
- Pense MOBILE FIRST (90% du trafic est mobile en Afrique).
- Score > 70 = site déjà correct. Score < 50 = grosse opportunité.
- Sois sévère mais juste.`;

/** Appelle Claude et renvoie l'audit parsé. */
export async function auditSite(url: string): Promise<AuditResult> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY manquant dans les variables d'environnement.");
  }

  let html = "";
  try {
    html = await fetchSiteHtml(url);
  } catch {
    html = "(Impossible de récupérer le HTML — site lent, bloqué ou rendu en JS.)";
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
      max_tokens: 1024,
      messages: [{ role: "user", content: AUDIT_PROMPT(url, html) }],
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

  return parseAuditJson(raw);
}

function parseAuditJson(raw: string): AuditResult {
  // Claude peut entourer le JSON de texte/backticks : on extrait le 1er objet { ... }.
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Réponse IA non parsable (pas de JSON trouvé).");

  const obj = JSON.parse(match[0]) as Partial<AuditResult>;
  const clampInt = (v: unknown) =>
    Math.max(0, Math.min(100, Math.round(Number(v) || 0)));

  return {
    score_global: clampInt(obj.score_global),
    score_design: clampInt(obj.score_design),
    score_mobile: clampInt(obj.score_mobile),
    score_conversion: clampInt(obj.score_conversion),
    problemes: Array.isArray(obj.problemes)
      ? obj.problemes.slice(0, 3).map(String)
      : [],
    angle_pitch: String(obj.angle_pitch ?? ""),
    type_business: String(obj.type_business ?? ""),
    ton_recommande: String(obj.ton_recommande ?? "amical"),
  };
}
