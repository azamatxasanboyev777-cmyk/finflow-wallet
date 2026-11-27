import { useState } from "react";
import {
  ArrowLeftRight,
  BarChart3,
  Eye,
  EyeOff,
  Lock,
  Moon,
  ShieldCheck,
  Sun,
  Wallet,
} from "lucide-react";
import { api } from "../api/client";

const FEATURES = [
  {
    icon: Wallet,
    title: "Barcha hamyonlar bitta joyda",
    description:
      "Bank kartalari, naqd pul va jamg'arma hisoblaringiz balansini real vaqtda kuzating.",
  },
  {
    icon: ShieldCheck,
    title: "Manfiy balansdan himoya",
    description:
      "Server darajasida tekshiruv hamyondagi mavjud mablag'dan ortiq xarajat kiritishga yo'l qo'ymaydi.",
  },
  {
    icon: BarChart3,
    title: "Oylik limit va tahlillar",
    description:
      "Har bir hamyon uchun oylik xarajat limiti belgilang, kategoriyalar bo'yicha hisobot va CSV oling.",
  },
  {
    icon: ArrowLeftRight,
    title: "Xavfsiz ichki o'tkazmalar",
    description:
      "Bir hamyondan boshqasiga mablag' o'tkazing — ikkala balans atomar tarzda yangilanadi.",
  },
];

export default function WelcomeAuthPage({ theme, onToggleTheme, onAuthenticated }) {
  const [mode, setMode] = useState("register");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (mode === "register" && fullName.trim().length < 3) {
      setError("Iltimos, ism va familiyangizni to'liq kiriting (kamida 3 ta belgi).");
      return;
    }
    if (pin.trim().length < 4) {
      setError("Xavfsizlik PIN/paroli kamida 4 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    if (mode === "register" && !acceptedTerms) {
      setError("Davom etish uchun xavfsizlik shartlarini tasdiqlang.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.authenticate({
        mode,
        full_name: fullName.trim(),
        phone: phone.trim(),
        pin: pin.trim(),
        accepted_terms: acceptedTerms,
      });
      onAuthenticated(res.user, res.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoLogin() {
    setError("");
    setSubmitting(true);
    try {
      const res = await api.authenticate({
        mode: "login",
        phone: "+998901234567",
        pin: "1234",
      });
      onAuthenticated(res.user, res.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <header className="navbar">
        <div className="navbar-inner">
          <div className="brand">
            <div className="brand-badge">
              <Wallet size={20} />
            </div>
            <span>FinFlow</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onToggleTheme}
            aria-label="Mavzuni almashtirish"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            <span>{theme === "dark" ? "Yorug' rejim" : "Tungi rejim"}</span>
          </button>
        </div>
      </header>

      <main className="auth-container">
        <div className="auth-grid">
          <section>
            <div className="auth-hero-tag">
              <ShieldCheck size={15} />
              <span>Xavfsiz Shaxsiy FinTech Platforma</span>
            </div>
            <h1 className="auth-headline">
              Moliyangizni tartibga soling — har bir so‘m aniq nazoratda
            </h1>
            <p className="auth-lead">
              <strong>FinFlow</strong> — shaxsiy hamyonlar, kunlik kirim-chiqimlar va oylik
              byudjet limitlarini nazorat qilish uchun yaratilgan web ilova. Kirishdan oldin
              ilova imkoniyatlari bilan tanishing va shaxsingizni tasdiqlang.
            </p>

            <div className="feature-grid">
              {FEATURES.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="feature-card">
                    <div className="feature-icon">
                      <Icon size={18} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="auth-card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Lock size={18} color="var(--emerald)" />
              <h2 className="modal-title">Shaxsni tasdiqlash va kirish</h2>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: "0.86rem", color: "var(--text-muted)" }}>
              Birinchi marta kirsangiz ism-familiya, telefon va parol bilan hisob oching. Avval
              ro‘yxatdan o‘tgan bo‘lsangiz, <strong>Hisobga kirish</strong> orqali kiring — barcha
              hamyonlaringiz va ma’lumotlaringiz saqlangan holda ochiladi.
            </p>

            <div className="segmented" style={{ marginBottom: 16 }}>
              <button
                type="button"
                className={`seg-btn ${mode === "register" ? "active" : ""}`}
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Ro‘yxatdan o‘tish
              </button>
              <button
                type="button"
                className={`seg-btn ${mode === "login" ? "active" : ""}`}
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Hisobga kirish
              </button>
            </div>

            <form className="form-grid" onSubmit={handleSubmit}>
              {error && <div className="alert-error">{error}</div>}

              {mode === "register" && (
                <div className="field">
                  <label htmlFor="auth-name">Ism va familiya</label>
                  <input
                    id="auth-name"
                    className="input"
                    placeholder="Masalan: Azamat Hasanboyev"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="field">
                <label htmlFor="auth-phone">Telefon raqam</label>
                <input
                  id="auth-phone"
                  className="input"
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="auth-pin">Parol (kamida 4 belgi)</label>
                <div className="input-with-icon">
                  <input
                    id="auth-pin"
                    className="input"
                    type={showPin ? "text" : "password"}
                    placeholder="Parolingizni kiriting"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="input-suffix-btn"
                    onClick={() => setShowPin((v) => !v)}
                    aria-label={showPin ? "Yashirish" : "Ko'rsatish"}
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {mode === "register" && (
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  <span>
                    Shaxsiy ma’lumotlarim xavfsiz qayta ishlanishi va sessiyam himoyalanishiga
                    roziman.
                  </span>
                </label>
              )}

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting
                  ? "Tekshirilmoqda..."
                  : mode === "register"
                  ? "Tasdiqlash va kirish"
                  : "Kirish"}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={submitting}
                onClick={handleDemoLogin}
              >
                Tezkor demo kirish (+998 90 123 45 67)
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
