CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
  id UUID PRIMARY KEY,
  auth_id TEXT NOT NULL UNIQUE,
  wallet_address TEXT,
  trust_score INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE photos (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  storage_key TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  phash TEXT,
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  device_attestation JSONB,
  captured_at TIMESTAMPTZ NOT NULL,
  server_received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, sha256)
);

CREATE TABLE judgments (
  id UUID PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES photos(id),
  model TEXT NOT NULL,
  raw_json JSONB NOT NULL,
  is_live BOOLEAN NOT NULL,
  total_score INTEGER NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('rejected', 'exp', 'fragment', 'new_pet')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pets (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id),
  species TEXT NOT NULL,
  breed TEXT,
  coat TEXT,
  stats_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(512),
  token_id TEXT,
  minted_at TIMESTAMPTZ,
  last_checkin_at TIMESTAMPTZ,
  fence_state TEXT NOT NULL DEFAULT 'SECURE'
);

CREATE TABLE ledger (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,
  amount INTEGER NOT NULL,
  ref TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kind, ref)
);

