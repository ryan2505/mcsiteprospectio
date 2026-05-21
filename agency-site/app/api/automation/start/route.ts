import { NextResponse } from "next/server";
import { getState, updateState, addLog } from "@/lib/automation";
import { startScrape, isApifyConfigured } from "@/lib/apify";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST() {
  const state = await getState();
  if (!state)
    return NextResponse.json({ error: "Non configuré — lance /api/automation/configure d'abord" }, { status: 503 });

  if (state.status === "running")
    return NextResponse.json({ ok: true, status: "already_running" });

  if (!state.keywords_pool?.length)
    return NextResponse.json({ error: "Aucun mot-clé — relance /configure" }, { status: 422 });

  const keyword = state.keywords_pool[0];

  let runId: string | null = null;
  if (isApifyConfigured()) {
    try {
      runId = await startScrape(keyword, {
        maxResults: 25,
        countryCode: state.pays?.toLowerCase() === "cameroun" ? "cm" : undefined,
      });
    } catch (e) {
      await addLog(`Erreur scraping Apify : ${e instanceof Error ? e.message : "?"}`, "error");
    }
  }

  await updateState({
    status: "running",
    current_keyword: keyword,
    scrape_run_id: runId,
    keywords_pool: state.keywords_pool.slice(1),
    keywords_done: [...(state.keywords_done ?? []), keyword],
    started_at: new Date().toISOString(),
    last_batch_at: null,
  });

  await addLog(
    runId
      ? `Démarrage : "${keyword}" — scraping Apify lancé (run ${runId})`
      : `Démarrage : "${keyword}" — traitement des leads existants (Apify non configuré)`,
    "info"
  );

  return NextResponse.json({ ok: true, keyword, runId });
}
