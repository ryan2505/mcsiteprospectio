import { NextResponse } from "next/server";
import { startScrape, isApifyConfigured } from "@/lib/apify";

export const runtime = "nodejs";

/**
 * Démarre un run de scraping Apify (non bloquant) et renvoie son runId.
 * Le suivi + l'insertion en base se font via /api/scrape/status.
 */
export async function POST(req: Request) {
  if (!isApifyConfigured()) {
    return NextResponse.json(
      { error: "APIFY_TOKEN non configuré. Ajoute-le dans .env.local / Vercel." },
      { status: 503 }
    );
  }

  let keyword = "";
  let countryCode: string | undefined;
  let maxResults = 25;

  try {
    const body = await req.json();
    keyword = String(body.keyword ?? "").trim().slice(0, 120);
    countryCode = body.countryCode
      ? String(body.countryCode).trim().toLowerCase().slice(0, 2)
      : undefined;
    if (body.maxResults) {
      maxResults = Math.max(1, Math.min(50, Number(body.maxResults) || 25));
    }
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (keyword.length < 3) {
    return NextResponse.json(
      { error: "Mot-clé trop court (ex: 'restaurant Douala')." },
      { status: 422 }
    );
  }

  try {
    const runId = await startScrape(keyword, { maxResults, countryCode });
    return NextResponse.json({ ok: true, runId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur de démarrage du scraping" },
      { status: 502 }
    );
  }
}
