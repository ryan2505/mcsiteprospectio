import { supabaseAdmin } from "@/lib/supabase";
import { screenshotUrl } from "@/lib/screenshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Page publique de comparatif visuel AVANT / APRÈS pour un lead.
 * Sert à montrer (et screenshoter pour WhatsApp) la transformation.
 * URL : /compare/<id>
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!supabaseAdmin) {
    return html("<p>Service indisponible (Supabase non configuré).</p>", 503);
  }

  const { data: lead, error } = await supabaseAdmin
    .from("leads")
    .select("nom, site_web, score_global, angle_pitch, landing_url")
    .eq("id", id)
    .single();

  if (error || !lead) {
    return html("<p>Lead introuvable.</p>", 404);
  }

  // Origine absolue (pour que thum.io puisse atteindre /preview/<id>)
  const origin = new URL(req.url).origin;
  const beforeShot = lead.site_web ? screenshotUrl(lead.site_web) : "";
  const afterShot = screenshotUrl(`${origin}/preview/${id}`);

  const page = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Avant / Après — ${escapeHtml(lead.nom)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Inter,system-ui,sans-serif;background:#faf7f5;color:#1c1917;padding:24px}
  .wrap{max-width:1100px;margin:0 auto}
  h1{font-size:1.6rem;margin-bottom:4px}
  .sub{color:#78716c;margin-bottom:20px;font-size:.95rem}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
  @media(max-width:720px){.grid{grid-template-columns:1fr}}
  .card{background:#fff;border:1px solid #e7e5e4;border-radius:16px;overflow:hidden}
  .tag{padding:8px 14px;font-weight:700;font-size:.8rem;color:#fff}
  .before .tag{background:#dc2626}
  .after .tag{background:#16a34a}
  .shot{width:100%;display:block;background:#f5f5f4;min-height:280px;object-fit:cover;object-position:top}
  .note{font-size:.75rem;color:#78716c;padding:10px 14px}
  .pitch{background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px;margin-top:18px;font-size:.95rem}
  .score{display:inline-block;background:#f0fdf4;color:#166534;border-radius:999px;padding:3px 10px;font-weight:700;font-size:.8rem;margin-left:8px}
</style>
</head>
<body>
  <div class="wrap">
    <h1>${escapeHtml(lead.nom)}
      ${lead.score_global != null ? `<span class="score">Site actuel : ${lead.score_global}/100</span>` : ""}
    </h1>
    <p class="sub">Comparatif de votre site actuel et de la version proposée par MCSite.</p>
    <div class="grid">
      <div class="card before">
        <div class="tag">AVANT — votre site actuel</div>
        ${beforeShot ? `<img class="shot" src="${beforeShot}" alt="Site actuel" loading="lazy">` : `<div class="shot"></div>`}
        <div class="note">Source : ${escapeHtml(lead.site_web ?? "—")}</div>
      </div>
      <div class="card after">
        <div class="tag">APRÈS — proposition MCSite</div>
        ${lead.landing_url ? `<img class="shot" src="${afterShot}" alt="Nouvelle version" loading="lazy">` : `<div class="shot"></div><div class="note">Génère d'abord la landing pour voir l'aperçu "après".</div>`}
        <div class="note">Aperçu : ${origin}/preview/${id}</div>
      </div>
    </div>
    ${lead.angle_pitch ? `<div class="pitch">💡 ${escapeHtml(lead.angle_pitch)}</div>` : ""}
  </div>
</body>
</html>`;

  return html(page, 200);
}

function html(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
