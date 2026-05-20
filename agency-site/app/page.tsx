import Link from "next/link";
import {
  Check,
  Clock,
  Smartphone,
  Search,
  TrendingUp,
  MessageCircle,
  Star,
  ArrowRight,
  Sparkles,
  Zap,
  Globe2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ContactForm } from "@/components/contact-form";

const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "237600000000";
const waLink = (msg = "Bonjour, je veux refaire mon site web") =>
  `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <SocialProof />
      <ForWho />
      <Problem />
      <Solution />
      <Process />
      <Showcase />
      <Pricing />
      <Testimonials />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}

/* ------------------- HEADER ------------------- */
function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            M
          </div>
          <span className="text-lg font-bold tracking-tight">MCSite</span>
        </Link>
        <nav className="hidden gap-8 text-sm font-medium md:flex">
          <a href="#process" className="hover:text-primary transition-colors">
            Process
          </a>
          <a href="#showcase" className="hover:text-primary transition-colors">
            Réalisations
          </a>
          <a href="#pricing" className="hover:text-primary transition-colors">
            Tarifs
          </a>
          <a href="#faq" className="hover:text-primary transition-colors">
            FAQ
          </a>
        </nav>
        <Button asChild variant="whatsapp" size="sm">
          <a href={waLink()} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </Button>
      </div>
    </header>
  );
}

/* ------------------- HERO ------------------- */
function Hero() {
  return (
    <section className="bg-hero-gradient relative overflow-hidden">
      <div className="container py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Refonte de sites en 7 jours · Afrique francophone
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Votre site web vous fait perdre des clients.{" "}
            <span className="text-primary">On le refait en 7 jours.</span>
          </h1>
          <p className="mt-6 text-pretty text-lg text-muted-foreground sm:text-xl">
            Restaurants, hôtels, salons : on transforme votre vieux site en
            machine à réservations WhatsApp. Sans jargon, sans frais cachés,
            sans attendre 3 mois.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="whatsapp" size="xl">
              <a
                href={waLink(
                  "Bonjour, je veux refaire le site de mon établissement. Pouvez-vous me montrer ce que vous proposez ?"
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-5 w-5" />
                Démarrer sur WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" size="xl">
              <a href="#showcase">
                Voir des exemples
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Sans engagement · Devis gratuit · Maquette offerte en 24h
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------- SOCIAL PROOF ------------------- */
function SocialProof() {
  return (
    <section className="border-y border-border bg-muted/30 py-10">
      <div className="container">
        <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {[
            { value: "7j", label: "Délai de livraison" },
            { value: "100%", label: "Optimisé mobile" },
            { value: "< 2s", label: "Temps de chargement" },
            { value: "0€", label: "Frais cachés" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-primary md:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------- FOR WHO ------------------- */
function ForWho() {
  const targets = [
    {
      icon: "🍽️",
      title: "Restaurants & Lounges",
      desc: "Menu en ligne, réservations WhatsApp, galerie pro, intégration Google Maps.",
    },
    {
      icon: "🏨",
      title: "Hôtels & Maisons d'hôtes",
      desc: "Galerie chambres, demande de réservation, témoignages clients, multilingue.",
    },
    {
      icon: "💇",
      title: "Salons & Services locaux",
      desc: "Prise de rendez-vous WhatsApp, prix clairs, avis Google, équipe & horaires.",
    },
  ];
  return (
    <section className="py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Conçu pour les commerces qui vivent du local
          </h2>
          <p className="mt-4 text-muted-foreground">
            Pas de templates génériques. Chaque site est pensé pour transformer
            un visiteur en client en moins d'une minute.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {targets.map((t) => (
            <div
              key={t.title}
              className="group rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/40 hover:shadow-lg"
            >
              <div className="text-4xl">{t.icon}</div>
              <h3 className="mt-4 text-xl font-bold">{t.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------- PROBLEM ------------------- */
function Problem() {
  const pains = [
    {
      icon: Smartphone,
      title: "Site illisible sur mobile",
      desc: "90% de vos clients sont sur mobile. Un site mal adapté = clients perdus.",
    },
    {
      icon: Clock,
      title: "Chargement lent",
      desc: "Au-delà de 3 secondes, plus de la moitié des visiteurs partent.",
    },
    {
      icon: Search,
      title: "Invisible sur Google",
      desc: "Sans SEO local, vos concurrents qui ont refait leur site captent vos clients.",
    },
    {
      icon: TrendingUp,
      title: "Zéro réservation directe",
      desc: "Sans CTA WhatsApp visible, vos visiteurs partent sans laisser de trace.",
    },
  ];
  return (
    <section className="bg-muted/40 py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Le constat
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Pourquoi votre site actuel ne convertit pas
          </h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pains.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-border bg-background p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold">{p.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------- SOLUTION ------------------- */
function Solution() {
  const benefits = [
    "Design moderne adapté à votre identité (palette, typo, photos pro)",
    "100% optimisé mobile — chargement < 2 secondes",
    "Réservation WhatsApp en 1 clic (le canal qui convertit en Afrique)",
    "Référencement local Google (Maps + recherche)",
    "Galerie photos pro avec compression auto",
    "Hébergement inclus la 1ʳᵉ année (Vercel — rapide partout dans le monde)",
    "Formation simple pour mettre à jour menu, photos, horaires",
    "Support WhatsApp 30 jours après livraison",
  ];
  return (
    <section className="py-20">
      <div className="container grid items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Notre solution
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Un site qui fait son travail : vous amener des clients.
          </h2>
          <p className="mt-4 text-muted-foreground">
            On combine IA et design conversion-first pour livrer un site
            professionnel en une semaine, à un prix juste pour le marché local.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="whatsapp" size="lg">
              <a href={waLink()} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5" />
                Discuter sur WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#pricing">Voir les tarifs</a>
            </Button>
          </div>
        </div>
        <ul className="space-y-3">
          {benefits.map((b) => (
            <li
              key={b}
              className="flex gap-3 rounded-lg border border-border bg-card p-4"
            >
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="text-sm">{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------- PROCESS ------------------- */
function Process() {
  const steps = [
    {
      n: "01",
      title: "Brief WhatsApp · Jour 1",
      desc: "Un appel ou message WhatsApp de 20 min pour comprendre votre activité, vos plats, vos clients.",
    },
    {
      n: "02",
      title: "Maquette offerte · Jour 2",
      desc: "On vous envoie une première version visuelle. Vous validez ou demandez des ajustements.",
    },
    {
      n: "03",
      title: "Développement · Jours 3-6",
      desc: "On construit le site, on intègre photos, menu, WhatsApp, Google Maps, SEO local.",
    },
    {
      n: "04",
      title: "Mise en ligne · Jour 7",
      desc: "Site déployé sur votre nom de domaine. Formation 30 min. Support inclus pendant 30 jours.",
    },
  ];
  return (
    <section id="process" className="bg-muted/40 py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Notre process
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            De votre brief à votre site en ligne, en 7 jours.
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className="relative rounded-2xl border border-border bg-card p-6"
            >
              <div className="text-5xl font-bold text-primary/20">{s.n}</div>
              <h3 className="mt-2 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------- SHOWCASE (Before/After mock) ------------------- */
function Showcase() {
  return (
    <section id="showcase" className="py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Avant / Après
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Quelques transformations récentes
          </h2>
          <p className="mt-4 text-muted-foreground">
            Mêmes établissements, mêmes plats, sites totalement différents.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="grid grid-cols-2">
                <div className="relative aspect-[4/5] bg-gradient-to-br from-stone-200 to-stone-300">
                  <div className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                    AVANT
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-stone-500">
                    Site obsolète<br />Wix 2018, photos floues
                  </div>
                </div>
                <div className="relative aspect-[4/5] bg-gradient-to-br from-primary/20 to-primary/10">
                  <div className="absolute left-3 top-3 rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
                    APRÈS
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs font-medium text-primary">
                    Design moderne<br />Mobile-first · CTA WhatsApp
                  </div>
                </div>
              </div>
              <div className="border-t border-border p-5">
                <h3 className="font-bold">
                  {i === 1
                    ? "Restaurant L'Étoile, Douala"
                    : "Hôtel Sahel, Dakar"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {i === 1
                    ? "+ 42% de réservations WhatsApp en 30 jours"
                    : "+ 28% de demandes de devis sur le 1ᵉʳ mois"}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          * Cas d'usage illustratifs. Remplaçables par vos vraies réalisations
          dans <code className="rounded bg-muted px-1.5 py-0.5">app/page.tsx</code>.
        </p>
      </div>
    </section>
  );
}

/* ------------------- PRICING ------------------- */
function Pricing() {
  const plans = [
    {
      name: "Essentiel",
      price: "250 000",
      currency: "FCFA",
      tagline: "Pour démarrer fort",
      features: [
        "Site 1 page (landing)",
        "100% mobile + WhatsApp",
        "SEO local de base",
        "Hébergement 1 an inclus",
        "Livré en 7 jours",
      ],
      cta: "Démarrer sur WhatsApp",
      highlight: false,
    },
    {
      name: "Croissance",
      price: "450 000",
      currency: "FCFA",
      tagline: "Notre best-seller",
      features: [
        "Site 4-6 pages",
        "Galerie photos pro (jusqu'à 30)",
        "Menu / catalogue interactif",
        "Formulaire de réservation",
        "SEO local optimisé",
        "Hébergement 1 an + nom de domaine",
        "Support 60 jours",
      ],
      cta: "Choisir Croissance",
      highlight: true,
    },
    {
      name: "Sur-mesure",
      price: "Sur devis",
      currency: "",
      tagline: "Multi-langues, réservation, paiement",
      features: [
        "Tout du plan Croissance",
        "Multi-langues (FR / EN)",
        "Système de réservation avancé",
        "Intégration paiement mobile",
        "Tableau de bord propriétaire",
        "Support prioritaire 6 mois",
      ],
      cta: "Discuter du projet",
      highlight: false,
    },
  ];
  return (
    <section id="pricing" className="bg-muted/40 py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Nos tarifs
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Des prix clairs, adaptés au marché local
          </h2>
          <p className="mt-4 text-muted-foreground">
            Paiement en 2 fois sans frais. Mobile money accepté.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border bg-card p-8 ${
                p.highlight
                  ? "border-primary shadow-xl ring-2 ring-primary/20"
                  : "border-border"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  POPULAIRE
                </div>
              )}
              <h3 className="text-lg font-bold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{p.price}</span>
                {p.currency && (
                  <span className="text-sm text-muted-foreground">
                    {p.currency}
                  </span>
                )}
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={p.highlight ? "whatsapp" : "outline"}
                size="lg"
                className="mt-8 w-full"
              >
                <a
                  href={waLink(
                    `Bonjour, je suis intéressé par le plan ${p.name}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {p.cta}
                </a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------- TESTIMONIALS ------------------- */
function Testimonials() {
  const tests = [
    {
      name: "Aïssatou D.",
      role: "Gérante, Restaurant Le Baobab",
      city: "Dakar",
      text: "Le site a été livré en 6 jours. Depuis, on reçoit en moyenne 3 réservations WhatsApp par jour. Pour le prix, c'est incroyable.",
    },
    {
      name: "Patrick M.",
      role: "Propriétaire, Lounge Étoile",
      city: "Douala",
      text: "On avait essayé deux freelances avant. Là, ils ont compris le besoin tout de suite et le résultat est très pro. Recommandé.",
    },
    {
      name: "Fatou B.",
      role: "Directrice, Hôtel Sahel",
      city: "Abidjan",
      text: "Communication claire, livraison en temps, formation simple. Notre taux de remplissage week-end a augmenté en un mois.",
    },
  ];
  return (
    <section className="py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Témoignages
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Ce qu'en disent les premiers clients
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tests.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed">&laquo; {t.text} &raquo;</p>
              <div className="mt-5 border-t border-border pt-4">
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">
                  {t.role} · {t.city}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------- FAQ ------------------- */
function FAQSection() {
  const faqs = [
    {
      q: "Combien de temps prend vraiment la refonte ?",
      a: "7 jours ouvrés en moyenne. Si vous fournissez rapidement vos photos, votre menu et votre logo, on peut aller plus vite. Si vous voulez quelque chose de très sur-mesure, on prévoit 10-14 jours.",
    },
    {
      q: "Quels moyens de paiement acceptez-vous ?",
      a: "Mobile money (Orange Money, MTN, Wave), virement bancaire, et paiement en 2 fois sans frais (50% au démarrage, 50% à la livraison).",
    },
    {
      q: "Est-ce que je suis propriétaire du site ?",
      a: "100%. On vous remet tous les accès (nom de domaine, hébergement, CMS). Vous êtes libre de partir où vous voulez à tout moment.",
    },
    {
      q: "Et si je n'ai pas de photos professionnelles ?",
      a: "Pas de souci. On peut faire un shooting smartphone avec vous (guide étape par étape) ou utiliser nos banques d'images thématiques. Pour les restos sur Douala, Abidjan et Dakar, on peut aussi mettre en relation avec un photographe local.",
    },
    {
      q: "Vous gérez aussi la maintenance après ?",
      a: "On inclut 30 jours de support post-livraison (modifs mineures, formation). Au-delà, on propose un abonnement mensuel optionnel à 15 000 FCFA / mois pour les mises à jour récurrentes.",
    },
    {
      q: "Et si je n'aime pas la maquette ?",
      a: "On la refait. C'est inclus. On veut que vous soyez fier de votre site, pas juste qu'on encaisse.",
    },
  ];
  return (
    <section id="faq" className="bg-muted/40 py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Questions fréquentes
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Tout ce que vous voulez savoir
          </h2>
        </div>
        <div className="mx-auto mt-10 max-w-2xl">
          <Accordion type="single" collapsible>
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

/* ------------------- FINAL CTA + CONTACT FORM ------------------- */
function FinalCTA() {
  return (
    <section id="contact" className="py-20">
      <div className="container">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent p-8 md:p-12">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Prêt à passer à l'attaque ?
              </h2>
              <p className="mt-4 text-muted-foreground">
                On vous envoie une maquette personnalisée de votre nouveau site
                en 24h. Sans engagement. Sans frais.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="whatsapp" size="lg">
                  <a
                    href={waLink(
                      "Bonjour, je veux ma maquette gratuite en 24h"
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp direct
                  </a>
                </Button>
              </div>
              <ul className="mt-6 space-y-2 text-sm">
                {[
                  { icon: Zap, text: "Réponse sous 2h ouvrées" },
                  { icon: ShieldCheck, text: "Devis 100% gratuit" },
                  { icon: Globe2, text: "Couverture toute l'Afrique francophone" },
                ].map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <b.icon className="h-4 w-4 text-primary" />
                    {b.text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <h3 className="font-bold">Ou laissez vos infos ici</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                On vous rappelle sous 2h ouvrées.
              </p>
              <div className="mt-4">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------- FOOTER ------------------- */
function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40 py-10">
      <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
            M
          </div>
          <span>© {new Date().getFullYear()} MCSite. Tous droits réservés.</span>
        </div>
        <div className="flex gap-6">
          <a href="#faq" className="hover:text-foreground">
            FAQ
          </a>
          <a
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            WhatsApp
          </a>
          <a href="mailto:contact@mcsite.com" className="hover:text-foreground">
            Email
          </a>
        </div>
      </div>
    </footer>
  );
}
