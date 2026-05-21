import { screenshotUrl } from "@/lib/screenshot";

export const runtime = "nodejs";

/**
 * Proxy de screenshot : prend l'URL d'un site, récupère sa capture via thum.io
 * et la renvoie depuis NOTRE origine. Objectif : pouvoir dessiner l'image
 * "avant" sur un <canvas> côté client sans le "tainter" (problème CORS).
 *
 * Usage : /api/shot?url=https://site-du-prospect.com
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("url");

  if (!target || !/^https?:\/\//i.test(target)) {
    return new Response("Paramètre 'url' invalide", { status: 400 });
  }

  try {
    const cropParam = searchParams.get("crop");
    const cropHeight = cropParam ? parseInt(cropParam, 10) : undefined;
    const shotUrl = screenshotUrl(target, 1200, cropHeight);
    const upstream = await fetch(shotUrl, {
      // thum.io peut être lent au premier appel
      signal: AbortSignal.timeout(25000),
    });
    if (!upstream.ok) {
      return new Response("Capture indisponible", { status: 502 });
    }
    const buf = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    return new Response(buf, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Erreur de capture", { status: 502 });
  }
}
