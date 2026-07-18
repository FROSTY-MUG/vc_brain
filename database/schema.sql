-- =============================================
-- VC Brain — PostgreSQL Schema (Supabase)
-- =============================================

-- Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Users ──
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  avatar_url    TEXT,
  role          TEXT CHECK (role IN ('founder','investor')) NOT NULL,
  onboarded     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Investor Theses ──
CREATE TABLE investor_theses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  sectors         TEXT[] DEFAULT '{}',
  stages          TEXT[] DEFAULT '{}',
  geographies     TEXT[] DEFAULT '{}',
  check_size_min  INTEGER DEFAULT 25000,
  check_size_max  INTEGER DEFAULT 250000,
  ownership_target NUMERIC(5,2) DEFAULT 5.00,
  risk_appetite   TEXT CHECK (risk_appetite IN ('conservative','moderate','aggressive')) DEFAULT 'moderate',
  keywords        TEXT[] DEFAULT '{}',
  description     TEXT DEFAULT '',
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_theses_user ON investor_theses(user_id);

-- ── Founders ──
CREATE TABLE founders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT,
  linkedin_url  TEXT,
  github_url    TEXT,
  twitter_url   TEXT,
  bio           TEXT DEFAULT '',
  location      TEXT DEFAULT '',
  tags          TEXT[] DEFAULT '{}',
  is_cold_start BOOLEAN DEFAULT TRUE,
  embedding     vector(1536),           -- for semantic search
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_founders_email ON founders(email);
CREATE INDEX idx_founders_embedding ON founders USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ── Persistent Founder Scores ──
CREATE TABLE founder_scores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id          UUID REFERENCES founders(id) ON DELETE CASCADE UNIQUE,
  overall_score       NUMERIC(5,2) DEFAULT 0,
  execution_velocity  NUMERIC(5,2) DEFAULT 0,
  domain_expertise    NUMERIC(5,2) DEFAULT 0,
  resilience_history  NUMERIC(5,2) DEFAULT 0,
  confidence          NUMERIC(3,2) DEFAULT 0,  -- 0-1
  data_completeness   NUMERIC(3,2) DEFAULT 0,  -- 0-1
  trend               TEXT CHECK (trend IN ('rising','stable','declining')) DEFAULT 'stable',
  trend_delta         NUMERIC(5,2) DEFAULT 0,
  is_cold_start       BOOLEAN DEFAULT TRUE,
  scored_at           TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_fscores_founder ON founder_scores(founder_id);
CREATE INDEX idx_fscores_overall ON founder_scores(overall_score DESC);

-- ── Founder Score History (temporal tracking) ──
CREATE TABLE founder_score_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id  UUID REFERENCES founders(id) ON DELETE CASCADE,
  score       NUMERIC(5,2),
  recorded_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_fshistory_founder ON founder_score_history(founder_id, recorded_at DESC);

-- ── Startups / Companies ──
CREATE TABLE startups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  website       TEXT,
  sector        TEXT DEFAULT '',
  stage         TEXT DEFAULT '',
  geography     TEXT DEFAULT '',
  founded_date  DATE,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_startups_name ON startups(name);

-- ── Founder ↔ Startup (M:N) ──
CREATE TABLE founder_startups (
  founder_id  UUID REFERENCES founders(id) ON DELETE CASCADE,
  startup_id  UUID REFERENCES startups(id) ON DELETE CASCADE,
  role        TEXT DEFAULT 'founder',
  PRIMARY KEY (founder_id, startup_id)
);

-- ── Applications (Opportunities) ──
CREATE TABLE applications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id     UUID REFERENCES startups(id) ON DELETE CASCADE,
  source_type    TEXT CHECK (source_type IN (
    'inbound','outbound_github','outbound_producthunt',
    'outbound_arxiv','outbound_hackathon','outbound_accelerator'
  )) NOT NULL,
  source_detail  TEXT,
  status         TEXT CHECK (status IN (
    'new','screening','diligence','decision','passed','deployed'
  )) DEFAULT 'new',
  deck_url       TEXT,
  raw_text       TEXT,
  embedding      vector(1536),
  submitted_at   TIMESTAMPTZ DEFAULT now(),
  processed_at   TIMESTAMPTZ
);
CREATE INDEX idx_apps_startup ON applications(startup_id);
CREATE INDEX idx_apps_status ON applications(status);
CREATE INDEX idx_apps_submitted ON applications(submitted_at DESC);

-- ── 3-Axis Opportunity Scores ──
CREATE TABLE opportunity_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    UUID REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
  -- Founder axis
  founder_score     NUMERIC(5,2) DEFAULT 0,
  founder_confidence NUMERIC(3,2) DEFAULT 0,
  founder_trend     TEXT DEFAULT 'stable',
  founder_signals   JSONB DEFAULT '[]',
  -- Market axis
  market_score      NUMERIC(5,2) DEFAULT 0,
  market_confidence NUMERIC(3,2) DEFAULT 0,
  market_trend      TEXT DEFAULT 'stable',
  market_signals    JSONB DEFAULT '[]',
  -- Idea vs Market axis
  idea_score        NUMERIC(5,2) DEFAULT 0,
  idea_confidence   NUMERIC(3,2) DEFAULT 0,
  idea_trend        TEXT DEFAULT 'stable',
  idea_signals      JSONB DEFAULT '[]',
  -- Meta
  thesis_alignment  NUMERIC(5,2) DEFAULT 0,
  recommendation    TEXT CHECK (recommendation IN ('deploy','diligence','pass','watch')) DEFAULT 'pass',
  scored_at         TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_oscores_app ON opportunity_scores(application_id);

-- ── Claims ──
CREATE TABLE claims (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id   UUID REFERENCES applications(id) ON DELETE CASCADE,
  claim_type       TEXT NOT NULL,
  statement        TEXT NOT NULL,
  extracted_value  TEXT,
  source           TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_claims_app ON claims(application_id);

-- ── Trust Scores (per claim) ──
CREATE TABLE trust_scores (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id              UUID REFERENCES claims(id) ON DELETE CASCADE UNIQUE,
  score                 NUMERIC(5,2) DEFAULT 0,
  contradiction_flag    BOOLEAN DEFAULT FALSE,
  reasoning             TEXT DEFAULT '',
  source_reliability    NUMERIC(3,2) DEFAULT 0,
  corroboration_count   INTEGER DEFAULT 0,
  freshness_days        INTEGER DEFAULT 0,
  extraction_confidence NUMERIC(3,2) DEFAULT 0,
  scored_at             TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_trust_claim ON trust_scores(claim_id);

-- ── Evidence Links ──
CREATE TABLE evidence_links (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id          UUID REFERENCES claims(id) ON DELETE CASCADE,
  source_url        TEXT NOT NULL,
  excerpt           TEXT DEFAULT '',
  reliability_weight NUMERIC(3,2) DEFAULT 0.5,
  retrieved_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_evidence_claim ON evidence_links(claim_id);

-- ── Investment Memos ──
CREATE TABLE memos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID REFERENCES applications(id) ON DELETE CASCADE,
  content_json    JSONB NOT NULL DEFAULT '{}',
  recommendation  TEXT CHECK (recommendation IN ('deploy','pass','diligence')),
  generated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_memos_app ON memos(application_id);

-- ── Outbound Signals / Source Registry ──
CREATE TABLE outbound_signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id      UUID REFERENCES founders(id) ON DELETE SET NULL,
  source          TEXT NOT NULL,
  signal_type     TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT DEFAULT '',
  url             TEXT,
  strength        NUMERIC(5,2) DEFAULT 0,
  discovered_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_signals_source ON outbound_signals(source);
CREATE INDEX idx_signals_strength ON outbound_signals(strength DESC);

-- ── Outreach Events ──
CREATE TABLE outreach_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id    UUID REFERENCES founders(id) ON DELETE CASCADE,
  channel       TEXT NOT NULL,
  message       TEXT DEFAULT '',
  status        TEXT CHECK (status IN ('drafted','sent','replied','bounced')) DEFAULT 'drafted',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Timeline Events (audit log) ──
CREATE TABLE timeline_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  event       TEXT NOT NULL,
  detail      TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_timeline_entity ON timeline_events(entity_type, entity_id, created_at DESC);

-- ── Deduplication: unique constraint on founder email to prevent duplicates ──
-- Additional dedup handled at the application layer via name + LinkedIn fuzzy matching
