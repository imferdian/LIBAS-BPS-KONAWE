// import { useState } from 'react'
import { ThemeProvider } from "./components/theme-provider"
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "./lib/client";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";



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

  return session ? 
  <ThemeProvider defaultTheme="dark" storageKey="">
    <AdminDashboard />
  </ThemeProvider> 
  : 
  <Login />;
}