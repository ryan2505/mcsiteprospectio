-- ============================================================
-- MCSite — Schéma Supabase
-- À exécuter dans Supabase → SQL Editor → New query → Run
-- ============================================================

-- Table des leads entrants depuis le formulaire du site marketing
create table if not exists inbound_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  name text not null,
  phone text not null,
  business text not null,
  message text,

  source text default 'site_marketing',
  status text default 'nouveau',  -- nouveau / contacté / rdv / client / perdu
  notes text
);

-- Index pour trier par date dans le dashboard Supabase
create index if not exists inbound_leads_created_idx
  on inbound_leads (created_at desc);

-- ------------------------------------------------------------
-- Sécurité (RLS)
-- On active RLS et on NE crée PAS de policy publique :
-- => seul le service_role (utilisé côté serveur dans l'API route)
--    peut écrire. Le formulaire passe par /api/contact, jamais
--    directement depuis le navigateur. C'est le comportement voulu.
-- ------------------------------------------------------------
alter table inbound_leads enable row level security;

-- (Optionnel) Si un jour tu veux écrire directement depuis le client
-- avec la clé anon, décommente la policy ci-dessous :
-- create policy "allow anon insert" on inbound_leads
--   for insert to anon with check (true);


-- ============================================================
-- MOTEUR DE PROSPECTION — table leads (scraping + audit IA)
-- ============================================================
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- Source
  keyword text,                 -- "restaurant Douala"
  ville text,
  pays text,

  -- Identité prospect (scraping Google Maps)
  nom text not null,
  type_business text,
  adresse text,
  telephone text,
  whatsapp text,
  email text,
  facebook text,
  instagram text,
  linkedin text,
  site_web text,
  google_url text,
  note_google numeric,
  nb_avis int,

  -- Audit IA
  audit_json jsonb,
  score_global int,
  problemes text[],
  angle_pitch text,
  audited_at timestamptz,

  -- Assets (étapes suivantes du pipeline)
  screenshot_before_url text,
  screenshot_after_url text,
  comparison_url text,
  landing_url text,          -- chemin de preview, ex: /preview/<id>
  landing_html text,         -- HTML complet de la landing générée par l'IA
  landing_generated_at timestamptz,
  whatsapp_message text,
  message_generated_at timestamptz,
  build_prompt text,

  -- Suivi commercial
  status text default 'nouveau',
  -- nouveau / audité / message_prêt / envoyé / répondu / rdv / client / refus
  envoye_le timestamptz,
  reponse_le timestamptz,
  notes text
);

-- Anti-doublon : un même site web n'est scrapé qu'une fois
create unique index if not exists leads_site_web_uidx
  on leads (site_web) where site_web is not null;

create index if not exists leads_created_idx on leads (created_at desc);
create index if not exists leads_status_idx on leads (status);

alter table leads enable row level security;
-- Pas de policy publique : seul le service_role (API routes) accède aux leads.

-- ------------------------------------------------------------
-- MIGRATION : si tu as déjà créé la table "leads" avant le maillon 4,
-- exécute ces lignes pour ajouter les colonnes landing (idempotent).
-- ------------------------------------------------------------
alter table leads add column if not exists landing_html text;
alter table leads add column if not exists landing_generated_at timestamptz;
alter table leads add column if not exists message_generated_at timestamptz;
alter table leads add column if not exists facebook text;
alter table leads add column if not exists instagram text;
alter table leads add column if not exists linkedin text;
alter table leads add column if not exists build_prompt text;

-- ============================================================
-- AUTOMATISATION — table d'état du pipeline
-- Exécute ce bloc si tu ajoutes l'automatisation à un projet existant.
-- ============================================================
create table if not exists automation_state (
  id            integer     primary key default 1,
  status        text        not null default 'idle', -- idle | running | paused
  service_type  text,
  ville         text,
  pays          text        default 'Cameroun',
  keywords_pool text[]      default '{}',
  keywords_done text[]      default '{}',
  current_keyword text,
  scrape_run_id text,
  calendly_url  text        default 'https://calendly.com/kountchouryan/30min',
  batch_size    integer     default 5,
  leads_processed integer   default 0,
  last_batch_at timestamptz,
  started_at    timestamptz,
  log           jsonb       default '[]'::jsonb
);

-- Ligne de config unique (singleton)
insert into automation_state (id) values (1) on conflict do nothing;

-- Pas d'accès public — uniquement via service_role (API routes server-side)
alter table automation_state enable row level security;
