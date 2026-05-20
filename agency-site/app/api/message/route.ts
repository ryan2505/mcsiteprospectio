import { NextResponse } from "next/server";
import { generateWhatsAppMessage, isAnthropicConfigured } from "@/lib/message";
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
      "id, nom, type_business, ville, note_google, nb_avis, score_global, angle_pitch"
    )
    .eq("id", leadId)
    .single();

  if (getErr || !lead) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }

  let message: string;
  try {
    message = await generateWhatsAppMessage(lead);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur de génération" },
      { status: 502 }
    );
  }

  const { error: updErr } = await supabaseAdmin
    .from("leads")
    .update({
      whatsapp_message: message,
      message_generated_at: new Date().toISOString(),
      status: "message_prêt",
    })
    .eq("id", leadId);

  if (updErr) {
    return NextResponse.json({ error: `Supabase: ${updErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message });
}
