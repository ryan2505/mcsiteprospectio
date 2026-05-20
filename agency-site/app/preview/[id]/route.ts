import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sert le HTML de la landing générée pour un lead.
 * URL publique (non protégée) : nécessaire pour les screenshots
 * et pour montrer la maquette au prospect.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!supabaseAdmin) {
    return new Response("Service indisponible (Supabase non configuré).", {
      status: 503,
    });
  }

  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("landing_html, nom")
    .eq("id", id)
    .single();

  if (error || !data?.landing_html) {
    return new Response(
      "<!DOCTYPE html><meta charset='utf-8'><body style='font-family:sans-serif;padding:40px'>Landing introuvable ou pas encore générée.</body>",
      { status: 404, headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }

  return new Response(data.landing_html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Pas d'indexation par les moteurs (maquette de démarchage).
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
