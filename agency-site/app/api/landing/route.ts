import { NextResponse } from "next/server";
import { generateLandingHtml, isAnthropicConfigured } from "@/lib/landing";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!isAnthropicConfigured()) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configuré." },
      { status: 503 }
    );
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase non configuré." }, { status: 503 });
  }

  let leadId = "";
  try {
    const body = await req.json();
    leadId = String(body.leadId ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  if (!leadId) {
    return NextResponse.json({ error: "leadId requis" }, { status: 422 });
  }

  const { data: lead, error: getErr } = await supabaseAdmin
    .from("leads")
    .select(
      "id, nom, type_business, ville, pays, adresse, telephone, note_google, nb_avis, angle_pitch, problemes"
    )
    .eq("id", leadId)
    .single();

  if (getErr || !lead) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }

  let html: string;
  try {
    html = await generateLandingHtml(lead);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur de génération" },
      { status: 502 }
    );
  }

  const landingUrl = `/preview/${leadId}`;
  const { error: updErr } = await supabaseAdmin
    .from("leads")
    .update({
      landing_html: html,
      landing_url: landingUrl,
      landing_generated_at: new Date().toISOString(),
      status: "hero_prêt",
    })
    .eq("id", leadId);

  if (updErr) {
    return NextResponse.json({ error: `Supabase: ${updErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, landing_url: landingUrl });
}
