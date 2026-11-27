# FinFlow — Hamyonlar va Moliyaviy Nazorat (FinTech)

## Muammo, maqsadli auditoriya va yechim

- **Qaysi muammoni hal qiladi:** Ko‘pchilik foydalanuvchilar bir nechta bank kartasi, naqd pul va jamg‘arma hisoblaridagi pul oqimini tartibli yurita olmaydi, oylik xarajat limitidan oshib ketganini kech sezadi va noto‘g‘ri hisob-kitob sababli hisobda mavjud bo‘lmagan mablag‘ni sarflab qo‘yadi.
- **Kim uchun:** Shaxsiy byudjetini nazorat qilmoqchi bo‘lgan talabalar, frilanserlar, oilaviy byudjet yurituvchilar hamda kichik jamoalar uchun.
- **Ilova uni qanday hal qiladi:** FinFlow barcha hamyonlarni (karta, naqd, jamg‘arma) bitta boshqaruv panelida birlashtiradi, har bir tranzaksiya va hamyonlararo o‘tkazmada balansni PostgreSQL tranzaksiyasi ichida avtomatik yangilaydi, oylik xarajat limitlarini kuzatadi hamda **server darajasida balans manfiy bo‘lishini qat’iy taqiqlaydi**.

---

## Asosiy imkoniyatlar

- **3 ta o‘zaro bog‘langan/asosiy ma’lumot obyekti (PostgreSQL):**
  - `users` (tasdiqlangan foydalanuvchilar — ism-familiya, telefon raqam, shifrlangan PIN hash/salt)
  - `accounts` (hamyonlar/kartalar) ↔ `transactions` (kirim-chiqimlar, `account_id` tashqi kaliti bilan bog‘langan).
- **Kirishda tanishtiruv va xavfsizlik tasdig‘i:**
  - Ilovaga kirishdan oldin mijozga FinFlow vazifalari tushuntiriladi.
  - Foydalanuvchi ism-familiya, telefon raqam (`+998...`), xavfsizlik PIN/paroli (`scrypt` + `salt` bilan xeshlanadi) va maxfiylik roziligi orqali tasdiqlanadi (`HMAC-SHA256` sessiya tokeni).
- **Dark Mode / Light Mode:**
  - Istalgan sahifada tungi va yorug‘ mavzu orasida almashish (`localStorage` da saqlanadi).
- **FinTech biznes qoidalari (serverda qat’iy tekshiriladi):**
  - Chiqim yoki o‘tkazma summasi hamyon balansidan katta bo‘lsa rad etiladi (`409 Conflict`, `{ "error": "..." }`) — **balans hech qachon manfiyga tushmaydi**.
  - Tranzaksiyani tahrirlash yoki kirimni o‘chirish hamyon balansini manfiyga tushiradigan bo‘lsa, operatsiya bekor qilinadi.
  - Hamyonlararo o‘tkazma (`POST /api/transfers`) ikki hamyon balansini atomar SQL tranzaksiyasi (`BEGIN ... COMMIT`) ichida yangilaydi va bir xil hamyonga o‘tkazishni taqiqlaydi.
  - Oylik xarajat limiti nazorati va vizual ogohlantirishlar.
- **3 sahifali responsive React JSX interfeysi:**
  - **Bosh sahifa (Dashboard):** Umumiy balans, oylik kirim/chiqim, hamyonlar va limit progress barlari, so‘nggi operatsiyalar.
  - **Tranzaksiyalar:** To‘liq CRUD, qidiruv, hamyon/tur/kategoriya bo‘yicha filtrlar va **CSV eksport**.
  - **Tahlil:** Kategoriyalar kesimida xarajat va kirim taqsimoti, byudjet holati, 14 kunlik pul oqimi.
  - Barcha sahifalarda **loading**, **xato** va **bo‘sh** holatlar hamda mobil ekranlar uchun moslashuv mavjud.

---

## Texnologiyalar

- **Frontend:** React 19 (JSX), Vite 6, Lucide React, CSS3 (Responsive Grid/Flexbox)
- **Backend:** Netlify Functions (Node.js ESM, REST API)
- **Ma’lumotlar bazasi:** PostgreSQL (`@netlify/database`, SQL migratsiyalar)
- **Testlash:** Node.js built-in test runner (`node --test`)
- **Deploy:** Netlify (Frontend + Serverless API + Managed PostgreSQL)

---

## Ishga tushirish (Lokal)

### 1. Repozitoriyni klonlash va paketlarni o‘rnatish
```bash
git clone <repo-url>
cd finflow-wallet
npm install
```

### 2. Muhit o‘zgaruvchilari (`.env`)
```bash
cp .env.example .env
```
`.env.example` tarkibi:
- `NETLIFY_DB_URL` — PostgreSQL ulanish satri (`netlify dev` yoki `npm run dev` da `@netlify/vite-plugin` lokal bazani avtomatik ishga tushiradi)
- `VITE_APP_NAME` — ilova nomi
- `VITE_DEFAULT_CURRENCY` — asosiy valyuta (`UZS`)

### 3. Migratsiyalarni qo‘llash va ilovani ishga tushirish
```bash
npx netlify database migrations apply
npx netlify dev
```
Yoki Vite dev server orqali:
```bash
npm run dev
```

### 4. Testlarni ishga tushirish va build qilish
```bash
npm test
npm run build
```

---

## REST API ro‘yxati

Barcha javoblar JSON formatida qaytadi. Xatolik yuz berganda tegishli HTTP status kodi (`400`, `404`, `405`, `409`, `500`) va `{ "error": "..." }` tanasi yuboriladi.

### Sog‘liq tekshiruvi va Xavfsizlik
- `GET /api/health` — API va ma’lumotlar bazasi holati (`200 OK`)
- `POST /api/auth` — Ro‘yxatdan o‘tish (`mode: "register"`) yoki kirish (`mode: "login"`); telefon, ism-familiya va PIN tekshirilib HMAC sessiya tokeni qaytariladi
- `GET /api/auth` — `Authorization: Bearer <token>` orqali joriy foydalanuvchini tasdiqlash

### Hamyonlar (`/api/accounts`)
- `GET /api/accounts` — Barcha hamyonlar ro‘yxati (`?search=`, `?type=card|cash|savings`)
- `GET /api/accounts/:id` — Bitta hamyon tafsiloti
- `POST /api/accounts` — Yangi hamyon yaratish (`201 Created`)
  - Body: `{ "name": "Uzcard", "type": "card", "balance": 500000, "monthly_limit": 2000000, "color": "#10b981" }`
- `PATCH /api/accounts/:id` — Hamyonni tahrirlash (`200 OK`)
- `DELETE /api/accounts/:id` — Hamyonni o‘chirish (`200 OK`)

### Tranzaksiyalar (`/api/transactions`)
- `GET /api/transactions` — Ro‘yxat va jami statistika (`?search=`, `?accountId=`, `?type=income|expense`, `?category=`, `?from=`, `?to=`)
- `GET /api/transactions/:id` — Bitta tranzaksiya tafsiloti
- `POST /api/transactions` — Yangi kirim/chiqim qo‘shish (`201 Created`, balans yetmasa `409 Conflict`)
  - Body: `{ "account_id": 1, "type": "expense", "category": "Oziq-ovqat", "amount": 85000, "description": "Kechki ovqat", "occurred_at": "2026-11-27" }`
- `PATCH /api/transactions/:id` — Tranzaksiyani tahrirlash va balansni atomar qayta hisoblash
- `DELETE /api/transactions/:id` — Tranzaksiyani o‘chirish va balansni qayta hisoblash

### O‘tkazmalar va Tahlil
- `POST /api/transfers` — Hamyondan hamyonga atomar o‘tkazma (`201 Created`)
  - Body: `{ "from_account_id": 1, "to_account_id": 3, "amount": 250000, "description": "Jamg'arma" }`
- `GET /api/analytics` — Kategoriyalar va so‘nggi 14 kunlik pul oqimi tahlili
