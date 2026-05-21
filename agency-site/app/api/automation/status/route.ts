import { NextResponse } from "next/server";
import { getState } from "@/lib/automation";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const state = await getState();
  if (!state) return NextResponse.json({ configured: false });

  // Count leads ready to process (nouveau + no score)
  const { count: queueCount } = await supabaseAdmin!
    .from("leads")
    .select("id", { count: "exact", head: true })
    .is("score_global", null)
    .eq("status", "nouveau");

  // Count leads fully processed (message_prêt)
  const { count: doneCount } = await supabaseAdmin!
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "message_prêt");

  return NextResponse.json({
    configured: true,
    ...state,
    queue_count: queueCount ?? 0,
    done_count: doneCount ?? 0,
  });
}
