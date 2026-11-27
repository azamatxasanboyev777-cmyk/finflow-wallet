CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  accepted_terms BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

INSERT INTO users (full_name, phone, pin_hash, pin_salt, accepted_terms)
VALUES (
  'Azamat Hasanboyev',
  '+998901234567',
  '52709321c748518a9906994e08b0111a2ba84f69f273f1efbab3318601d48df2a6cfb334799b75c193a2ee096780ad216c0fdbba5178ef7a4b0e7fd082392260',
  'finflow_demo_salt_01',
  TRUE
)
ON CONFLICT (phone) DO NOTHING;
