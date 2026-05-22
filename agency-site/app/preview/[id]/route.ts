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

  const adminButton = `
<style>
  #mc-admin-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 99999;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(15,15,15,0.85);
    color: #fff;
    font-family: system-ui, sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-decoration: none;
    border-radius: 999px;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.12);
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    transition: background 0.2s, transform 0.15s;
  }
  #mc-admin-btn:hover { background: rgba(30,30,30,0.95); transform: translateY(-1px); }
  #mc-admin-btn svg { flex-shrink: 0; }
</style>
<a id="mc-admin-btn" href="/admin" target="_blank">
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
  Dashboard
</a>`;

  const html = data.landing_html.includes("</body>")
    ? data.landing_html.replace("</body>", `${adminButton}\n</body>`)
    : data.landing_html + adminButton;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
