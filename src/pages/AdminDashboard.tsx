import { useState } from "react";
import { createClient } from "../lib/client";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Trophy,
  UserGroup,
  UsersRoundCollaboration,
  X,
  User,
  Settings,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ModeToggle } from "../components/mode-toogle";
import Teams from "./Teams";
import Matches from "./Matches";
import Standings from "./Standings";

const supabase = createClient();

export default function AdminDashboard() {
  const [minimized, setMinimized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<"dashboard" | "matches" | "standings" | "teams" | "players" | "settings">("dashboard");

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const navItems = [
    { key: "dashboard" as const, icon: LayoutDashboard, label: "Dashboard" },
    { key: "matches" as const, icon: Trophy, label: "Pertandingan" },
    { key: "standings" as const, icon: BarChart3, label: "Klasemen" },
    { key: "teams" as const, icon: UsersRoundCollaboration, label: "Teams" },
    { key: "players" as const, icon: User, label: "Pemain" },
    { key: "settings" as const, icon: Settings, label: "Pengaturan" },
  ];

  return (
    <div className="flex h-screen bg-background font-sans">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="absolute left-4 top-4 z-50 rounded-md p-2 hover:bg-sidebar-accent lg:hidden"
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-out lg:relative lg:translate-x-0 ${
          minimized ? "w-16" : "w-64"
        } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 p-4">
          {!minimized && (
            <h1 className="font-heading font-bold text-lg truncate">Libas</h1>
          )}
          <button
            type="button"
            onClick={() => setMinimized(!minimized)}
            className="ml-auto hidden rounded-md p-1 transition-colors hover:bg-sidebar-accent lg:inline-flex"
            aria-label={minimized ? "Expand sidebar" : "Collapse sidebar"}
          >
            {minimized ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex flex-col gap-1 px-2 flex-1">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeView === item.key;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveView(item.key);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon size={18} />
                {!minimized && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-sidebar-border p-3">
          <Button
            onClick={handleLogout}
            variant="destructive"
            size="sm"
            className="w-full gap-2"
          >
            {minimized ? <LogOut size={16} /> : <><LogOut size={16} /> Logout</>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {activeView === "matches" ? (
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <Matches />
          </div>
        ) : activeView === "standings" ? (
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <Standings />
          </div>
        ) : activeView === "teams" ? (
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <Teams />
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="border-b border-border bg-background/95 backdrop-blur-sm px-4 md:px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-heading text-2xl font-semibold tracking-tight pt-6 lg:pt-0">
                  Dashboard
                </h2>
                <ModeToggle />
              </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "Total Pertandingan", value: "28", icon: Trophy },
                  { title: "Teams", value: "8", icon: UsersRoundCollaboration },
                  { title: "Atlet Terdaftar", value: "16", icon: UserGroup },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <Card
                      key={i}
                      className="hover:shadow-md hover:scale-[103%] hover:-translate-y-1 transition-all duration-200 animate-fade-in"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">
                              {stat.title}
                            </p>
                            <p className="text-3xl font-bold text-foreground">
                              {stat.value}
                            </p>
                          </div>
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="size-5 text-primary" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Activity Cards */}
              <div>
                <h3 className="font-heading text-lg font-semibold mb-4">
                  Ringkasan Aktivitas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      key: "matches" as const,
                      title: "Pertandingan",
                      description: "Lihat jadwal dan hasil pertandingan",
                      icon: Trophy,
                    },
                    {
                      key: "standings" as const,
                      title: "Klasemen",
                      description: "Analisis peringkat dan performa tim",
                      icon: BarChart3,
                    },
                    {
                      key: "teams" as const,
                      title: "Pasangan",
                      description: "Kelola daftar tim dan pemain",
                      icon: UsersRoundCollaboration,
                    },
                    {
                      key: "matches" as const,
                      title: "Jadwal",
                      description: "Atur jadwal pertandingan mendatang",
                      icon: CalendarDays,
                    },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveView(item.key)}
                        className="group w-full rounded-xl border border-border bg-card text-left transition-all duration-200 hover:shadow-md hover:-translate-y-1 animate-fade-in"
                        style={{ animationDelay: `${(300 + i * 80)}ms` }}
                      >
                        <Card className="border-0 shadow-none bg-transparent">
                          <CardContent className="pt-6 space-y-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                              <Icon className="size-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm text-foreground">
                                {item.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 pt-2 text-xs font-medium text-primary group-hover:translate-x-1 transition-transform">
                              Lihat <ArrowRight size={14} />
                            </div>
                          </CardContent>
                        </Card>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
