import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type ContactPayload = {
  name?: string;
  phone?: string;
  business?: string;
  message?: string;
};

function clean(v: unknown, max: number): string {
  return String(v ?? "").trim().slice(0, max);
}

export async function POST(req: Request) {
  let body: ContactPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const name = clean(body.name, 80);
  const phone = clean(body.phone, 30);
  const business = clean(body.business, 120);
  const message = clean(body.message, 1000);

  // Validation minimale
  if (name.length < 2 || phone.length < 6 || business.length < 2) {
    return NextResponse.json(
      { error: "Merci de remplir nom, WhatsApp et établissement." },
      { status: 422 }
    );
  }

  // Si Supabase n'est pas configuré, on log au lieu de planter (utile en dev)
  if (!supabaseAdmin) {
    console.warn("[contact] SUPABASE_SERVICE_ROLE_KEY manquante — lead non sauvegardé:", {
      name,
      phone,
      business,
      message,
    });
    return NextResponse.json({ ok: true, stored: false });
  }

  const { error } = await supabaseAdmin.from("inbound_leads").insert({
    name,
    phone,
    business,
    message,
    source: "site_marketing",
    status: "nouveau",
  });

  if (error) {
    console.error("[contact] Supabase insert error:", error.message);
    return NextResponse.json(
      { error: "Impossible d'enregistrer pour le moment. Réessayez ou écrivez-nous sur WhatsApp." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, stored: true });
}
