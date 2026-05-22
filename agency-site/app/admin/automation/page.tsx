"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Play,
  Pause,
  Settings2,
  Sparkles,
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw,
  Timer,
  Zap,
  ExternalLink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type LogEntry = { ts: string; msg: string; level: "info" | "ok" | "error"; url?: string };

type StatusData = {
  configured: boolean;
  status?: "idle" | "running" | "paused";
  service_type?: string | null;
  ville?: string | null;
  pays?: string;
  keywords_pool?: string[];
  keywords_done?: string[];
  current_keyword?: string | null;
  scrape_run_id?: string | null;
  calendly_url?: string;
  batch_size?: number;
  leads_processed?: number;
  last_batch_at?: string | null;
  started_at?: string | null;
  log?: LogEntry[];
  queue_count?: number;
  done_count?: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCountdown(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function fmtElapsed(ms: number): string {
  const m = Math.floor(ms / 60000);
  if (m < 1) return "< 1 min";
  return `${m} min`;
}

function LogIcon({ level }: { level: LogEntry["level"] }) {
  if (level === "ok") return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />;
  if (level === "error") return <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />;
  return <Info className="h-3.5 w-3.5 shrink-0 text-blue-400" />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  // Config form
  const [serviceType, setServiceType] = useState("");
  const [ville, setVille] = useState("");
  const [pays, setPays] = useState("Cameroun");
  const [calendlyUrl, setCalendlyUrl] = useState("https://calendly.com/kountchouryan/30min");
  const [batchSize, setBatchSize] = useState(5);

  // State from server
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [configuring, setConfiguring] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Scraping timer
  const scrapingStartRef = useRef<number | null>(null);
  const [scrapingTick, setScrapingTick] = useState(0);

  // Loop refs
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);
  const processOneRef = useRef<() => void>(() => {});

  // ── Fetch status ──────────────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/automation/status");
      const data: StatusData = await res.json();
      setStatusData(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // ── Scraping timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (statusData?.scrape_run_id) {
      if (!scrapingStartRef.current) scrapingStartRef.current = Date.now();
      const t = setInterval(() => setScrapingTick((n) => n + 1), 30_000);
      return () => clearInterval(t);
    } else {
      scrapingStartRef.current = null;
    }
  }, [statusData?.scrape_run_id]);

  // ── Loop control ──────────────────────────────────────────────────────────
  const stopLoop = useCallback(() => {
    if (intervalRef.current) clearTimeout(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    intervalRef.current = null;
    countdownRef.current = null;
    setCountdown(null);
  }, []);

  const processOne = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    const schedule = (delayMs: number) => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      intervalRef.current = delayMs === 0
        ? (setTimeout(() => processOneRef.current(), 0) as ReturnType<typeof setTimeout>)
        : setTimeout(() => processOneRef.current(), delayMs);
    };

    try {
      const res = await fetch("/api/automation/process", { method: "POST" });
      const data = await res.json();
      await fetchStatus();

      if (data.status === "done") {
        stopLoop();
        return;
      }

      if (data.status === "batch_pause") {
        stopLoop();
        const resumeAt = new Date(data.resume_at as string).getTime();
        const remaining = resumeAt - Date.now();
        if (remaining > 0) {
          setCountdown(remaining);
          countdownRef.current = setInterval(() => {
            const r = resumeAt - Date.now();
            if (r <= 0) {
              setCountdown(null);
              if (countdownRef.current) clearInterval(countdownRef.current);
              countdownRef.current = null;
              schedule(0);
            } else {
              setCountdown(r);
            }
          }, 1000);
        } else {
          schedule(0);
        }
        return;
      }

      if (data.status === "error") {
        setError(`Erreur sur un lead : ${(data as { error?: string }).error ?? "?"} — l'automatisation continue.`);
        setTimeout(() => setError(null), 8000);
      }

      // Adaptatif : 60s pendant scraping Apify, 4s pendant processing
      schedule(data.status === "scraping" ? 60_000 : 4_000);
    } catch {
      // Retry réseau après 10s
      schedule(10_000);
    } finally {
      processingRef.current = false;
    }
  }, [fetchStatus, stopLoop]);

  useEffect(() => {
    processOneRef.current = processOne;
  }, [processOne]);

  const startLoop = useCallback(() => {
    stopLoop();
    processOneRef.current();
  }, [stopLoop]);

  // ── Stop loop quand status n'est plus "running" ───────────────────────────
  useEffect(() => {
    if (!statusData) return;
    if (statusData.status !== "running") stopLoop();
  }, [statusData?.status, stopLoop]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pré-remplir le formulaire depuis l'état serveur ───────────────────────
  useEffect(() => {
    if (!statusData?.configured) return;
    if (statusData.service_type) setServiceType(statusData.service_type);
    if (statusData.ville) setVille(statusData.ville);
    if (statusData.pays) setPays(statusData.pays);
    if (statusData.calendly_url) setCalendlyUrl(statusData.calendly_url);
    if (statusData.batch_size) setBatchSize(statusData.batch_size);
  }, [statusData?.configured]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Configure ─────────────────────────────────────────────────────────────
  async function configure() {
    if (!serviceType.trim()) return;
    setConfiguring(true);
    setError(null);
    try {
      const res = await fetch("/api/automation/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceType, ville: ville || undefined, pays, calendlyUrl, batchSize }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Erreur");
      await fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setConfiguring(false);
    }
  }

  // ── Start / Pause ─────────────────────────────────────────────────────────
  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/automation/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Erreur");
      await fetchStatus();
      startLoop();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setStarting(false);
    }
  }

  async function handleStop() {
    setStopping(true);
    try {
      await fetch("/api/automation/stop", { method: "POST" });
      stopLoop();
      await fetchStatus();
    } finally {
      setStopping(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const s = statusData;
  const isRunning = s?.status === "running";
  const isPaused = s?.status === "paused";
  const isIdle = !s || s.status === "idle";
  const isConfigured = s?.configured && (s?.keywords_pool?.length ?? 0) > 0;
  const serverBatchSize = s?.batch_size ?? 5;
  const batchProgress = (s?.leads_processed ?? 0) % serverBatchSize;
  const keywordsDone = s?.keywords_done?.length ?? 0;
  const keywordsTotal = (s?.keywords_pool?.length ?? 0) + keywordsDone + (s?.current_keyword ? 1 : 0);
  const isScrapingActive = !!(isRunning && s?.scrape_run_id);
  const scrapingElapsed = scrapingStartRef.current
    ? fmtElapsed(Date.now() - scrapingStartRef.current)
    : null;
  void scrapingTick; // used to trigger re-renders for the timer

  return (
    <main className="min-h-screen bg-muted/20">
      <header className="border-b border-border bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
              M
            </div>
            <span className="font-bold">MCSite · Automatisation</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => fetchStatus()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Rafraîchir
            </Button>
            <a href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
              ← Dashboard
            </a>
          </div>
        </div>
      </header>

      <div className="container max-w-3xl py-8">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Zap className="h-6 w-6 text-primary" />
            Pipeline automatisé
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Du scraping Google Maps au message WhatsApp prêt à envoyer.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── STATUS BANNER ─────────────────────────────────────────────────── */}
        {s && s.status !== "idle" && (
          <div
            className={`mb-6 rounded-xl border p-4 ${
              isRunning && countdown === null
                ? "border-green-300 bg-green-50"
                : countdown !== null || isPaused
                ? "border-amber-300 bg-amber-50"
                : "border-border bg-card"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                {/* Titre de l'état */}
                <div className="flex items-center gap-2 font-semibold">
                  {isRunning && countdown === null && (
                    <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                  )}
                  {countdown !== null && (
                    <Timer className="h-4 w-4 text-amber-600" />
                  )}
                  {isPaused && countdown === null && (
                    <Pause className="h-4 w-4 text-amber-600" />
                  )}
                  {isRunning && countdown === null
                    ? isScrapingActive
                      ? "Scraping en cours…"
                      : "En cours…"
                    : countdown !== null
                    ? `Pause — prochain batch dans ${fmtCountdown(countdown)}`
                    : "En pause"}
                </div>

                {/* Infos contextuelles */}
                <div className="mt-1 text-sm text-muted-foreground">
                  Mot-clé :{" "}
                  <strong className="text-foreground">{s.current_keyword ?? "—"}</strong>
                  {" · "}
                  {s.leads_processed ?? 0} traités
                  {" · "}
                  {s.queue_count ?? 0} en attente
                </div>

                {/* Feedback Apify scraping */}
                {isScrapingActive && s.scrape_run_id && (
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                    Apify scraping
                    {scrapingElapsed && <span>depuis {scrapingElapsed}</span>}
                    <span className="font-mono text-muted-foreground/70">
                      #{s.scrape_run_id.slice(-6)}
                    </span>
                    <a
                      href={`https://console.apify.com/actors/runs/${s.scrape_run_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-primary hover:underline"
                    >
                      Console <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {/* Batch progress bar */}
                {isRunning && countdown === null && !isScrapingActive && (
                  <div className="mt-2">
                    <div className="mb-1 text-xs text-muted-foreground">
                      Batch :{" "}
                      {batchProgress === 0 && (s.leads_processed ?? 0) > 0
                        ? serverBatchSize
                        : batchProgress}
                      /{serverBatchSize}
                    </div>
                    <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{
                          width: `${
                            ((batchProgress === 0 && (s.leads_processed ?? 0) > 0
                              ? serverBatchSize
                              : batchProgress) /
                              serverBatchSize) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {isRunning ? (
                  <Button size="sm" variant="outline" onClick={handleStop} disabled={stopping}>
                    {stopping ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Pause className="h-3.5 w-3.5" />
                    )}
                    Pause
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleStart} disabled={starting}>
                    {starting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    Reprendre
                  </Button>
                )}
              </div>
            </div>

            {/* Keywords progress */}
            {keywordsTotal > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(s.keywords_done ?? []).map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 line-through"
                  >
                    {kw}
                  </span>
                ))}
                {s.current_keyword && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary ring-1 ring-primary/30">
                    ▶ {s.current_keyword}
                  </span>
                )}
                {(s.keywords_pool ?? []).map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CONFIGURATION ─────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <Settings2 className="h-4 w-4 text-primary" />
            Configuration
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Type de service *
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="ex: restaurant, hôtel, pharmacie…"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Pays
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="ex: Cameroun"
                value={pays}
                onChange={(e) => setPays(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Ville (optionnel)
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="ex: Douala, Yaoundé…"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Lien Calendly
              </label>
              <input
                type="url"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={calendlyUrl}
                onChange={(e) => setCalendlyUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Leads par batch (1–50)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={batchSize}
                onChange={(e) => setBatchSize(Math.min(50, Math.max(1, Number(e.target.value))))}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={configure} disabled={configuring || !serviceType.trim()}>
              {configuring ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {configuring ? "Génération des mots-clés…" : "Générer les mots-clés"}
            </Button>

            {isConfigured && !isRunning && (
              <Button
                variant="outline"
                onClick={handleStart}
                disabled={starting}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                {starting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Démarrer l&apos;automatisation
              </Button>
            )}
          </div>

          {/* Keywords list après configure (état idle) */}
          {s?.keywords_pool && s.keywords_pool.length > 0 && isIdle && (
            <div className="mt-4">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                {s.keywords_pool.length} mots-clés générés :
              </div>
              <div className="flex flex-wrap gap-1.5">
                {s.keywords_pool.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── STATS ─────────────────────────────────────────────────────────── */}
        {s && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Leads traités", value: s.leads_processed ?? 0, color: "text-green-600" },
              { label: "En attente", value: s.queue_count ?? 0, color: "text-primary" },
              { label: "Messages prêts", value: s.done_count ?? 0, color: "text-[#25D366]" },
            ].map((st) => (
              <div
                key={st.label}
                className="rounded-xl border border-border bg-card p-3 text-center"
              >
                <div className={`text-xl font-bold ${st.color}`}>{st.value}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{st.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── LOG ───────────────────────────────────────────────────────────── */}
        {s?.log && s.log.length > 0 && (
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Journal d&apos;exécution
            </div>
            <ul className="space-y-2">
              {s.log.slice(0, 15).map((entry, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <LogIcon level={entry.level} />
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {new Date(entry.ts).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <span
                    className={
                      entry.level === "error"
                        ? "text-red-700"
                        : entry.level === "ok"
                        ? "text-green-700"
                        : "text-foreground"
                    }
                  >
                    {entry.msg}
                  </span>
                  {entry.url && (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto shrink-0 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── NOTICE ────────────────────────────────────────────────────────── */}
        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          <strong>Comment ça marche :</strong> L&apos;automatisation traite{" "}
          <strong>{serverBatchSize} leads</strong> d&apos;affilée (configurable), puis attend{" "}
          <strong>30 minutes</strong> avant le prochain batch. Le scraping du mot-clé suivant
          est lancé en avance pendant la pause.
          <br />
          <br />
          <strong>La pause est enforced côté serveur</strong> — la page peut être fermée
          et rouverte sans perdre l&apos;état. Configurer <code>APP_URL</code> dans{" "}
          <code>.env.local</code> pour activer les screenshots.
        </div>
      </div>
    </main>
  );
}
