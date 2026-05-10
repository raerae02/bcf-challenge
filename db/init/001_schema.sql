CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  borough TEXT,
  project_type TEXT NOT NULL,
  use TEXT NOT NULL,
  height TEXT,
  units INTEGER,
  permit_stage TEXT,
  sensitive_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  profile JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  type TEXT NOT NULL,
  summary TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  text TEXT,
  structured JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  embedding vector(768) NOT NULL,
  clause_id TEXT,
  clause_title TEXT,
  clause_type TEXT,
  page_start INTEGER,
  page_end INTEGER,
  key_obligations JSONB NOT NULL DEFAULT '[]'::jsonb,
  risk_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  parties JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  path JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS laws (
  id TEXT PRIMARY KEY,
  seed_id TEXT,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  jurisdiction TEXT NOT NULL,
  category TEXT NOT NULL,
  urgency TEXT NOT NULL,
  old_text TEXT,
  new_text TEXT NOT NULL,
  summary TEXT,
  risk TEXT,
  structured JSONB,
  embedding vector(768) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  law_id TEXT NOT NULL REFERENCES laws(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  urgency TEXT NOT NULL,
  affected_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS documents_project_id_idx ON documents(project_id);
CREATE INDEX IF NOT EXISTS document_chunks_project_id_idx ON document_chunks(project_id);
CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS laws_created_at_idx ON laws(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_project_id_idx ON notifications(project_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx
  ON document_chunks USING hnsw (embedding vector_cosine_ops);
