
import { createClient } from "../lib/client";

const supabase = createClient();

export default function AdminDashboard() {
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Gagal logout. Silakan coba lagi.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Badminton League
          </h1>
          <p className="text-sm text-slate-500">
            Admin Dashboard
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
        >
          Logout
        </button>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h2>

        <p className="mt-2 text-slate-600">
          Selamat datang di panel administrasi liga badminton.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-white p-5">
            <h3 className="font-semibold">Manajemen Pasangan</h3>
            <p className="mt-2 text-sm text-slate-500">
              Kelola pasangan dan pemain yang mengikuti liga.
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h3 className="font-semibold">Jadwal Pertandingan</h3>
            <p className="mt-2 text-sm text-slate-500">
              Atur jadwal pertandingan liga.
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h3 className="font-semibold">Hasil Pertandingan</h3>
            <p className="mt-2 text-sm text-slate-500">
              Masukkan skor setiap set dan perbarui hasil.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
