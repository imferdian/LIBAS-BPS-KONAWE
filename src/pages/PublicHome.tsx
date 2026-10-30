import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { createClient } from "../lib/client";
import {
  Trophy,
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  UsersRoundCollaboration,
  Search,
  ChevronRight,
  ChevronLeft,
  LogIn,
  Flame,
  Swords,
  Clock,
  Sparkles,
  Medal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ModeToggle } from "../components/mode-toogle";

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
  set1_team1: number | null;
  set1_team2: number | null;
  set2_team1: number | null;
  set2_team2: number | null;
  team1: { name: string };
  team2: { name: string };
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
            `id, team1_id, team2_id, scheduled_at, set1_team1, set1_team2, set2_team1, set2_team2,
             team1:teams!matches_team1_id_fkey(name),
             team2:teams!matches_team2_id_fkey(name)`
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
          set1_team1: m.set1_team1,
          set1_team2: m.set1_team2,
          set2_team1: m.set2_team1,
          set2_team2: m.set2_team2,
          team1: Array.isArray(m.team1) ? m.team1[0] : m.team1 || { name: "Tim 1" },
          team2: Array.isArray(m.team2) ? m.team2[0] : m.team2 || { name: "Tim 2" },
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

  const featuredMatch = upcomingMatches[0] || recentMatches[0];

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

        {/* Sidebar League Card (like reference) */}
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
        {/* Top Header Bar (like reference) */}
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-24 lg:pb-6 w-full">{/* pb-24 untuk space bottom nav mobile */}
          {loading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
              Memuat data liga...
            </div>
          ) : activeTab === "dashboard" ? (
            /* DASHBOARD BENTO GRID VIEW (Matching Reference) */
            <div className="space-y-6 animate-fade-in">
              {/* TOP ROW: Live/Featured Match (2 cols) + League Banner Card (1 col) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Featured / Next Match Card */}
                <Card className="lg:col-span-2 border-border/80 bg-linear-to-br from-card via-card to-primary/5 shadow-sm hover:shadow-md transition-all">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {upcomingMatches.length > 0 ? "Laga Terdekat" : "Laga Terakhir"}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-medium border-primary/30 text-primary">
                      {featuredMatch ? formatDate(featuredMatch.scheduled_at) : "Liga Selesai"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-2 pb-6">
                    {featuredMatch ? (
                      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
                        {/* Team 1 */}
                        <div className="flex flex-col items-center text-center gap-2">
                          <div className="h-16 w-16 rounded-2xl bg-secondary/80 flex items-center justify-center text-2xl font-black font-heading border border-border shadow-inner">
                            {featuredMatch.team1?.name?.charAt(0) || "A"}
                          </div>
                          <div>
                            <p className="font-heading font-bold text-sm md:text-base">{featuredMatch.team1?.name}</p>
                            <p className="text-[11px] text-muted-foreground">Tim A</p>
                          </div>
                        </div>

                        {/* Scores / VS */}
                        <div className="flex flex-col items-center justify-center gap-1.5 px-4">
                          {featuredMatch.set1_team1 !== null ? (
                            <div className="flex items-center gap-3">
                              <span className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight">
                                {featuredMatch.set1_team1} : {featuredMatch.set1_team2}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className="text-xl md:text-2xl font-heading font-bold text-muted-foreground">VS</span>
                              <span className="text-[11px] font-medium text-primary mt-1 flex items-center gap-1">
                                <Clock className="size-3" /> {formatTimeOnly(featuredMatch.scheduled_at)} WITA
                              </span>
                            </div>
                          )}
                          <span className="text-[10px] text-muted-foreground tracking-wider uppercase font-semibold">
                            Lapangan GOR Abunawas Konawe
                          </span>
                        </div>

                        {/* Team 2 */}
                        <div className="flex flex-col items-center text-center gap-2">
                          <div className="h-16 w-16 rounded-2xl bg-secondary/80 flex items-center justify-center text-2xl font-black font-heading border border-border shadow-inner">
                            {featuredMatch.team2?.name?.charAt(0) || "B"}
                          </div>
                          <div>
                            <p className="font-heading font-bold text-sm md:text-base">{featuredMatch.team2?.name}</p>
                            <p className="text-[11px] text-muted-foreground">Tim B</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="py-8 text-center text-xs text-muted-foreground">Belum ada pertandingan.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Right Top Card: League Highlights / Overview */}
                <Card className="border-border/80 bg-card shadow-sm flex flex-col justify-between">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Trophy className="size-4 text-primary" /> Info Musim
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px]">Aktif</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl bg-secondary/40 p-4 border border-border/50">
                      <p className="text-xs text-muted-foreground">Total Poin Tercipta</p>
                      <p className="font-heading text-2xl font-black text-foreground mt-0.5">{totalPointsScored}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Dari {matches.filter((m) => m.set1_team1 !== null).length} pertandingan yang selesai.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="rounded-lg bg-secondary/20 p-3 border border-border/40">
                        <span className="text-[11px] text-muted-foreground">Total Pasangan</span>
                        <p className="font-heading font-bold text-lg mt-0.5">{teams.length}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/20 p-3 border border-border/40">
                        <span className="text-[11px] text-muted-foreground">Total Laga</span>
                        <p className="font-heading font-bold text-lg mt-0.5">{matches.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* MIDDLE ROW: Top Performers (1 col) + League Standings (1 col) + Upcoming Fixtures (1 col) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Top Performers */}
                <Card className="border-border/80 shadow-sm">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Medal className="size-4 text-primary" /> Pasangan Unggulan
                    </CardTitle>
                    <button
                      onClick={() => setActiveTab("teams")}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Lihat Semua
                    </button>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-1">
                    {standings.slice(0, 4).map((s, idx) => (
                      <div
                        key={s.team_id}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-secondary/40 transition-colors duration-150"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-heading font-bold text-xs text-muted-foreground w-4">
                            {idx + 1}
                          </span>
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {s.team_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs truncate">{s.team_name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {s.player1} & {s.player2}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="font-mono text-xs font-bold shrink-0 ml-2">
                          {s.points} Pts
                        </Badge>
                      </div>
                    ))}
                    {standings.length === 0 && (
                      <p className="text-xs text-muted-foreground py-6 text-center">Belum ada tim.</p>
                    )}
                  </CardContent>
                </Card>

                {/* 2. League Standings Table */}
                <Card className="border-border/80 shadow-sm">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <BarChart3 className="size-4 text-primary" /> Top Klasemen
                    </CardTitle>
                    <button
                      onClick={() => setActiveTab("standings")}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Selengkapnya
                    </button>
                  </CardHeader>
                  <CardContent className="pt-1">
                    <div className="w-full text-xs overflow-x-auto">
                      <div className="grid grid-cols-[20px_1fr_30px_40px_40px_40px_40px] text-[11px] font-semibold text-muted-foreground pb-2 border-b border-border/60 min-w-[320px]">
                        <span>#</span>
                        <span>Tim</span>
                        <span className="text-center">M</span>
                        <span className="text-center">Skor</span>
                        <span className="text-center">Lawan</span>
                        <span className="text-center">+/−</span>
                        <span className="text-right">Pts</span>
                      </div>
                      <div className="divide-y divide-border/40">
                        {standings.slice(0, 5).map((s, idx) => (
                          <div
                            key={s.team_id}
                            className="grid grid-cols-[20px_1fr_30px_40px_40px_40px_40px] items-center py-2 hover:bg-secondary/20 transition-colors min-w-[320px]"
                          >
                            <span className="font-medium text-muted-foreground text-[11px]">{idx + 1}</span>
                            <span className="font-semibold truncate pr-2">{s.team_name}</span>
                            <span className="text-center text-muted-foreground">{s.played}</span>
                            <span className="text-center font-mono">{s.points_for}</span>
                            <span className="text-center font-mono text-muted-foreground">{s.points_against}</span>
                            <span className="text-center">
                              <span className={`font-mono font-bold ${s.points_for - s.points_against > 0 ? "text-green-600 dark:text-green-400" : s.points_for - s.points_against < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                                {s.points_for - s.points_against > 0 ? "+" : ""}{s.points_for - s.points_against}
                              </span>
                            </span>
                            <span className="text-right font-bold text-foreground">{s.points}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Upcoming Fixtures */}
                <Card className="border-border/80 shadow-sm">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <CalendarDays className="size-4 text-primary" /> Jadwal Mendatang
                    </CardTitle>
                    <button
                      onClick={() => setActiveTab("matches")}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Semua
                    </button>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-1">
                    {upcomingMatches.slice(0, 3).map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-lg border border-border/60 bg-secondary/10 hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                          <span>{formatDate(m.scheduled_at)}</span>
                          <span className="text-primary font-medium">Lapangan 1</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="truncate max-w-[42%]">{m.team1.name}</span>
                          <span className="text-[10px] text-muted-foreground px-1 font-normal">vs</span>
                          <span className="truncate max-w-[42%] text-right">{m.team2.name}</span>
                        </div>
                      </div>
                    ))}
                    {upcomingMatches.length === 0 && (
                      <p className="text-xs text-muted-foreground py-6 text-center">
                        Semua laga telah diselesaikan.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* BOTTOM ROW: Match Stats / Liga Summary & Recent Results */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Match Stats / Liga Summary (2 cols wide) */}
                <Card className="lg:col-span-2 border-border/80 shadow-sm">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Flame className="size-4 text-primary" /> Statistik & Keseimbangan Liga
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">Regulasi Set 21 Poin</span>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-1">
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between mb-1 text-[11px]">
                          <span className="text-muted-foreground">Persentase Laga Selesai</span>
                          <span className="font-semibold">
                            {matches.length > 0
                              ? Math.round((recentMatches.length / matches.length) * 100)
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{
                              width: `${matches.length > 0 ? (recentMatches.length / matches.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="p-3 rounded-lg bg-secondary/30 border border-border/40">
                          <p className="text-[11px] text-muted-foreground">Kemenangan Telak (2-0)</p>
                          <p className="font-heading font-bold text-base mt-1">
                            {recentMatches.filter((m) => {
                              const t1W = (m.set1_team1! > m.set1_team2! ? 1 : 0) + (m.set2_team1! > m.set2_team2! ? 1 : 0);
                              return t1W === 2 || t1W === 0;
                            }).length}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-secondary/30 border border-border/40">
                          <p className="text-[11px] text-muted-foreground">Hasil Seri (1-1)</p>
                          <p className="font-heading font-bold text-base mt-1">
                            {recentMatches.filter((m) => {
                              const t1W = (m.set1_team1! > m.set1_team2! ? 1 : 0) + (m.set2_team1! > m.set2_team2! ? 1 : 0);
                              return t1W === 1;
                            }).length}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-secondary/30 border border-border/40">
                          <p className="text-[11px] text-muted-foreground">Rata-rata Skor per Set</p>
                          <p className="font-heading font-bold text-base mt-1">
                            {recentMatches.length > 0
                              ? Math.round(totalPointsScored / (recentMatches.length * 4))
                              : 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Completed Matches */}
                <Card className="border-border/80 shadow-sm">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Swords className="size-4 text-primary" /> Hasil Terkini
                    </CardTitle>
                    <button
                      onClick={() => setActiveTab("matches")}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Semua
                    </button>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-1">
                    {recentMatches.slice(0, 3).map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-lg border border-border/60 bg-secondary/10 hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                          <span>{formatDate(m.scheduled_at)}</span>
                          <span className="font-semibold text-foreground">
                            Set 1: {m.set1_team1}-{m.set1_team2} · Set 2: {m.set2_team1}-{m.set2_team2}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="truncate max-w-[45%]">{m.team1.name}</span>
                          <span className="text-[10px] text-muted-foreground">vs</span>
                          <span className="truncate max-w-[45%] text-right">{m.team2.name}</span>
                        </div>
                      </div>
                    ))}
                    {recentMatches.length === 0 && (
                      <p className="text-xs text-muted-foreground py-6 text-center">
                        Belum ada pertandingan selesai.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : activeTab === "standings" ? (
            /* FULL STANDINGS VIEW */
            <Card className="animate-fade-in border-border/80">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-heading text-lg">Klasemen Lengkap Liga</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Menang 2-0 = 3 poin · Seri 1-1 = 1 poin · Kalah 0-2 = 0 poin
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-[11px]">
                        <th className="py-2.5 px-3 text-left w-10">Pos</th>
                        <th className="py-2.5 px-3 text-left">Pasangan</th>
                        <th className="py-2.5 px-3 text-left">Pemain</th>
                        <th className="py-2.5 px-3 text-center">Main</th>
                        <th className="py-2.5 px-3 text-center">M</th>
                        <th className="py-2.5 px-3 text-center">S</th>
                        <th className="py-2.5 px-3 text-center">K</th>
                        <th className="py-2.5 px-2 text-center">Poin</th>
                        <th className="py-2.5 px-0 text-center">Skor Tim</th>
                        <th className="py-2.5 px-0 text-center">Skor Lawan</th>
                        <th className="py-2.5 px-0 text-center">Selisih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {standings.map((s, idx) => (
                        <tr key={s.team_id} className="hover:bg-secondary/30 transition-colors">
                          <td className="py-3 px-3 font-bold text-foreground">
                            {idx === 0 ? <Medal className="size-3.5 text-yellow-500" /> : idx === 1 ? <Medal className="size-3.5 text-gray-400" /> : idx === 2 ? <Medal className="size-3.5 text-amber-600" /> : idx + 1}
                          </td>
                          <td className="py-3 px-3 font-semibold text-foreground">{s.team_name}</td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {s.player1} & {s.player2}
                          </td>
                          <td className="py-3 px-3 text-center text-muted-foreground">{s.played}</td>
                          <td className="py-3 px-3 text-center text-green-600 dark:text-green-400 font-semibold">{s.wins}</td>
                          <td className="py-3 px-3 text-center text-muted-foreground">{s.draws}</td>
                          <td className="py-3 px-3 text-center text-red-600 dark:text-red-400">{s.losses}</td>
                          <td className="py-3 px-3 text-center font-heading font-black text-sm text-primary">
                            {s.points}
                          </td>
                          <td className="py-3 px-3 text-center text-muted-foreground">{s.points_for}</td>
                          <td className="py-3 px-3 text-center text-muted-foreground">{s.points_against}</td>
                          <td className="py-3 px-3 text-center font-semibold">
                            <span className={s.points_for - s.points_against > 0 ? "text-green-600 dark:text-green-400" : s.points_for - s.points_against < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}>
                              {s.points_for - s.points_against > 0 ? "+" : ""}{s.points_for - s.points_against}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : activeTab === "matches" ? (
            /* FULL MATCHES / JADWAL & HASIL VIEW */
            <div className="space-y-6 animate-fade-in">
              <Card className="border-border/80">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Semua Jadwal & Hasil Pertandingan</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Daftar lengkap pertandingan liga badminton LIBAS.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {matches.map((m) => {
                    const isDone = m.set1_team1 !== null;
                    return (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-all flex flex-col sm:flex-row items-center justify-between gap-4"
                      >
                        <div className="flex flex-col gap-1 w-full sm:w-auto">
                          <span className="text-[11px] text-muted-foreground">{formatDate(m.scheduled_at)}</span>
                          <span className="text-xs font-semibold">Lapangan GOR Abunawas Konawe</span>
                        </div>

                        <div className="flex items-center justify-center gap-4 w-full sm:w-auto">
                          <span className="font-heading font-bold text-sm text-right w-36 truncate">
                            {m.team1.name}
                          </span>
                          <div className="px-3 py-1 rounded-lg bg-secondary text-xs font-mono font-bold">
                            {isDone ? `${m.set1_team1}-${m.set1_team2} | ${m.set2_team1}-${m.set2_team2}` : "VS"}
                          </div>
                          <span className="font-heading font-bold text-sm text-left w-36 truncate">
                            {m.team2.name}
                          </span>
                        </div>

                        <Badge variant={isDone ? "default" : "outline"} className="text-[11px] shrink-0">
                          {isDone ? "Selesai" : "Akan Datang"}
                        </Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ) : (
            /* TEAMS VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">
              {teams.map((t) => (
                <Card key={t.id} className="border-border/80 hover:border-primary/40 transition-all">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary font-heading font-black text-sm flex items-center justify-center shrink-0">
                      {t.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-sm truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.player1} & {t.player2}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
