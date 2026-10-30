import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "./components/ui/sonner"
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "./lib/client";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import PublicHome from "./pages/PublicHome";

function ProtectedRoute({ session, children }: { session: Session | null; children: React.ReactNode }) {
  return session ? <>{children}</> : <Navigate to="/admin" replace />;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const supabase = createClient();

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        console.error("Gagal memeriksa sesi:", error);
      }

      setSession(data?.session ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Memuat aplikasi...
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/admin" element={session ? <Navigate to="/admin/dashboard" replace /> : <Login />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute session={session}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </ThemeProvider>
  );
}