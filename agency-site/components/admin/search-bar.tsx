"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

const POLL_INTERVAL = 4000; // 4s
const MAX_POLLS = 60; // ~4 min max

export function SearchBar() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [countryCode, setCountryCode] = useState("cm");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function statusLabel(status: string): string {
    switch (status) {
      case "READY":
      case "RUNNING":
        return "Scraping en cours (Google Maps + extraction des contacts)…";
      default:
        return `Statut : ${status}`;
    }
  }

  async function pollStatus(runId: string, attempt: number): Promise<void> {
    if (attempt > MAX_POLLS) {
      setLoading(false);
      setErr("Le scraping prend trop de temps. Réessaie dans un instant.");
      return;
    }
    try {
      const res = await fetch("/api/scrape/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, keyword, pays: countryLabel(countryCode) }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Erreur de suivi");

      if (!j.finished) {
        setProgress(statusLabel(j.status));
        timer.current = setTimeout(() => pollStatus(runId, attempt + 1), POLL_INTERVAL);
        return;
      }

      // Terminé
      setLoading(false);
      setProgress(null);
      setMsg(
        `${j.scraped} fiches trouvées · ${j.with_site} avec site · ${j.inserted} nouvelles ajoutées.`
      );
      router.refresh();
    } catch (e) {
      setLoading(false);
      setProgress(null);
      setErr(e instanceof Error ? e.message : "Erreur de suivi");
    }
  }

  async function launch() {
    if (keyword.trim().length < 3) {
      setErr("Entre un mot-clé (ex: 'restaurant Douala').");
      return;
    }
    setLoading(true);
    setErr(null);
    setMsg(null);
    setProgress("Démarrage du scraping…");
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, countryCode, maxResults: 25 }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Erreur");
      pollStatus(j.runId, 0);
    } catch (e) {
      setLoading(false);
      setProgress(null);
      setErr(e instanceof Error ? e.message : "Erreur inconnue");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium">
            Mot-clé Google Maps
          </label>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="restaurant Douala"
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && !loading && launch()}
          />
        </div>
        <div className="w-full sm:w-36">
          <label className="mb-1.5 block text-sm font-medium">Pays</label>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            disabled={loading}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="cm">Cameroun</option>
            <option value="ci">Côte d'Ivoire</option>
            <option value="sn">Sénégal</option>
            <option value="cd">RDC</option>
            <option value="ga">Gabon</option>
            <option value="bj">Bénin</option>
            <option value="">— Tous —</option>
          </select>
        </div>
        <Button onClick={launch} disabled={loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Recherche…
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Lancer
            </>
          )}
        </Button>
      </div>
      {progress && <p className="mt-3 text-sm text-muted-foreground">{progress}</p>}
      {msg && <p className="mt-3 text-sm text-green-700">{msg}</p>}
      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
    </div>
  );
}

function countryLabel(code: string): string {
  const map: Record<string, string> = {
    cm: "Cameroun",
    ci: "Côte d'Ivoire",
    sn: "Sénégal",
    cd: "RDC",
    ga: "Gabon",
    bj: "Bénin",
  };
  return map[code] ?? "";
}
