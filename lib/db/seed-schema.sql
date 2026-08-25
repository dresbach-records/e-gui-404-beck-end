CREATE TABLE IF NOT EXISTS egui_seed_records (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_key TEXT NOT NULL,
  payload JSONB NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, entity_key)
);

CREATE INDEX IF NOT EXISTS egui_seed_records_entity_type_idx ON egui_seed_records(entity_type);
CREATE INDEX IF NOT EXISTS egui_seed_records_demo_idx ON egui_seed_records(is_demo);
