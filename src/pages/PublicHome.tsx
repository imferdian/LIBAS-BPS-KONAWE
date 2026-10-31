import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { createClient } from "../lib/client";
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  UsersRoundCollaboration,
  Search,
  ChevronRight,
  ChevronLeft,
  LogIn,
  Sparkles,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ModeToggle } from "../components/mode-toogle";
import { PublicDashboard } from "./public/PublicDashboard";
import { PublicStandings } from "./public/PublicStandings";
import { PublicMatches } from "./public/PublicMatches";
import { PublicTeams } from "./public/PublicTeams";

const supabase = createClient();

type Team = {
  id: string;
  name: string;
  player1: string;
  player2: string;
};

type Match = {
  id: string;
  team1_id: string;
  team2_id: string;
  scheduled_at: string;
  week_number: number | null;
  set1_team1: number | null;
  set1_team2: number | null;
  set2_team1: number | null;
  set2_team2: number | null;
  team1: { name: string; player1: string; player2: string };
  team2: { name: string; player1: string; player2: string };
};

type Standing = {
  team_id: string;
  team_name: string;
  player1: string;
  player2: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  sets_won: number;
  sets_lost: number;
  points_for: number;
  points_against: number;
  points: number;
};

function formatDate(dateString: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Makassar",
  }).format(date);
}

function formatTimeOnly(dateString: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Makassar",
  }).format(date);
}

export default function PublicHome() {
  const [minimized, setMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "matches" | "standings" | "teams">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function fetchData() {
      try {
        const { data: teamsData } = await supabase
          .from("teams")
          .select("id, name, player1, player2")
          .order("name");

        const { data: matchesData } = await supabase
          .from("matches")
          .select(
            `id, team1_id, team2_id, scheduled_at, week_number, set1_team1, set1_team2, set2_team1, set2_team2,
             team1:teams!matches_team1_id_fkey(name, player1, player2),
             team2:teams!matches_team2_id_fkey(name, player1, player2)`
          )
          .order("scheduled_at", { ascending: true });

        if (!alive) return;

        setTeams(teamsData ?? []);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsedMatches: Match[] = (matchesData ?? []).map((m: any) => ({
          id: m.id,
          team1_id: m.team1_id,
          team2_id: m.team2_id,
          scheduled_at: m.scheduled_at,
          week_number: m.week_number ?? null,
          set1_team1: m.set1_team1,
          set1_team2: m.set1_team2,
          set2_team1: m.set2_team1,
          set2_team2: m.set2_team2,
          team1: Array.isArray(m.team1) ? m.team1[0] : m.team1 || { name: "Tim 1", player1: "", player2: "" },
          team2: Array.isArray(m.team2) ? m.team2[0] : m.team2 || { name: "Tim 2", player1: "", player2: "" },
        }));

        setMatches(parsedMatches);
      } catch (err) {
        console.error("Gagal memuat data:", err);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void fetchData();
    return () => {
      alive = false;
    };
  }, []);

  const standings: Standing[] = useMemo(() => {
    const map = new Map<string, Standing>();

    teams.forEach((t) => {
      map.set(t.id, {
        team_id: t.id,
        team_name: t.name,
        player1: t.player1,
        player2: t.player2,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        sets_won: 0,
        sets_lost: 0,
        points_for: 0,
        points_against: 0,
        points: 0,
      });
    });

    matches.forEach((m) => {
      if (
        m.set1_team1 === null ||
        m.set1_team2 === null ||
        m.set2_team1 === null ||
        m.set2_team2 === null
      )
        return;

      const t1 = map.get(m.team1_id);
      const t2 = map.get(m.team2_id);
      if (!t1 || !t2) return;

      t1.played++;
      t2.played++;

      t1.points_for += m.set1_team1 + m.set2_team1;
      t1.points_against += m.set1_team2 + m.set2_team2;
      t2.points_for += m.set1_team2 + m.set2_team2;
      t2.points_against += m.set1_team1 + m.set2_team1;

      const t1Set1 = m.set1_team1 > m.set1_team2 ? 1 : 0;
      const t1Set2 = m.set2_team1 > m.set2_team2 ? 1 : 0;
      const t1Sets = t1Set1 + t1Set2;
      const t2Sets = 2 - t1Sets;

      t1.sets_won += t1Sets;
      t1.sets_lost += t2Sets;
      t2.sets_won += t2Sets;
      t2.sets_lost += t1Sets;

      if (t1Sets === 2) {
        t1.wins++;
        t1.points += 3;
        t2.losses++;
      } else if (t2Sets === 2) {
        t2.wins++;
        t2.points += 3;
        t1.losses++;
      } else {
        t1.draws++;
        t2.draws++;
        t1.points += 1;
        t2.points += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aSetDiff = a.sets_won - a.sets_lost;
      const bSetDiff = b.sets_won - b.sets_lost;
      if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
      const aPtDiff = a.points_for - a.points_against;
      const bPtDiff = b.points_for - b.points_against;
      if (bPtDiff !== aPtDiff) return bPtDiff - aPtDiff;
      return a.team_name.localeCompare(b.team_name);
    });
  }, [teams, matches]);

  const upcomingMatches = useMemo(() => {
    return matches.filter(
      (m) =>
        m.set1_team1 === null ||
        m.set1_team2 === null ||
        m.set2_team1 === null ||
        m.set2_team2 === null
    );
  }, [matches]);

  const recentMatches = useMemo(() => {
    return matches
      .filter(
        (m) =>
          m.set1_team1 !== null &&
          m.set1_team2 !== null &&
          m.set2_team1 !== null &&
          m.set2_team2 !== null
      )
      .slice()
      .reverse();
  }, [matches]);

  const totalPointsScored = useMemo(() => {
    return matches.reduce((acc, m) => {
      if (m.set1_team1 !== null && m.set1_team2 !== null) {
        acc += m.set1_team1 + m.set1_team2;
      }
      if (m.set2_team1 !== null && m.set2_team2 !== null) {
        acc += m.set2_team1 + m.set2_team2;
      }
      return acc;
    }, 0);
  }, [matches]);

  const navItems = [
    { key: "dashboard" as const, icon: LayoutDashboard, label: "Dashboard" },
    { key: "matches" as const, icon: CalendarDays, label: "Pertandingan" },
    { key: "standings" as const, icon: BarChart3, label: "Klasemen" },
    { key: "teams" as const, icon: UsersRoundCollaboration, label: "Pasangan" },
  ];

  return (
    <div className="flex flex-col h-screen bg-background font-sans overflow-hidden lg:flex-row">
      {/* Sidebar - Hidden on mobile */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 z-40 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-out h-screen ${
          minimized ? "w-16" : "w-64"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 p-4 border-b border-sidebar-border">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-heading font-black shadow-sm">
            🏸
          </div>
          {!minimized && (
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-bold text-base tracking-tight truncate">
                LIBAS
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                Liga Badminton Statistik
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setMinimized(!minimized)}
            className="ml-auto rounded-md p-1.5 transition-colors hover:bg-sidebar-accent text-muted-foreground"
            aria-label={minimized ? "Expand sidebar" : "Collapse sidebar"}
          >
            {minimized ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex flex-col gap-1.5 px-3 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActiveTab(item.key);
                }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {!minimized && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar League Card */}
        {!minimized && (
          <div className="p-3">
            <Card className="bg-primary/5 border-primary/20 p-3 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="size-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Musim 2026</span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
                Sistem setengah kompetisi 2 set dengan regulasi resmi BWF.
              </p>
              <div className="flex items-center justify-between text-[11px] font-medium text-primary">
                <span>{teams.length} Pasangan</span>
                <span>{matches.length} Laga</span>
              </div>
            </Card>
          </div>
        )}

        {/* Sidebar Footer Link */}
        <div className="border-t border-sidebar-border p-3">
          <Link to="/admin">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs border-sidebar-border hover:bg-sidebar-accent"
            >
              <LogIn size={15} />
              {!minimized && "Masuk Admin"}
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden w-full lg:ml-0" style={{ marginLeft: minimized && window.innerWidth >= 1024 ? "64px" : minimized ? "0" : window.innerWidth >= 1024 ? "256px" : "0" }}>
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/60 backdrop-blur-md px-4 md:px-6 shrink-0 gap-4">
          <div>
            <h2 className="font-heading font-bold text-base md:text-lg flex items-center gap-2">
              Halo, Penggemar Badminton! 👋
            </h2>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Pantau klasemen terbaru, jadwal laga, dan skor langsung liga LIBAS.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari tim atau pasangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs bg-secondary/40 border-border"
              />
            </div>
            <ModeToggle />
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-24 lg:pb-6 w-full">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
              Memuat data liga...
            </div>
          ) : activeTab === "dashboard" ? (
            <PublicDashboard
              teams={teams}
              matches={matches}
              standings={standings}
              upcomingMatches={upcomingMatches}
              recentMatches={recentMatches}
              totalPointsScored={totalPointsScored}
              formatDate={formatDate}
              formatTimeOnly={formatTimeOnly}
              onViewMatches={() => setActiveTab("matches")}
              onViewStandings={() => setActiveTab("standings")}
              onViewTeams={() => setActiveTab("teams")}
            />
          ) : activeTab === "standings" ? (
            <PublicStandings standings={standings} />
          ) : activeTab === "matches" ? (
            <PublicMatches matches={matches} formatDate={formatDate} />
          ) : (
            <PublicTeams teams={teams} />
          )}
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-card/95 backdrop-blur-sm lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-3 transition-all duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={20} className="shrink-0" />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
