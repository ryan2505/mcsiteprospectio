"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { screenshotUrl } from "@/lib/screenshot";
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
} from "lucide-react";

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
  status: string | null;
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

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<{ id: string; action: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  // Origine absolue (pour générer l'URL du screenshot du hero via thum.io).
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function runAction(id: string, action: "audit" | "landing" | "message") {
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
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid gap-4">
        {leads.map((l) => {
          const wa = waDigits(l.telephone);
          const waHref = l.whatsapp_message
            ? `https://wa.me/${wa}?text=${encodeURIComponent(l.whatsapp_message)}`
            : `https://wa.me/${wa}`;
          // Screenshot du hero (visible une fois l'app déployée : thum.io ne voit pas localhost)
          const heroShot =
            l.landing_url && origin
              ? screenshotUrl(`${origin}/preview/${l.id}`, 1000)
              : "";
          return (
            <div
              key={l.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              {/* En-tête */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{l.nom}</h3>
                    <ScoreBadge score={l.score_global} />
                    {l.status && (
                      <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                        {l.status}
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

              {/* Visuel du hero à joindre au message */}
              {l.landing_url && (
                <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Images className="h-4 w-4 text-primary" />
                    Visuel du nouveau hero (à joindre dans WhatsApp)
                  </div>
                  {heroShot ? (
                    <a
                      href={heroShot}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block overflow-hidden rounded-lg border border-border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroShot}
                        alt={`Aperçu hero ${l.nom}`}
                        className="w-full"
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      L&apos;aperçu s&apos;affichera une fois l&apos;app déployée
                      (le service de capture ne voit pas localhost).
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {heroShot && (
                      <Button asChild size="sm" variant="outline">
                        <a href={heroShot} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-3.5 w-3.5" />
                          Télécharger le visuel
                        </a>
                      </Button>
                    )}
                    <Button asChild size="sm" variant="ghost">
                      <a href={`/preview/${l.id}`} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-3.5 w-3.5" />
                        Voir le hero
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <a href={`/compare/${l.id}`} target="_blank" rel="noopener noreferrer">
                        <Images className="h-3.5 w-3.5" />
                        Comparatif avant/après
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
                  {l.landing_url && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      📎 Pense à joindre le visuel du hero (ci-dessus) dans
                      WhatsApp avant d&apos;envoyer.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
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
                          Copier
                        </>
                      )}
                    </Button>
                    {wa && (
                      <Button asChild size="sm" variant="whatsapp">
                        <a href={waHref} target="_blank" rel="noopener noreferrer">
                          <Send className="h-3.5 w-3.5" />
                          Ouvrir WhatsApp
                        </a>
                      </Button>
                    )}
                  </div>
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
