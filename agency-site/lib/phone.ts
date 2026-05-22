/**
 * Normalisation et validation des numéros WhatsApp.
 * Renvoie un numéro E.164 (+237XXXXXXXXX) ou null si non-mobile / invalide.
 */

type CountryRule = {
  code: string;       // indicatif sans +
  len: number;        // longueur du numéro national (chiffres après l'indicatif)
  mobile: RegExp;     // préfixes mobiles (WhatsApp compatible)
};

const RULES: Record<string, CountryRule> = {
  "cameroun":        { code: "237", len: 9,  mobile: /^[67]/ },
  "côte d'ivoire":   { code: "225", len: 10, mobile: /^0[157]|^5[45]/ },
  "senegal":         { code: "221", len: 9,  mobile: /^7[05678]/ },
  "sénégal":         { code: "221", len: 9,  mobile: /^7[05678]/ },
  "gabon":           { code: "241", len: 8,  mobile: /^0[67]/ },
  "benin":           { code: "229", len: 8,  mobile: /^[69]/ },
  "bénin":           { code: "229", len: 8,  mobile: /^[69]/ },
  "rdc":             { code: "243", len: 9,  mobile: /^[89]/ },
  "congo":           { code: "242", len: 9,  mobile: /^0[56]/ },
  "togo":            { code: "228", len: 8,  mobile: /^9[01289]|^7/ },
  "mali":            { code: "223", len: 8,  mobile: /^[679]/ },
  "burkina faso":    { code: "226", len: 8,  mobile: /^[67]/ },
  "guinée":          { code: "224", len: 9,  mobile: /^6/ },
  "niger":           { code: "227", len: 8,  mobile: /^[79]/ },
  "madagascar":      { code: "261", len: 9,  mobile: /^3[234]/ },
};

/**
 * Normalise un numéro brut en E.164 et vérifie qu'il s'agit d'un mobile
 * (WhatsApp-compatible). Renvoie null sinon.
 *
 * @param raw   Numéro brut depuis Apify (ex: "+237 656 305 089", "00237656305089")
 * @param pays  Pays du scraping (ex: "Cameroun") — utilisé si l'indicatif est absent
 */
export function normalizeWhatsApp(raw: string | null, pays: string = "Cameroun"): string | null {
  if (!raw) return null;

  // Garder uniquement les chiffres
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7) return null;

  let rule: CountryRule | null = null;
  let national: string | null = null;

  // ── 1. Détecter l'indicatif depuis le numéro lui-même ──────────────────────
  for (const r of Object.values(RULES)) {
    // Avec préfixe 00 (ex: 00237656305089)
    if (digits.startsWith("00" + r.code) && digits.length === 2 + r.code.length + r.len) {
      rule = r;
      national = digits.slice(2 + r.code.length);
      break;
    }
    // Avec indicatif direct (ex: 237656305089)
    if (digits.startsWith(r.code) && digits.length === r.code.length + r.len) {
      rule = r;
      national = digits.slice(r.code.length);
      break;
    }
  }

  // ── 2. Pas d'indicatif détecté → utiliser le pays du scraping ─────────────
  if (!national) {
    const key = pays.toLowerCase().trim();
    rule = RULES[key] ?? RULES["cameroun"];

    let local = digits;
    // Supprimer le 0 local initial (ex: 0656305089 → 656305089)
    if (local.startsWith("0") && local.length === rule.len + 1) {
      local = local.slice(1);
    }
    if (local.length === rule.len) {
      national = local;
    }
  }

  if (!rule || !national || national.length !== rule.len) return null;

  // ── 3. Vérifier que c'est un mobile (WhatsApp compatible) ─────────────────
  if (!rule.mobile.test(national)) return null;

  return `+${rule.code}${national}`;
}
