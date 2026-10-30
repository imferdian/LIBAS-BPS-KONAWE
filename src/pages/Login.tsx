import { useState } from "react";
import { createClient } from "../lib/client";

const supabase = createClient();

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Login gagal. Periksa kembali email dan kata sandi.");
      return;
    }
  }

  return (
    <main
      className="min-h-screen w-full flex flex-col justify-between overflow-hidden"
      style={{
        backgroundColor: "#6bb4ee",
        color: "#0e1822",
        fontFamily: "'Hanken Grotesk', sans-serif",
      }}
    >
      {/* Top Bar: Wordmark and League badge */}
      <header className="flex items-center justify-between px-6 md:px-12 lg:px-16 pt-6 md:pt-8 animate-fade-in">
        <span className="text-xl md:text-2xl font-semibold tracking-tight text-[#0e1822]">
          LIBAS
        </span>
        <span className="text-base font-medium text-[#1b3d5c]">
          Portal Administrator
        </span>
      </header>

      {/* Main Grid: Poster Sentence on Left, Login Form on Right + Context Images */}
      <section className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center px-6 md:px-12 lg:px-16 py-8 relative">
        {/* Left 7 Columns: Poster Headline with Inline Media */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6 animate-fade-in animation-delay-100">
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[85px] tracking-tight leading-[1.1] text-[#0e1822] relative"
            style={{ fontFamily: "'Zodiak', serif", fontWeight: 300 }}
          >
            <span className="block text-6xl">LIGA</span>
            BULUTANGKIS
            STATISTIK{" "}
            <span className="inline-flex items-center justify-center mx-1 w-20 sm:w-28 md:w-36 h-8 sm:h-12 md:h-18 rounded-full overflow-hidden bg-[#7dbdf0] transform transition-transform duration-300 hover:scale-110 align-middle -translate-y-1 sm:-translate-y-2">
              <img
                src="/assets/badminton-ball-13550266595.jpg"
                alt="Bulu tangkis shuttlecock di atas lapangan"
                className="w-full h-full object-cover object-center"
              />
            </span>
            <div className="hidden absolute text-normal -bottom-9 *:left-0 md:bottom-0 md:right-90 md:flex justify-center md:rotate-[-10deg]">
              <div className="relative inline-block">
                <span className="relative tracking-wider font-normal z-10 block text-lg md:text-xl text-white px-4 py-2">
                  Kab. Konawe
                </span>
                <span
                  aria-hidden="true"
                  className="absolute z-0 block bg-[#0e1822]"
                  style={{
                    top: "-18%",
                    left: "-0%",
                    right: "-0%",
                    bottom: "-18%",
                    maskImage: 'url("/assets/brush-stroke.svg")',
                    WebkitMaskImage: 'url("/assets/brush-stroke.svg")',
                    maskSize: "100% 100%",
                    maskRepeat: "no-repeat",
                    transform: "scale(1.70)",
                    transformOrigin: "center",
                  }}
                />
              </div>
            </div>
          </h1>

          <p className="text-lg md:text-xl text-[#0e1822] max-w-xl font-normal leading-relaxed">
            Pusat kendali operasional pertandingan, susunan jadwal turnamen,
            dan rekapitulasi poin atlet liga bulu tangkis resmi <br /> BPS Kabupaten Konawe.
          </p>

          <div className="pt-4 flex items-center gap-6 text-base text-[#0e1822]">
            <div>
              <span className="block text-2xl font-medium text-[#0e1822]">8</span>
              <span className="text-[#1b3d5c]">Klub Aktif</span>
            </div>
            <div className="w-px h-8 bg-[#0e1822]/20" />
            <div>
              <span className="block text-2xl font-medium text-[#0e1822]">28</span>
              <span className="text-[#1b3d5c]">Laga Musim Ini</span>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Solid Minimal Form */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end animate-fade-in animation-delay-200">
          <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl">
            <h2 className="text-2xl font-semibold text-[#0e1822] tracking-tight mb-2">
              Masuk Akun
            </h2>
            <p className="text-base text-[#1b3d5c] mb-6">
              Akses terbatas untuk panitia dan administrator liga.
            </p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="animate-fade-in animation-delay-300">
                <label className="block text-base font-medium text-[#0e1822] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg bg-[#f4f8fc] border border-[#6bb4ee]/40 px-4 py-3 text-base text-[#0e1822] placeholder-[#1b3d5c]/50 outline-none transition-all duration-200 focus:border-[#0e1822] focus:bg-white focus:ring-2 focus:ring-[#0e1822]/10"
                  placeholder="panitia@libas.org"
                />
              </div>

              <div className="animate-fade-in animation-delay-400">
                <label className="block text-base font-medium text-[#0e1822] mb-2">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg bg-[#f4f8fc] border border-[#6bb4ee]/40 px-4 py-3 text-base text-[#0e1822] placeholder-[#1b3d5c]/50 outline-none transition-all duration-200 focus:border-[#0e1822] focus:bg-white focus:ring-2 focus:ring-[#0e1822]/10"
                  placeholder="Masukkan kata sandi"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-base border border-red-200 animate-pulse">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#db460c] px-4 py-3 text-base font-semibold text-white transition-all duration-200 hover:bg-[#c13d0d] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5 animate-fade-in animation-delay-500"
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memverifikasi...
                  </span>
                ) : (
                  "Masuk ke Panel"
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }
        .animation-delay-100 {
          animation-delay: 0.1s;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in,
          .animate-spin,
          .hover:scale-110:hover {
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}
