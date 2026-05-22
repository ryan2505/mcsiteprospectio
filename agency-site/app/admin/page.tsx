import { supabaseAdmin } from "@/lib/supabase";
import { SearchBar } from "@/components/admin/search-bar";
import { LeadsTable, type Lead } from "@/components/admin/leads-table";
import { MessageSquareText } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard prospection",
  robots: { index: false, follow: false },
};

async function getLeads(): Promise<{ leads: Lead[]; configured: boolean; errorMsg?: string }> {
  if (!supabaseAdmin) return { leads: [], configured: false };
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select(
      "id, nom, type_business, ville, adresse, telephone, email, facebook, instagram, linkedin, site_web, google_url, note_google, nb_avis, score_global, problemes, angle_pitch, landing_url, whatsapp_message, build_prompt, status, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return { leads: [], configured: true, errorMsg: error.message };
  return { leads: (data as Lead[]) ?? [], configured: true };
}

export default async function AdminPage() {
  const { leads, configured, errorMsg } = await getLeads();

  const yesterday = new Date(Date.now() - 24 * 3600_000).toISOString();
  const stats = {
    total: leads.length,
    audited: leads.filter((l) => l.score_global != null).length,
    messages: leads.filter((l) => l.whatsapp_message != null).length,
    messagesSent: leads.filter((l) =>
      ["envoyé", "répondu", "rdv", "client"].includes(l.status ?? "")
    ).length,
    nouveauxToday: leads.filter((l) => (l.created_at ?? "") > yesterday).length,
    prets: leads.filter(
      (l) => l.whatsapp_message != null && !["envoyé", "répondu", "rdv", "client"].includes(l.status ?? "")
    ).length,
  };

  return (
    <main className="min-h-screen bg-muted/20">
      <header className="border-b border-border bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
              M
            </div>
            <span className="font-bold">MCSite · Prospection</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/admin/automation"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              ⚡ Automatisation
            </a>
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Site public
            </a>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard de prospection</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Étape 1-2 du pipeline : recherche Google Maps + audit IA. Les
            étapes suivantes (landing, screenshots, message) viendront enrichir
            chaque lead.
          </p>
        </div>

        {!configured && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            ⚠️ Supabase n'est pas configuré. Renseigne{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> dans <code>.env.local</code>{" "}
            puis exécute <code>supabase/schema.sql</code>.
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            ⚠️ <strong>Erreur de base de données :</strong> {errorMsg}
            <br />
            <br />
            Assure-toi d'avoir exécuté la <strong>migration</strong> à la fin du fichier <code>supabase/schema.sql</code> pour ajouter les nouvelles colonnes (comme <code>build_prompt</code>, <code>facebook</code>, etc.).
          </div>
        )}

        {/* Leads ajoutés aujourd'hui — mise en avant */}
        {stats.nouveauxToday > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {stats.nouveauxToday}
            </span>
            <div className="text-sm">
              <span className="font-semibold">nouveau{stats.nouveauxToday > 1 ? "x" : ""} lead{stats.nouveauxToday > 1 ? "s" : ""}</span>
              {" "}ajouté{stats.nouveauxToday > 1 ? "s" : ""} ces dernières 24h
              {stats.prets > 0 && (
                <span className="ml-2 text-muted-foreground">·{" "}
                  <strong className="text-[#25D366]">{stats.prets}</strong> prêt{stats.prets > 1 ? "s" : ""} à envoyer
                </span>
              )}
            </div>
          </div>
        )}

        {/* Pipeline funnel */}
        <div className="mb-6 grid grid-cols-4 gap-3">
          {[
            { label: "Total leads", value: stats.total, color: "text-foreground" },
            { label: "Audités", value: stats.audited, color: "text-blue-600" },
            { label: "Messages prêts", value: stats.messages, color: "text-[#25D366]" },
            { label: "Envoyés", value: stats.messagesSent, color: "text-green-600" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card p-4 text-center"
            >
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Section connexion WhatsApp */}
        {(() => {
          const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
          const testMsg = encodeURIComponent("✅ Test de connexion WhatsApp depuis MCSite — tout fonctionne !");
          return (
            <div className="mb-6 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#1a9e4a]">
                    <MessageSquareText className="h-4 w-4" />
                    Connexion WhatsApp
                  </div>
                  {waNumber ? (
                    <p className="mt-1 text-sm text-foreground">
                      ✓ Numéro configuré :{" "}
                      <code className="rounded bg-muted px-1 font-mono">+{waNumber}</code>
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-amber-700">
                      ⚠️ Numéro non configuré — ajoute{" "}
                      <code className="rounded bg-amber-100 px-1 font-mono">NEXT_PUBLIC_WHATSAPP_NUMBER</code>{" "}
                      dans <code className="font-mono">.env.local</code>
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Clique sur "Ouvrir WhatsApp" dans chaque lead pour envoyer le message depuis ton téléphone.
                  </p>
                </div>
                {waNumber && (
                  <a
                    href={`https://wa.me/${waNumber}?text=${testMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ebe5d] transition-colors"
                  >
                    <MessageSquareText className="h-4 w-4" />
                    Tester ma connexion
                  </a>
                )}
              </div>
            </div>
          );
        })()}

        <div className="mb-6">
          <SearchBar />
        </div>

        <LeadsTable leads={leads} />
      </div>
    </main>
  );
}
