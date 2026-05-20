/**
 * Scraping Google Maps via Apify — mode ASYNCHRONE + contacts enrichis.
 *
 * Acteur par défaut : lukaskrivka/google-maps-with-contact-details
 *   → fait Google Maps PUIS visite chaque site pour extraire emails + réseaux
 *     sociaux (Facebook, Instagram, LinkedIn). Idéal pour la prospection
 *     multi-canal (WhatsApp + email + LinkedIn).
 *   Doc : https://apify.com/lukaskrivka/google-maps-with-contact-details
 *
 * Comme cet acteur visite les sites, il est plus lent : on lance le run
 * (startScrape) puis on suit son avancement (getScrapeResults) sans bloquer
 * une fonction serverless (pas de timeout 60s).
 *
 * Pour revenir à un scraping basique/rapide, change APIFY_ACTOR dans .env :
 *   APIFY_ACTOR=compass~crawler-google-places
 */

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID =
  process.env.APIFY_ACTOR ?? "lukaskrivka~google-maps-with-contact-details";

export type ScrapedPlace = {
  nom: string;
  type_business: string | null;
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
};

export type RunResult = {
  status: string; // READY | RUNNING | SUCCEEDED | FAILED | ABORTED | TIMED-OUT
  finished: boolean;
  succeeded: boolean;
  places: ScrapedPlace[];
};

export function isApifyConfigured(): boolean {
  return Boolean(APIFY_TOKEN);
}

/** Démarre un run Apify et renvoie son identifiant (non bloquant). */
export async function startScrape(
  keyword: string,
  opts: { maxResults?: number; language?: string; countryCode?: string } = {}
): Promise<string> {
  if (!APIFY_TOKEN) {
    throw new Error("APIFY_TOKEN manquant dans les variables d'environnement.");
  }
  const { maxResults = 25, language = "fr", countryCode } = opts;

  const input: Record<string, unknown> = {
    searchStringsArray: [keyword],
    maxCrawledPlacesPerSearch: maxResults,
    language,
    skipClosedPlaces: true,
  };
  if (countryCode) input.countryCode = countryCode;

  const res = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify (start) a renvoyé ${res.status} : ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as { data?: { id?: string } };
  const runId = json.data?.id;
  if (!runId) throw new Error("Apify n'a pas renvoyé d'identifiant de run.");
  return runId;
}

/** Vérifie l'état d'un run ; si terminé avec succès, renvoie les fiches. */
export async function getScrapeResults(runId: string): Promise<RunResult> {
  if (!APIFY_TOKEN) {
    throw new Error("APIFY_TOKEN manquant.");
  }

  const res = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify (status) a renvoyé ${res.status} : ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    data?: { status?: string; defaultDatasetId?: string };
  };
  const status = json.data?.status ?? "UNKNOWN";
  const finished = ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(status);
  const succeeded = status === "SUCCEEDED";

  let places: ScrapedPlace[] = [];
  if (succeeded && json.data?.defaultDatasetId) {
    places = await fetchDatasetItems(json.data.defaultDatasetId);
  }

  return { status, finished, succeeded, places };
}

async function fetchDatasetItems(datasetId: string): Promise<ScrapedPlace[]> {
  const res = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&clean=true&format=json`
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify (dataset) a renvoyé ${res.status} : ${text.slice(0, 200)}`);
  }
  const items = (await res.json()) as ApifyItem[];
  return items.filter((it) => it.title).map(mapItem);
}

/* ----------------------- mapping défensif ----------------------- */

type ApifyItem = {
  title?: string;
  categoryName?: string;
  address?: string;
  phone?: string;
  phoneUnformatted?: string;
  phones?: string[];
  website?: string;
  url?: string;
  totalScore?: number;
  reviewsCount?: number;
  // contacts enrichis (noms de champs variables selon l'acteur)
  email?: string;
  emails?: string[];
  facebooks?: string[];
  facebook?: string;
  instagrams?: string[];
  instagram?: string;
  linkedIns?: string[];
  linkedin?: string;
};

function first(arr?: string[], single?: string): string | null {
  if (Array.isArray(arr) && arr.length > 0 && arr[0]) return String(arr[0]).trim();
  if (single && String(single).trim()) return String(single).trim();
  return null;
}

function mapItem(it: ApifyItem): ScrapedPlace {
  return {
    nom: it.title!.trim(),
    type_business: it.categoryName ?? null,
    adresse: it.address ?? null,
    telephone: it.phoneUnformatted ?? it.phone ?? first(it.phones),
    email: first(it.emails, it.email),
    facebook: first(it.facebooks, it.facebook),
    instagram: first(it.instagrams, it.instagram),
    linkedin: first(it.linkedIns, it.linkedin),
    site_web: normalizeUrl(it.website),
    google_url: it.url ?? null,
    note_google: typeof it.totalScore === "number" ? it.totalScore : null,
    nb_avis: typeof it.reviewsCount === "number" ? it.reviewsCount : null,
  };
}

function normalizeUrl(u?: string | null): string | null {
  if (!u) return null;
  const trimmed = u.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}
