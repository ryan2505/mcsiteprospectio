import { NextRequest, NextResponse } from "next/server";

/**
 * Protege /admin et les API du moteur de prospection par Basic Auth.
 * Definis ADMIN_USER et ADMIN_PASSWORD dans tes variables d'environnement.
 * Si ADMIN_PASSWORD n'est pas defini, l'acces est laisse ouvert (dev local).
 */
export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER ?? "admin";
  const pass = process.env.ADMIN_PASSWORD;

  // Pas de mot de passe configure -> on ne bloque pas (utile en dev).
  if (!pass) return NextResponse.next();

  const auth = req.headers.get("authorization");
  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString();
      const idx = decoded.indexOf(":");
      const u = decoded.slice(0, idx);
      const p = decoded.slice(idx + 1);
      if (u === user && p === pass) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Authentification requise", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="MCSite Admin"' },
  });
}

// /preview/* et /compare/* restent PUBLICS (le prospect doit pouvoir les voir).
export const config = {
  matcher: [
    "/admin/:path*",
    "/api/scrape/:path*",
    "/api/audit/:path*",
    "/api/landing/:path*",
    "/api/message/:path*",
  ],
};
