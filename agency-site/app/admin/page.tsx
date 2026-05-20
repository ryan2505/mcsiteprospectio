import { supabaseAdmin } from "@/lib/supabase";
import { SearchBar } from "@/components/admin/search-bar";
import { LeadsTable, type Lead } from "@/components/admin/leads-table";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard prospection",
  robots: { index: false, follow: false },
};

async function getLeads(): Promise<{ leads: Lead[]; configured: boolean }> {
  if (!supabaseAdmin) return { leads: [], configured: false };
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select(
      "id, nom, type_business, ville, adresse, telephone, email, facebook, instagram, linkedin, site_web, google_url, note_google, nb_avis, score_global, problemes, angle_pitch, landing_url, whatsapp_message, status"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return { leads: [], configured: true };
  return { leads: (data as Lead[]) ?? [], configured: true };
}

export default async function AdminPage() {
  const { leads, configured } = await getLeads();

  const stats = {
    total: leads.length,
    audited: leads.filter((l) => l.score_global != null).length,
    opportunities: leads.filter(
      (l) => l.score_global != null && l.score_global < 50
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
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Voir le site public
          </a>
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

        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: "Leads", value: stats.total },
            { label: "Audités", value: stats.audited },
            { label: "Opportunités (score < 50)", value: stats.opportunities },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card p-4 text-center"
            >
              <div className="text-2xl font-bold text-primary">{s.value}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <SearchBar />
        </div>

        <LeadsTable leads={leads} />
      </div>
    </main>
  );
}
