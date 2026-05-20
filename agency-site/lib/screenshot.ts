/**
 * Screenshots avant/après — approche low-cost MVP.
 *
 * On utilise thum.io : service de capture par simple URL, GRATUIT, sans clé API.
 *   https://image.thum.io/get/width/1000/https://exemple.com
 *
 * IMPORTANT : thum.io doit pouvoir ATTEINDRE l'URL cible publiquement.
 *  - "avant" (site du prospect) : public → fonctionne partout.
 *  - "après" (notre /preview/<id>) : ne fonctionne QU'UNE FOIS DÉPLOYÉ
 *    (thum.io ne peut pas voir http://localhost). En local, l'aperçu "après"
 *    ne s'affichera pas — c'est normal, ça marchera après le déploiement Vercel.
 *
 * Pour passer à une solution premium plus tard (ScreenshotOne, etc.),
 * il suffit de changer cette fonction.
 */
export function screenshotUrl(target: string, width = 1000): string {
  const clean = target.trim();
  return `https://image.thum.io/get/width/${width}/noanimate/${clean}`;
}
