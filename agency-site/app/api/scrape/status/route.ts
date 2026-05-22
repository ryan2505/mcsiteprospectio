import { NextResponse } from "next/server";
import { getScrapeResults, isApifyConfigured } from "@/lib/apify";
import { supabaseAdmin } from "@/lib/supabase";
import { normalizeWhatsApp } from "@/lib/phone";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Suit l'avancement d'un run Apify.
 * - Tant que le run tourne : renvoie { finished: false, status }.
 * - Quand il a réussi : insère les nouveaux leads et renvoie le bilan.
 */
export async function POST(req: Request) {
  if (!isApifyConfigured()) {
    return NextResponse.json({ error: "APIFY_TOKEN non configuré." }, { status: 503 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase non configuré." }, { status: 503 });
  }

  let runId = "";
  let keyword = "";
  let ville = "";
  let pays = "";
  try {
    const body = await req.json();
    runId = String(body.runId ?? "").trim();
    keyword = String(body.keyword ?? "").trim().slice(0, 120);
    ville = String(body.ville ?? "").trim().slice(0, 80);
    pays = String(body.pays ?? "").trim().slice(0, 80);
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  if (!runId) {
    return NextResponse.json({ error: "runId requis" }, { status: 422 });
  }

  let result;
  try {
    result = await getScrapeResults(runId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur de suivi" },
      { status: 502 }
    );
  }

  // Pas encore fini → on renvoie juste l'état (le front continue à interroger).
  if (!result.finished) {
    return NextResponse.json({ ok: true, finished: false, status: result.status });
  }

  if (!result.succeeded) {
    return NextResponse.json(
      { ok: false, finished: true, status: result.status, error: `Run ${result.status}` },
      { status: 502 }
    );
  }

  // Run réussi : normaliser les numéros WhatsApp, dédupliquer et insérer.
  // On ne garde que les leads avec site web + numéro mobile valide.
  const qualified = result.places.flatMap((p) => {
    if (!p.site_web) return [];
    const wa = normalizeWhatsApp(p.telephone, pays || "Cameroun");
    if (!wa) return [];
    return [{ ...p, telephone: wa }];
  });

  const seen = new Set<string>();
  const uniques = qualified.filter((p) => {
    if (seen.has(p.site_web!)) return false;
    seen.add(p.site_web!);
    return true;
  });

  const candidateSites = uniques.map((p) => p.site_web!);
  let inserted = 0;

  if (candidateSites.length > 0) {
    const { data: existing, error: exErr } = await supabaseAdmin
      .from("leads")
      .select("site_web")
      .in("site_web", candidateSites);

    if (exErr) {
      return NextResponse.json({ error: `Supabase: ${exErr.message}` }, { status: 500 });
    }

    const existingSet = new Set((existing ?? []).map((e) => e.site_web));
    const toInsert = uniques
      .filter((p) => !existingSet.has(p.site_web))
      .map((p) => ({
        keyword,
        ville: ville || null,
        pays: pays || null,
        nom: p.nom,
        type_business: p.type_business,
        adresse: p.adresse,
        telephone: p.telephone,  // déjà normalisé E.164
        email: p.email,
        facebook: p.facebook,
        instagram: p.instagram,
        linkedin: p.linkedin,
        site_web: p.site_web,
        google_url: p.google_url,
        note_google: p.note_google,
        nb_avis: p.nb_avis,
        status: "nouveau",
      }));

    if (toInsert.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("leads")
        .insert(toInsert)
        .select("id");
      if (error) {
        return NextResponse.json({ error: `Supabase: ${error.message}` }, { status: 500 });
      }
      inserted = data?.length ?? 0;
    }
  }

  return NextResponse.json({
    ok: true,
    finished: true,
    status: result.status,
    scraped: result.places.length,
    with_site: qualified.length,
    inserted,
  });
}
