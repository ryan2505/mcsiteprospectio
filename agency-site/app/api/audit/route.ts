import { NextResponse } from "next/server";
import { auditSite, isAnthropicConfigured } from "@/lib/audit";
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
    return NextResponse.json(
      { error: "Supabase non configuré." },
      { status: 503 }
    );
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

  // Récupère le lead
  const { data: lead, error: getErr } = await supabaseAdmin
    .from("leads")
    .select("id, site_web")
    .eq("id", leadId)
    .single();

  if (getErr || !lead) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }
  if (!lead.site_web) {
    return NextResponse.json(
      { error: "Ce lead n'a pas de site web à auditer." },
      { status: 422 }
    );
  }

  // Lance l'audit IA
  let audit;
  try {
    audit = await auditSite(lead.site_web);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur d'audit" },
      { status: 502 }
    );
  }

  // Stocke le résultat
  const { error: updErr } = await supabaseAdmin
    .from("leads")
    .update({
      audit_json: audit,
      score_global: audit.score_global,
      problemes: audit.problemes,
      angle_pitch: audit.angle_pitch,
      type_business: audit.type_business || undefined,
      audited_at: new Date().toISOString(),
      status: "audité",
    })
    .eq("id", leadId);

  if (updErr) {
    return NextResponse.json(
      { error: `Supabase: ${updErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, audit });
}
