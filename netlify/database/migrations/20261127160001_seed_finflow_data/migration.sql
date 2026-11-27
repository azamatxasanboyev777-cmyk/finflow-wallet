INSERT INTO accounts (name, type, currency, balance, monthly_limit, color)
VALUES
  ('Asosiy Karta (Humo)', 'card', 'UZS', 4850000, 4000000, '#10b981'),
  ('Naqd Hamyon', 'cash', 'UZS', 920000, 1500000, '#3b82f6'),
  ('Maqsadli Jamg''arma', 'savings', 'UZS', 7500000, 0, '#8b5cf6');

INSERT INTO transactions (account_id, type, category, amount, description, occurred_at)
VALUES
  (1, 'income', 'Maosh', 6000000, 'Oylik maosh tushumi', CURRENT_DATE - INTERVAL '6 days'),
  (1, 'expense', 'Oziq-ovqat', 420000, 'Supermarket xaridlari', CURRENT_DATE - INTERVAL '4 days'),
  (1, 'expense', 'Kommunal', 380000, 'Elektr va internet to''lovi', CURRENT_DATE - INTERVAL '2 days'),
  (1, 'expense', 'Ta''lim', 350000, 'Online kurs obunasi', CURRENT_DATE - INTERVAL '1 day'),
  (2, 'income', 'Frilans', 1200000, 'Veb loyiha avansi', CURRENT_DATE - INTERVAL '5 days'),
  (2, 'expense', 'Transport', 180000, 'Taksi va yo''l xarajatlari', CURRENT_DATE - INTERVAL '3 days'),
  (2, 'expense', 'Oziq-ovqat', 100000, 'Tushlik va kofe', CURRENT_DATE),
  (3, 'income', 'Jamg''arma', 7500000, 'Noutbuk uchun zaxira fondi', CURRENT_DATE - INTERVAL '7 days');
