import { NextResponse } from "next/server";
import { getState, updateState, addLog } from "@/lib/automation";
import { startScrape, isApifyConfigured } from "@/lib/apify";
import { supabaseAdmin } from "@/lib/supabase";

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

  // Vérifier s'il y a déjà des leads non traités en attente
  const { count: queueCount } = await supabaseAdmin!
    .from("leads")
    .select("id", { count: "exact", head: true })
    .is("score_global", null)
    .eq("status", "nouveau");

  const hasExistingQueue = (queueCount ?? 0) > 0;

  let runId: string | null = null;
  let keyword: string | null = null;

  if (hasExistingQueue) {
    // Des leads existent déjà → on les traite en priorité, pas de scraping
    await updateState({
      status: "running",
      current_keyword: null,
      scrape_run_id: null,
      started_at: new Date().toISOString(),
      last_batch_at: null,
    });
    await addLog(
      `${queueCount} lead(s) déjà en attente — traitement prioritaire avant tout nouveau scraping`,
      "info"
    );
  } else {
    // Aucun lead en attente → scraper le premier mot-clé
    keyword = state.keywords_pool[0];

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
  }

  return NextResponse.json({ ok: true, keyword, runId, queued: queueCount ?? 0 });
}
