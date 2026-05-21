/**
 * Gestion de l'état de l'automatisation (lecture/écriture dans automation_state).
 */
import { supabaseAdmin } from "./supabase";

export type AutomationLog = {
  ts: string;
  msg: string;
  level: "info" | "ok" | "error";
};

export type AutomationState = {
  id: number;
  status: "idle" | "running" | "paused";
  service_type: string | null;
  ville: string | null;
  pays: string;
  keywords_pool: string[];
  keywords_done: string[];
  current_keyword: string | null;
  scrape_run_id: string | null;
  calendly_url: string;
  batch_size: number;
  leads_processed: number;
  last_batch_at: string | null;
  started_at: string | null;
  log: AutomationLog[];
};

export async function getState(): Promise<AutomationState | null> {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("automation_state")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return (data as AutomationState) ?? null;
}

export async function updateState(patch: Partial<AutomationState>): Promise<void> {
  if (!supabaseAdmin) return;
  await supabaseAdmin
    .from("automation_state")
    .upsert({ id: 1, ...patch }, { onConflict: "id" });
}

export async function addLog(
  msg: string,
  level: AutomationLog["level"] = "info"
): Promise<void> {
  if (!supabaseAdmin) return;
  const { data } = await supabaseAdmin
    .from("automation_state")
    .select("log")
    .eq("id", 1)
    .maybeSingle();
  const prev: AutomationLog[] = (data as { log: AutomationLog[] } | null)?.log ?? [];
  const entry: AutomationLog = { ts: new Date().toISOString(), msg, level };
  const log = [entry, ...prev].slice(0, 40);
  await supabaseAdmin.from("automation_state").update({ log }).eq("id", 1);
}
