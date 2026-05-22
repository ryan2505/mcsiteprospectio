"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Loader2,
  Sparkles,
  Star,
  MapPin,
  LayoutTemplate,
  Eye,
  Images,
  MessageSquareText,
  Copy,
  Check,
  Send,
  Mail,
  Facebook,
  Instagram,
  Linkedin,
  Download,
  Wand2,
  CheckCheck,
} from "lucide-react";

const TABS = [
  { key: "recents",   label: "Récents 24h" },
  { key: "a_traiter", label: "À traiter" },
  { key: "prets",     label: "Prêts à envoyer" },
  { key: "envoyes",   label: "Envoyés" },
  { key: "tous",      label: "Tous" },
] as const;
type Tab = typeof TABS[number]["key"];

const SENT_STATUSES = ["envoyé", "répondu", "rdv", "client"];
const RECENT_MS = 24 * 60 * 60 * 1000;

function isRecent(lead: Lead): boolean {
  if (!lead.created_at) return false;
  return Date.now() - new Date(lead.created_at).getTime() < RECENT_MS;
}

function isNew(lead: Lead): boolean {
  if (!lead.created_at) return false;
  return Date.now() - new Date(lead.created_at).getTime() < 4 * 3600_000;
}

function filterLeads(leads: Lead[], tab: Tab): Lead[] {
  switch (tab) {
    case "recents":   return leads.filter(isRecent);
    case "a_traiter": return leads.filter(
      (l) => l.whatsapp_message == null && !SENT_STATUSES.includes(l.status ?? "")
    );
    case "prets":     return leads.filter(
      (l) => l.whatsapp_message != null && !SENT_STATUSES.includes(l.status ?? "")
    );
    case "envoyes":   return leads.filter((l) => SENT_STATUSES.includes(l.status ?? ""));
    default:          return leads;
  }
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  return `il y a ${Math.floor(hrs / 24)}j`;
}

function PipelineIndicator({ lead }: { lead: Lead }) {
  const steps = [
    { done: true },
    { done: lead.score_global != null },
    { done: lead.landing_url != null },
    { done: lead.whatsapp_message != null },
    { done: SENT_STATUSES.includes(lead.status ?? "") },
  ];
  return (
    <div className="flex items-center gap-0.5" title="Scraped → Audité → Hero → Message → Envoyé">
      {steps.map((s, i) => (
        <div
          key={i}
          className={`h-1.5 w-5 rounded-full transition-colors ${
            s.done ? "bg-green-500" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

export type Lead = {
  id: string;
  nom: string;
  type_business: string | null;
  ville: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  site_web: string | null;
  google_url: string | null;
  note_google: number | null;
  nb_avis: number | null;
  score_global: number | null;
  problemes: string[] | null;
  angle_pitch: string | null;
  landing_url: string | null;
  whatsapp_message: string | null;
  build_prompt: string | null;
  status: string | null;
  created_at?: string | null;
};

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null)
    return <span className="text-xs text-muted-foreground">—</span>;
  const color =
    score < 50
      ? "bg-green-100 text-green-800"
      : score < 70
        ? "bg-amber-100 text-amber-800"
        : "bg-stone-100 text-stone-600";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${color}`}>
      {score}/100
    </span>
  );
}

function waDigits(phone: string | null): string {
  return (phone ?? "").replace(/[^\d]/g, "");
}

function slugify(s: string): string {
  const base = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "hero";
}

/** Charge html2canvas depuis un CDN, une seule fois. */
type Html2Canvas = (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
function loadHtml2Canvas(): Promise<Html2Canvas> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { html2canvas?: Html2Canvas };
    if (w.html2canvas) return resolve(w.html2canvas);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    s.onload = () => {
      if (w.html2canvas) resolve(w.html2canvas);
      else reject(new Error("html2canvas indisponible"));
    };
    s.onerror = () => reject(new Error("Chargement de html2canvas échoué (vérifie ta connexion)."));
    document.body.appendChild(s);
  });
}

/** Rend le hero (/preview/<id>) dans un iframe invisible et renvoie un dataURL PNG (hauteur complète). */
async function renderHeroDataUrl(leadId: string): Promise<string> {
  const h2c = await loadHtml2Canvas();
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.width = "1200";
  iframe.height = "900";
  iframe.src = `/preview/${leadId}`;
  document.body.appendChild(iframe);
  try {
    await new Promise<void>((resolve, reject) => {
      const to = setTimeout(() => reject(new Error("Chargement du hero trop long")), 20000);
      iframe.onload = () => {
        clearTimeout(to);
        resolve();
      };
    });
    await new Promise((r) => setTimeout(r, 2800)); // attendre les animations CSS
    const doc = iframe.contentDocument;
    if (!doc) throw new Error("Impossible d'accéder au rendu du hero.");

    // Mesurer la hauteur réelle du hero pour tout capturer
    const fullH = Math.max(
      doc.body.scrollHeight,
      doc.body.offsetHeight,
      doc.documentElement.scrollHeight,
      760
    );
    iframe.height = String(fullH);
    await new Promise((r) => setTimeout(r, 300)); // attendre le reflow

    const canvas = await h2c(doc.body, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      width: 1200,
      height: fullH,
      windowWidth: 1200,
      windowHeight: fullH,
      scale: 1.5,
    });
    return canvas.toDataURL("image/png");
  } finally {
    document.body.removeChild(iframe);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image non chargée"));
    img.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const ir = img.width / img.height;
  const r = w / h;
  let sw = img.width;
  let sh = img.height;
  let sx = 0;
  let sy = 0;
  if (ir > r) {
    sw = img.height * r;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / r;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/** Compose une image comparative AVANT/APRÈS et renvoie un dataURL PNG. */
function composeComparison(
  before: HTMLImageElement | null,
  after: HTMLImageElement,
  title: string
): string {
  const W = 1600;
  const H = 760;
  const pad = 24;
  const header = 70;
  const panelW = (W - pad * 3) / 2;
  const panelY = header + pad;
  const panelH = H - panelY - pad;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Fond
  ctx.fillStyle = "#faf7f5";
  ctx.fillRect(0, 0, W, H);

  // Titre
  ctx.fillStyle = "#1c1917";
  ctx.font = "bold 30px Inter, system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(title, pad, header / 2 + 6);

  const panels: Array<{ x: number; label: string; color: string; img: HTMLImageElement | null }> = [
    { x: pad, label: "AVANT", color: "#dc2626", img: before },
    { x: pad * 2 + panelW, label: "APRÈS", color: "#16a34a", img: after },
  ];

  for (const p of panels) {
    // Cadre
    ctx.fillStyle = "#e7e5e4";
    ctx.fillRect(p.x, panelY, panelW, panelH);
    // Image
    if (p.img) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(p.x, panelY, panelW, panelH);
      ctx.clip();
      drawCover(ctx, p.img, p.x, panelY, panelW, panelH);
      ctx.restore();
    } else {
      ctx.fillStyle = "#a8a29e";
      ctx.font = "16px Inter, sans-serif";
      ctx.fillText("Aperçu indisponible", p.x + 20, panelY + 30);
    }
    // Bandeau label
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, panelY, 130, 34);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillText(p.label, p.x + 16, panelY + 18);
  }

  return canvas.toDataURL("image/png");
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<{ id: string; action: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturingId, setCapturingId] = useState<string | null>(null);
  const [shots, setShots] = useState<Record<string, string>>({});
  const [comparingId, setComparingId] = useState<string | null>(null);
  const [comparisons, setComparisons] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("recents");

  const tabCounts = useMemo(() => ({
    recents:   leads.filter(isRecent).length,
    a_traiter: leads.filter(
      (l) => l.whatsapp_message == null && !SENT_STATUSES.includes(l.status ?? "")
    ).length,
    prets:     leads.filter(
      (l) => l.whatsapp_message != null && !SENT_STATUSES.includes(l.status ?? "")
    ).length,
    envoyes:   leads.filter((l) => SENT_STATUSES.includes(l.status ?? "")).length,
    tous:      leads.length,
  }), [leads]);

  const filteredLeads = useMemo(() => filterLeads(leads, activeTab), [leads, activeTab]);

  async function runAction(
    id: string,
    action: "audit" | "landing" | "message" | "buildprompt" | "mark-sent"
  ) {
    setBusy({ id, action });
    setError(null);
    try {
      const res = await fetch(`/api/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Erreur");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  async function copyMessage(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Impossible de copier (autorise le presse-papier).");
    }
  }

  // Capture du hero DANS le navigateur (fonctionne en local, sans service externe).
  async function captureHero(id: string) {
    setCapturingId(id);
    setError(null);
    try {
      const dataUrl = await renderHeroDataUrl(id);
      setShots((s) => ({ ...s, [id]: dataUrl }));
    } catch (e) {
      setError(
        (e instanceof Error ? e.message : "Erreur de capture") +
          " — réessaie, ou utilise « Voir le hero » puis Win+Shift+S."
      );
    } finally {
      setCapturingId(null);
    }
  }

  // Capture + téléchargement + ouverture WhatsApp en un clic.
  async function sendWithAttachment(l: Lead) {
    if (!l.whatsapp_message) return;
    setSendingId(l.id);
    setError(null);
    try {
      // Capture le comparatif si pas encore fait
      let dataUrl = comparisons[l.id];
      if (!dataUrl) {
        const afterUrl = shots[l.id] ?? (await renderHeroDataUrl(l.id));
        if (!shots[l.id]) setShots((s) => ({ ...s, [l.id]: afterUrl }));
        const afterImg = await loadImage(afterUrl);
        let beforeImg: HTMLImageElement | null = null;
        if (l.site_web) {
          try {
            beforeImg = await loadImage(`/api/shot?url=${encodeURIComponent(l.site_web)}&crop=700`);
          } catch { beforeImg = null; }
        }
        dataUrl = composeComparison(beforeImg, afterImg, l.nom);
        setComparisons((c) => ({ ...c, [l.id]: dataUrl }));
      }

      // Télécharger l'image automatiquement
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `avant-apres-${slugify(l.nom)}.png`;
      a.click();

      // Ouvrir WhatsApp après un court délai
      await new Promise((r) => setTimeout(r, 600));
      const wa = waDigits(l.telephone);
      const href = wa
        ? `https://wa.me/${wa}?text=${encodeURIComponent(l.whatsapp_message!)}`
        : `https://wa.me/?text=${encodeURIComponent(l.whatsapp_message!)}`;
      window.open(href, "_blank");
    } catch (e) {
      setError((e instanceof Error ? e.message : "Erreur") + " — réessaie.");
    } finally {
      setSendingId(null);
    }
  }

  // Capture du comparatif AVANT/APRÈS (avant via proxy /api/shot, après = hero).
  async function captureComparison(l: Lead) {
    setComparingId(l.id);
    setError(null);
    try {
      const afterUrl = shots[l.id] ?? (await renderHeroDataUrl(l.id));
      if (!shots[l.id]) setShots((s) => ({ ...s, [l.id]: afterUrl }));
      const afterImg = await loadImage(afterUrl);

      let beforeImg: HTMLImageElement | null = null;
      if (l.site_web) {
        try {
          // crop=700 → juste la hero section (above the fold) du site précédent
          beforeImg = await loadImage(`/api/shot?url=${encodeURIComponent(l.site_web)}&crop=700`);
        } catch {
          beforeImg = null; // panneau "avant" laissé vide si la capture échoue
        }
      }

      const composite = composeComparison(beforeImg, afterImg, l.nom);
      setComparisons((c) => ({ ...c, [l.id]: composite }));
    } catch (e) {
      setError(
        (e instanceof Error ? e.message : "Erreur de comparatif") +
          " — réessaie dans un instant."
      );
    } finally {
      setComparingId(null);
    }
  }

  const isBusy = (id: string, action: string) =>
    busy?.id === id && busy?.action === action;

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center text-muted-foreground">
        Aucun lead pour l&apos;instant. Lance une recherche ci-dessus pour
        commencer.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs de catégories */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {filteredLeads.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          Aucun lead dans cette catégorie.
        </div>
      )}

      <div className="grid gap-4">
        {filteredLeads.map((l) => {
          const wa = waDigits(l.telephone);
          const waHref = l.whatsapp_message
            ? `https://wa.me/${wa}?text=${encodeURIComponent(l.whatsapp_message)}`
            : `https://wa.me/${wa}`;
          const shot = shots[l.id];
          const comparison = comparisons[l.id];
          return (
            <div
              key={l.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              {/* En-tête */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{l.nom}</h3>
                    <ScoreBadge score={l.score_global} />
                    {isNew(l) && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                        NOUVEAU
                      </span>
                    )}
                    {l.status && !isNew(l) && (
                      <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                        {l.status}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    <PipelineIndicator lead={l} />
                    {l.created_at && (
                      <span className="text-xs text-muted-foreground">
                        {relativeTime(l.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {l.type_business && <span>{l.type_business}</span>}
                    {l.note_google != null && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {l.note_google} ({l.nb_avis ?? 0} avis)
                      </span>
                    )}
                    {l.adresse && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {l.adresse}
                      </span>
                    )}
                    {l.telephone && <span>📞 {l.telephone}</span>}
                  </div>

                  {/* Canaux de contact enrichis */}
                  {(l.email || l.facebook || l.instagram || l.linkedin) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {l.email && (
                        <a
                          href={`mailto:${l.email}`}
                          className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs hover:bg-accent"
                          title={l.email}
                        >
                          <Mail className="h-3 w-3" />
                          {l.email}
                        </a>
                      )}
                      {l.facebook && (
                        <a
                          href={l.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs hover:bg-accent"
                        >
                          <Facebook className="h-3 w-3" />
                          Facebook
                        </a>
                      )}
                      {l.instagram && (
                        <a
                          href={l.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs hover:bg-accent"
                        >
                          <Instagram className="h-3 w-3" />
                          Instagram
                        </a>
                      )}
                      {l.linkedin && (
                        <a
                          href={l.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs hover:bg-accent"
                        >
                          <Linkedin className="h-3 w-3" />
                          LinkedIn
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Insight audit */}
              {(l.angle_pitch || (l.problemes && l.problemes.length > 0)) && (
                <div className="mt-4 rounded-lg bg-muted/50 p-4">
                  {l.angle_pitch && (
                    <p className="text-sm font-medium">💡 {l.angle_pitch}</p>
                  )}
                  {l.problemes && l.problemes.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {l.problemes.map((p, i) => (
                        <li key={i}>• {p}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Visuel du hero à joindre au message (capture dans le navigateur) */}
              {l.landing_url && (
                <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Images className="h-4 w-4 text-primary" />
                    Visuel du nouveau hero (à joindre dans WhatsApp)
                  </div>

                  {shot && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={shot} alt={`Hero ${l.nom}`} className="w-full" />
                    </div>
                  )}
                  {comparison && (
                    <div className="mt-3">
                      <div className="mb-1 text-xs font-medium text-muted-foreground">
                        Comparatif avant / après
                      </div>
                      <div className="overflow-hidden rounded-lg border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={comparison} alt={`Comparatif ${l.nom}`} className="w-full" />
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => captureHero(l.id)}
                      disabled={capturingId === l.id || comparingId === l.id}
                    >
                      {capturingId === l.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Capture…
                        </>
                      ) : (
                        <>
                          <Images className="h-3.5 w-3.5" />
                          {shot ? "Recapturer hero" : "Capturer le hero"}
                        </>
                      )}
                    </Button>
                    {shot && (
                      <Button asChild size="sm" variant="outline">
                        <a href={shot} download={`hero-${slugify(l.nom)}.png`}>
                          <Download className="h-3.5 w-3.5" />
                          Télécharger hero
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => captureComparison(l)}
                      disabled={comparingId === l.id || capturingId === l.id}
                      title="Génère une image avant/après à envoyer sur WhatsApp"
                    >
                      {comparingId === l.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Comparatif…
                        </>
                      ) : (
                        <>
                          <Images className="h-3.5 w-3.5" />
                          {comparison ? "Recapturer comparatif" : "Capturer comparatif"}
                        </>
                      )}
                    </Button>
                    {comparison && (
                      <Button asChild size="sm" variant="outline">
                        <a href={comparison} download={`comparatif-${slugify(l.nom)}.png`}>
                          <Download className="h-3.5 w-3.5" />
                          Télécharger comparatif
                        </a>
                      </Button>
                    )}
                    <Button asChild size="sm" variant="ghost">
                      <a href={`/preview/${l.id}`} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-3.5 w-3.5" />
                        Voir le hero
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {/* Message WhatsApp généré */}
              {l.whatsapp_message && (
                <div className="mt-4 rounded-lg border border-[#25D366]/30 bg-[#25D366]/5 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#1ebe5d]">
                    <MessageSquareText className="h-4 w-4" />
                    Message WhatsApp prêt
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {l.whatsapp_message}
                  </p>

                  {/* Aperçu du comparatif si déjà capturé */}
                  {comparisons[l.id] && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-[#25D366]/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={comparisons[l.id]} alt={`Avant/après ${l.nom}`} className="w-full" />
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {/* Bouton principal : capture + téléchargement + WhatsApp */}
                    {l.landing_url && wa && (
                      <Button
                        size="sm"
                        onClick={() => sendWithAttachment(l)}
                        disabled={sendingId === l.id}
                        className="bg-[#25D366] text-white hover:bg-[#1ebe5d]"
                      >
                        {sendingId === l.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Préparation…
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            Envoyer avec pièce jointe
                          </>
                        )}
                      </Button>
                    )}

                    {/* Fallback : juste ouvrir WhatsApp sans image */}
                    {wa && !l.landing_url && (
                      <Button asChild size="sm" className="bg-[#25D366] text-white hover:bg-[#1ebe5d]">
                        <a href={waHref} target="_blank" rel="noopener noreferrer">
                          <Send className="h-3.5 w-3.5" />
                          Ouvrir WhatsApp
                        </a>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyMessage(l.id, l.whatsapp_message!)}
                    >
                      {copiedId === l.id ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copié
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copier le message
                        </>
                      )}
                    </Button>

                    {!SENT_STATUSES.includes(l.status ?? "") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runAction(l.id, "mark-sent")}
                        disabled={!!busy}
                      >
                        {isBusy(l.id, "mark-sent") ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCheck className="h-3.5 w-3.5" />
                        )}
                        Marquer envoyé
                      </Button>
                    )}
                  </div>

                  {sendingId === l.id && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      📥 L&apos;image AVANT/APRÈS va se télécharger automatiquement — attache-la dans WhatsApp avant d&apos;envoyer.
                    </p>
                  )}
                </div>
              )}

              {/* Barre d'actions */}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                {l.site_web && (
                  <Button asChild variant="ghost" size="sm">
                    <a href={l.site_web} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Site
                    </a>
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={() => runAction(l.id, "audit")}
                  disabled={!!busy}
                >
                  {isBusy(l.id, "audit") ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {l.score_global != null ? "Ré-auditer" : "Auditer"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runAction(l.id, "landing")}
                  disabled={!!busy}
                  title="Générer une hero section premium avec l'IA"
                >
                  {isBusy(l.id, "landing") ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LayoutTemplate className="h-3.5 w-3.5" />
                  )}
                  {l.landing_url ? "Régénérer hero" : "Générer hero"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runAction(l.id, "message")}
                  disabled={!!busy}
                  title="Générer le message WhatsApp personnalisé"
                >
                  {isBusy(l.id, "message") ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MessageSquareText className="h-3.5 w-3.5" />
                  )}
                  {l.whatsapp_message ? "Régénérer message" : "Message"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runAction(l.id, "buildprompt")}
                  disabled={!!busy}
                  title="Générer un prompt prêt pour V0/Lovable/Bolt"
                >
                  {isBusy(l.id, "buildprompt") ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="h-3.5 w-3.5" />
                  )}
                  {l.build_prompt ? "Régénérer prompt" : "Prompt de site"}
                </Button>
              </div>

              {/* Prompt de build (à coller dans V0 / Lovable / Bolt) */}
              {l.build_prompt && (
                <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <Wand2 className="h-4 w-4" />
                      Prompt optimisé (V0 / Lovable / Bolt)
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyMessage(l.id, l.build_prompt!)}
                    >
                      {copiedId === l.id ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copié
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copier le prompt
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-background p-3 text-xs leading-relaxed">
{l.build_prompt}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
