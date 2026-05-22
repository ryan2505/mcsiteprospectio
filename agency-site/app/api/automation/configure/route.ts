import { NextResponse } from "next/server";
import { generateKeywords } from "@/lib/keywords";
import { updateState } from "@/lib/automation";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  if (!supabaseAdmin)
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const {
    serviceType,
    ville,
    pays = "Cameroun",
    calendlyUrl = "https://calendly.com/kountchouryan/30min",
    batchSize = 5,
  } = body as {
    serviceType?: string;
    ville?: string;
    pays?: string;
    calendlyUrl?: string;
    batchSize?: number;
  };

  if (!serviceType)
    return NextResponse.json({ error: "serviceType requis" }, { status: 422 });

  let keywords: string[] = [];
  try {
    keywords = await generateKeywords(serviceType, pays, ville);
  } catch {
    keywords = [`${serviceType} ${ville ?? pays}`];
  }

  await updateState({
    status: "idle",
    service_type: serviceType,
    ville: ville ?? null,
    pays,
    keywords_pool: keywords,
    keywords_done: [],
    current_keyword: null,
    scrape_run_id: null,
    calendly_url: calendlyUrl,
    batch_size: Math.min(Math.max(1, Math.floor(batchSize)), 50),
    leads_processed: 0,
    last_batch_at: null,
    started_at: null,
    log: [
      {
        ts: new Date().toISOString(),
        msg: `Configuration : "${serviceType}" à ${ville ?? pays} — ${keywords.length} mots-clés générés`,
        level: "info",
      },
    ],
  });

  return NextResponse.json({ ok: true, keywords });
}
