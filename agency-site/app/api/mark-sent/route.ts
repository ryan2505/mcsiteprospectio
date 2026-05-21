import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
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

  const { error } = await supabaseAdmin
    .from("leads")
    .update({
      status: "envoyé",
      envoye_le: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) {
    return NextResponse.json({ error: `Supabase: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
