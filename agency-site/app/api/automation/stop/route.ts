import { NextResponse } from "next/server";
import { getState, updateState, addLog } from "@/lib/automation";

export const runtime = "nodejs";

export async function POST() {
  const state = await getState();
  if (!state) return NextResponse.json({ error: "Non configuré" }, { status: 503 });

  await updateState({ status: "paused" });
  await addLog("Automatisation mise en pause", "info");

  return NextResponse.json({ ok: true, status: "paused" });
}
