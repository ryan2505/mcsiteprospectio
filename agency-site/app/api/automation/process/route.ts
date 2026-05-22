/**
 * Traite UN lead à la fois dans le pipeline complet :
 *   audit → hero (landing) + message (en parallèle) → screenshots (thum.io)
 *
 * Appelé en boucle par l'interface d'automatisation.
 * Renvoie : { status: "processed"|"scraping"|"batch_pause"|"done"|"error"|"idle", ... }
 */
import { NextResponse } from "next/server";
import { getState, updateState, addLog } from "@/lib/automation";
import { supabaseAdmin } from "@/lib/supabase";
import { auditSite } from "@/lib/audit";
import { generateLandingHtml } from "@/lib/landing";
import { generateWhatsAppMessage } from "@/lib/message";
import { getScrapeResults, startScrape, isApifyConfigured } from "@/lib/apify";
import type { ScrapedPlace } from "@/lib/apify";
import type { AuditResult } from "@/lib/audit";
import type { AutomationState } from "@/lib/automation";
import { normalizeWhatsApp } from "@/lib/phone";

export const runtime = "nodejs";
export const maxDuration = 60;

const BATCH_PAUSE_MS = 30 * 60 * 1000;

export async function POST() {
  const state = await getState();
  if (!state || state.status !== "running") {
    return NextResponse.json({ status: state?.status ?? "idle", skip: true });
  }

  const batchSize = state.batch_size ?? 5;

  // ── 1. Pause batch côté serveur (quand pas de scraping en cours) ────────────
  if (
    !state.scrape_run_id &&
    state.last_batch_at &&
    (state.leads_processed ?? 0) > 0 &&
    (state.leads_processed ?? 0) % batchSize === 0
  ) {
    const pauseUntil = new Date(state.last_batch_at).getTime() + BATCH_PAUSE_MS;
    if (Date.now() < pauseUntil) {
      return NextResponse.json({
        status: "batch_pause",
        resume_at: new Date(pauseUntil).toISOString(),
      });
    }
  }

  // ── 2. Vérifier le scraping Apify en cours ──────────────────────────────────
  if (state.scrape_run_id) {
    try {
      const result = await getScrapeResults(state.scrape_run_id);
      if (result.finished) {
        if (result.succeeded) {
          const inserted = await insertLeads(
            result.places,
            state.current_keyword,
            state.ville,
            state.pays
          );
          await updateState({ scrape_run_id: null });
          await addLog(
            `Scraping "${state.current_keyword}" terminé : ${inserted} nouveau(x) lead(s)`,
            "ok"
          );
        } else {
          await updateState({ scrape_run_id: null });
          await addLog(
            `Scraping "${state.current_keyword}" échoué (${result.status}) — on continue avec les leads existants`,
            "error"
          );
        }
      } else {
        return NextResponse.json({
          status: "scraping",
          runId: state.scrape_run_id,
          keyword: state.current_keyword,
        });
      }
    } catch (e) {
      await updateState({ scrape_run_id: null });
      await addLog(
        `Erreur vérification scraping : ${e instanceof Error ? e.message : "?"}`,
        "error"
      );
    }
  }

  // ── 3. Récupérer le prochain lead à traiter ─────────────────────────────────
  const { data: rows } = await supabaseAdmin!
    .from("leads")
    .select(
      "id, nom, type_business, ville, pays, telephone, site_web, note_google, nb_avis, audit_json, score_global, angle_pitch, problemes"
    )
    .is("score_global", null)
    .eq("status", "nouveau")
    .order("created_at", { ascending: true })
    .limit(1);

  const lead = rows?.[0] as {
    id: string;
    nom: string;
    type_business: string | null;
    ville: string | null;
    pays: string | null;
    telephone: string | null;
    site_web: string | null;
    note_google: number | null;
    nb_avis: number | null;
    audit_json: Record<string, unknown> | null;
    score_global: number | null;
    angle_pitch: string | null;
    problemes: string[] | null;
  } | undefined;

  // ── 4. Plus de leads → passer au mot-clé suivant ───────────────────────────
  if (!lead) {
    const nextKeyword = state.keywords_pool?.[0] ?? null;
    if (!nextKeyword) {
      await updateState({ status: "idle" });
      await addLog("Tous les mots-clés traités — automatisation terminée 🎉", "ok");
      return NextResponse.json({ status: "done" });
    }

    // Vérifie si ce keyword a déjà été scraped (leads existants en DB)
    const { count: existingForKeyword } = await supabaseAdmin!
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("keyword", nextKeyword);

    const alreadyScraped = (existingForKeyword ?? 0) > 0;

    let runId: string | null = null;
    if (!alreadyScraped && isApifyConfigured()) {
      try {
        runId = await startScrape(nextKeyword, {
          maxResults: 25,
          countryCode: state.pays?.toLowerCase() === "cameroun" ? "cm" : undefined,
        });
      } catch (e) {
        await addLog(
          `Erreur démarrage scraping "${nextKeyword}" : ${e instanceof Error ? e.message : "?"}`,
          "error"
        );
      }
    }

    await updateState({
      current_keyword: nextKeyword,
      scrape_run_id: runId,
      keywords_pool: state.keywords_pool.slice(1),
      keywords_done: [...(state.keywords_done ?? []), nextKeyword],
    });
    await addLog(
      alreadyScraped
        ? `"${nextKeyword}" déjà dans la base (${existingForKeyword} leads) — scraping ignoré`
        : runId
        ? `Nouveau mot-clé : "${nextKeyword}" — scraping lancé`
        : `Nouveau mot-clé : "${nextKeyword}" — traitement leads existants`,
      alreadyScraped ? "info" : "info"
    );
    return NextResponse.json({
      status: runId ? "scraping" : "processing",
      keyword: nextKeyword,
      runId,
    });
  }

  // ── 5. Traiter le lead : audit → hero + message (en parallèle) ─────────────
  const appUrl = (process.env.APP_URL ?? "").replace(/\/$/, "");
  const previewUrl = appUrl ? `${appUrl}/preview/${lead.id}` : null;

  try {
    await addLog(`Traitement de "${lead.nom}"…`, "info");

    // — Audit —
    let auditResult: Partial<AuditResult> = {};
    if (lead.site_web) {
      auditResult = await auditSite(lead.site_web);
      await supabaseAdmin!
        .from("leads")
        .update({
          audit_json: auditResult,
          score_global: auditResult.score_global,
          score_design: (auditResult as Record<string, unknown>).score_design,
          score_mobile: (auditResult as Record<string, unknown>).score_mobile,
          score_conversion: (auditResult as Record<string, unknown>).score_conversion,
          problemes: auditResult.problemes,
          angle_pitch: auditResult.angle_pitch,
          type_business: auditResult.type_business ?? lead.type_business,
          audited_at: new Date().toISOString(),
          status: "audité",
        })
        .eq("id", lead.id);
    }

    // — Hero + Message en parallèle (après l'audit qui fournit les données) —
    const landingParams = {
      nom: lead.nom,
      type_business: (auditResult.type_business ?? lead.type_business) as string | null,
      ville: lead.ville,
      pays: lead.pays,
      adresse: null,
      telephone: lead.telephone,
      note_google: lead.note_google,
      nb_avis: lead.nb_avis,
      angle_pitch: auditResult.angle_pitch ?? lead.angle_pitch ?? null,
      problemes: auditResult.problemes ?? lead.problemes ?? null,
      langue: auditResult.langue ?? null,
      couleurs: auditResult.couleurs ?? null,
      style: auditResult.style ?? null,
      ton: auditResult.ton ?? null,
    };

    const messageParams = {
      nom: lead.nom,
      type_business: (auditResult.type_business ?? lead.type_business) as string | null,
      ville: lead.ville,
      note_google: lead.note_google,
      nb_avis: lead.nb_avis,
      score_global: auditResult.score_global ?? lead.score_global ?? null,
      angle_pitch: auditResult.angle_pitch ?? lead.angle_pitch ?? null,
      problemes: auditResult.problemes ?? lead.problemes ?? null,
    };

    const comparisonUrl = appUrl ? `${appUrl}/compare/${lead.id}` : undefined;

    const [html, msg] = await Promise.all([
      generateLandingHtml(landingParams),
      generateWhatsAppMessage(messageParams, {
        previewUrl: previewUrl ?? undefined,
        calendlyUrl: state.calendly_url,
        comparisonUrl,
      }),
    ]);

    // — Mise à jour landing + screenshots —
    const landingPatch: Record<string, unknown> = {
      landing_html: html,
      landing_url: `/preview/${lead.id}`,
      landing_generated_at: new Date().toISOString(),
      status: "hero_prêt",
    };

    if (lead.site_web) {
      landingPatch.screenshot_before_url = `https://image.thum.io/get/width/1200/crop/700/noanimate/${lead.site_web}`;
    }
    if (appUrl) {
      landingPatch.screenshot_after_url = `https://image.thum.io/get/width/1200/noanimate/${appUrl}/preview/${lead.id}`;
      landingPatch.comparison_url = `https://image.thum.io/get/width/2400/noanimate/${appUrl}/compare/${lead.id}`;
    }

    await supabaseAdmin!.from("leads").update(landingPatch).eq("id", lead.id);

    // — Mise à jour message —
    await supabaseAdmin!
      .from("leads")
      .update({
        whatsapp_message: msg,
        message_generated_at: new Date().toISOString(),
        status: "message_prêt",
      })
      .eq("id", lead.id);

    const newCount = (state.leads_processed ?? 0) + 1;
    const batchComplete = newCount % batchSize === 0;

    const statePatch: Partial<AutomationState> = {
      leads_processed: newCount,
      last_batch_at: new Date().toISOString(),
    };

    // Pre-scrape le keyword suivant dès la fin du batch (si pas déjà scraped)
    if (batchComplete && isApifyConfigured() && (state.keywords_pool?.length ?? 0) > 0) {
      const nextKeyword = state.keywords_pool[0];
      const { count: preCount } = await supabaseAdmin!
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("keyword", nextKeyword);

      if ((preCount ?? 0) > 0) {
        await addLog(`Batch ${newCount} terminé — "${nextKeyword}" déjà scraped, ignoré`, "info");
      } else
      try {
        const runId = await startScrape(nextKeyword, {
          maxResults: 25,
          countryCode: state.pays?.toLowerCase() === "cameroun" ? "cm" : undefined,
        });
        statePatch.current_keyword = nextKeyword;
        statePatch.keywords_pool = state.keywords_pool.slice(1);
        statePatch.keywords_done = [...(state.keywords_done ?? []), nextKeyword];
        statePatch.scrape_run_id = runId;
        await addLog(
          `Batch ${newCount} terminé — pré-scraping "${nextKeyword}" lancé (pendant la pause)`,
          "info"
        );
      } catch (e) {
        await addLog(
          `Batch terminé — erreur pré-scraping : ${e instanceof Error ? e.message : "?"}`,
          "error"
        );
      }
    }

    await updateState(statePatch);
    await addLog(
      `✓ "${lead.nom}" — audit + hero + message prêts`,
      "ok",
      `/preview/${lead.id}`
    );

    return NextResponse.json({
      status: "processed",
      lead: { id: lead.id, nom: lead.nom },
      leads_processed: newCount,
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Erreur inconnue";
    await addLog(`✗ "${lead.nom}" : ${errMsg}`, "error");
    await supabaseAdmin!
      .from("leads")
      .update({ status: "erreur_auto" })
      .eq("id", lead.id);
    return NextResponse.json(
      { status: "error", error: errMsg, lead: { id: lead.id, nom: lead.nom } },
      { status: 500 }
    );
  }
}

// ── Normalisation d'URL pour la déduplication ────────────────────────────────
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname}`
      .toLowerCase()
      .replace(/\/$/, "");
  } catch {
    return url.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
  }
}

// ── Insertion de leads depuis Apify ──────────────────────────────────────────
async function insertLeads(
  places: ScrapedPlace[],
  keyword: string | null,
  ville: string | null,
  pays: string
): Promise<number> {
  if (!supabaseAdmin) return 0;

  // Filtrer : site web requis + numéro mobile WhatsApp valide
  const qualified = places.flatMap((p) => {
    if (!p.site_web) return [];
    const wa = normalizeWhatsApp(p.telephone, pays);
    if (!wa) return [];
    return [{ ...p, telephone: wa }];
  });
  if (!qualified.length) return 0;

  const { data: existing } = await supabaseAdmin.from("leads").select("site_web");
  const existingSites = new Set(
    (existing ?? [])
      .map((l: { site_web: string | null }) => l.site_web)
      .filter(Boolean)
      .map((s) => normalizeUrl(s!))
  );

  const newLeads = qualified
    .filter((p) => !existingSites.has(normalizeUrl(p.site_web!)))
    .map((p) => ({
      nom: p.nom,
      site_web: p.site_web,
      telephone: p.telephone,  // déjà normalisé E.164
      type_business: p.type_business,
      adresse: p.adresse,
      ville: ville,
      pays,
      note_google: p.note_google,
      nb_avis: p.nb_avis,
      email: p.email,
      facebook: p.facebook,
      instagram: p.instagram,
      linkedin: p.linkedin,
      google_url: p.google_url,
      keyword,
      status: "nouveau",
    }));

  if (newLeads.length > 0) {
    await supabaseAdmin.from("leads").insert(newLeads);
  }
  return newLeads.length;
}
