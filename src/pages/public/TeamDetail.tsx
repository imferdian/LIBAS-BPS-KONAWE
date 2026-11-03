import { useState, useMemo } from "react";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { cn } from "cn";

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

type Team = {
  id: string;
  name: string;
  player1: string;
  player2: string;
};

interface TeamDetailProps {
  teamId: string | null;
  teams: Team[];
  matches: Match[];
  source: "standings" | "matches" | "teams";
  onBack: () => void;
}

function formatDate(dateString: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Makassar",
  }).format(date);
}

export function TeamDetail({ teamId, teams, matches, source, onBack }: TeamDetailProps) {
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "history">("all");

  const team = useMemo(() => teams.find((t) => t.id === teamId), [teams, teamId]);

  const { history, upcoming, stats, standing } = useMemo(() => {
    if (!teamId) return { history: [], upcoming: [], stats: { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0, totalMatches: 0, winsetsFor: 0, winsetsAgainst: 0, points: 0 }, standing: null };

    const teamMatches = matches.filter((m) => m.team1_id === teamId || m.team2_id === teamId);
    const now = new Date();

    const hist = teamMatches
      .filter((m) => m.set1_team1 !== null && m.set1_team2 !== null && m.set2_team1 !== null && m.set2_team2 !== null)
      .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

    const upc = teamMatches
      .filter((m) => {
        const hasScore = m.set1_team1 !== null && m.set1_team2 !== null && m.set2_team1 !== null && m.set2_team2 !== null;
        return !hasScore && new Date(m.scheduled_at) >= now;
      })
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

    let wins = 0, losses = 0, draws = 0, pointsFor = 0, pointsAgainst = 0, winsetsFor = 0, winsetsAgainst = 0, points = 0;
    hist.forEach((m) => {
      const isTeam1 = m.team1_id === teamId;
      const ourScore = isTeam1 ? [m.set1_team1, m.set2_team1] : [m.set1_team2, m.set2_team2];
      const theirScore = isTeam1 ? [m.set1_team2, m.set2_team2] : [m.set1_team1, m.set2_team1];

      if (ourScore[0] !== null && ourScore[1] !== null && theirScore[0] !== null && theirScore[1] !== null) {
        pointsFor += ourScore[0] + ourScore[1];
        pointsAgainst += theirScore[0] + theirScore[1];

        const ourSets = (ourScore[0] > theirScore[0] ? 1 : 0) + (ourScore[1] > theirScore[1] ? 1 : 0);
        const theirSets = 2 - ourSets;
        winsetsFor += ourSets;
        winsetsAgainst += theirSets;

        if (ourSets > theirSets) {
          wins++;
          points += 3;
        } else if (ourSets < theirSets) {
          losses++;
        } else {
          draws++;
          points += 1;
        }
      }
    });

    // Calculate standing position
    const allStandings = teams.map((t) => {
      let tw = 0, tl = 0, td = 0, tpts = 0, tpf = 0, tpa = 0, tswf = 0, tswa = 0;
      matches.forEach((m) => {
        if (m.set1_team1 === null || m.set1_team2 === null || m.set2_team1 === null || m.set2_team2 === null) return;
        if (m.team1_id !== t.id && m.team2_id !== t.id) return;

        const isTeam1 = m.team1_id === t.id;
        const ourScore = isTeam1 ? [m.set1_team1, m.set2_team1] : [m.set1_team2, m.set2_team2];
        const theirScore = isTeam1 ? [m.set1_team2, m.set2_team2] : [m.set1_team1, m.set2_team1];

        tpf += ourScore[0] + ourScore[1];
        tpa += theirScore[0] + theirScore[1];

        const ourSets = (ourScore[0] > theirScore[0] ? 1 : 0) + (ourScore[1] > theirScore[1] ? 1 : 0);
        const theirSets = 2 - ourSets;
        tswf += ourSets;
        tswa += theirSets;

        if (ourSets > theirSets) {
          tw++;
          tpts += 3;
        } else if (ourSets < theirSets) {
          tl++;
        } else {
          td++;
          tpts += 1;
        }
      });

      return { team_id: t.id, team_name: t.name, wins: tw, losses: tl, draws: td, points: tpts, points_for: tpf, points_against: tpa, sets_won: tswf, sets_lost: tswa };
    }).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aSetDiff = a.sets_won - a.sets_lost;
      const bSetDiff = b.sets_won - b.sets_lost;
      if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
      const aPtDiff = a.points_for - a.points_against;
      const bPtDiff = b.points_for - b.points_against;
      return bPtDiff - aPtDiff;
    });

    const position = allStandings.findIndex((s) => s.team_id === teamId) + 1;
    const standing = { position, team_id: teamId, team_name: team?.name || "", wins, losses, draws, points, sets_won: winsetsFor, sets_lost: winsetsAgainst, points_for: pointsFor, points_against: pointsAgainst };

    return { history: hist, upcoming: upc, stats: { wins, losses, draws, pointsFor, pointsAgainst, totalMatches: wins + losses + draws, winsetsFor, winsetsAgainst, points }, standing };
  }, [teamId, matches, teams, team?.name]);

  const renderUpcomingMatch = (m: Match) => {
    const isTeam1 = m.team1_id === teamId;
    const opponent = isTeam1 ? m.team2 : m.team1;
    const ourTeam = isTeam1 ? m.team1 : m.team2;

    return (
      <div key={m.id} className="border-l-4 border border-border border-l-blue-500 bg-card/50 rounded-lg px-4 pb-5 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 uppercase text-xs font-bold tracking-wide">
              Pekan {m.week_number}
            </Badge>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-3.5" />
              <span className="text-xs font-medium">{formatDate(m.scheduled_at)}</span>
            </div>
          </div>
          <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase text-[10px] font-bold">
            Akan Datang
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-heading text-xs font-bold shrink-0">
              {ourTeam.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{ourTeam.name}</p>
              <p className="text-xs text-muted-foreground truncate">{ourTeam.player1} / {ourTeam.player2}</p>
            </div>
          </div>

          <span className="text-xs font-bold text-muted-foreground px-2">VS</span>

          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground font-heading text-xs font-bold shrink-0">
              {opponent.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{opponent.name}</p>
              <p className="text-xs text-muted-foreground truncate">{opponent.player1} / {opponent.player2}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryMatch = (m: Match) => {
    const isTeam1 = m.team1_id === teamId;
    const opponent = isTeam1 ? m.team2 : m.team1;
    const ourTeam = isTeam1 ? m.team1 : m.team2;
    const ourScore = isTeam1 ? [m.set1_team1, m.set2_team1] : [m.set1_team2, m.set2_team2];
    const theirScore = isTeam1 ? [m.set1_team2, m.set2_team2] : [m.set1_team1, m.set2_team1];

    let result: "win" | "draw" | "loss" | null = null;
    let ourSets = 0, theirSets = 0;
    if (ourScore[0] !== null && ourScore[1] !== null && theirScore[0] !== null && theirScore[1] !== null) {
      ourSets = (ourScore[0]! > theirScore[0]! ? 1 : 0) + (ourScore[1]! > theirScore[1]! ? 1 : 0);
      theirSets = 2 - ourSets;
      if (ourSets > theirSets) result = "win";
      else if (ourSets < theirSets) result = "loss";
      else result = "draw";
    }

    const resultColor = result === "win" ? "bg-emerald-600 text-white" : result === "loss" ? "bg-red-600 text-white" : "bg-amber-600 text-white";
    const resultText = result === "win" ? "MENANG" : result === "loss" ? "KALAH" : "SERI";

    return (
      <div key={m.id} className="rounded-2xl border-l-4 border border-border border-l-green-500 bg-card/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Badge variant="outline" className="bg-emerald-500/10 text-green-400 border-border uppercase text-[10px] font-bold tracking-[0.12em]">
              GAMEWEEK {m.week_number}
            </Badge>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-3.5" />
              <span className="text-xs font-medium">{formatDate(m.scheduled_at)}</span>
            </div>
          </div>

          <Badge className={`${resultColor} uppercase text-[10px] font-bold border-0 px-3 py-1`}>
            {resultText}
          </Badge>
        </div>

        <div className="mb-3 flex items-center justify-end gap-4 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground pr-2">
          <span>Set 1</span>
          <span className="pr-0.5">Set 2</span>
          <span>Skor</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-600 text-foreground font-heading text-sm font-bold shrink-0">
                {ourTeam.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-md font-bold text-foreground">{ourTeam.name}</p>
                <p className="text-xs text-muted-foreground truncate">{ourTeam.player1} / {ourTeam.player2}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold tabular-nums text-foreground",
                {
                  "border border-emerald-500/15 text-emerald-400": result === "win",
                  "border border-amber-500/15 text-amber-400": result === "draw",
                  "text-muted-foreground": result === "loss",
                }
              )}>
                {ourScore[0]}
              </div>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold tabular-nums text-foreground",
                {
                  "border border-emerald-500/15 text-emerald-400": result === "win",
                  "border border-amber-500/15 text-amber-400": result === "draw",
                  "text-muted-foreground": result === "loss",
                }
              )}>
                {ourScore[1]}
              </div>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold tabular-nums",
                {
                  "bg-emerald-500/15 text-emerald-400": ourSets > 1,
                  "bg-amber-500/15 text-amber-400": ourSets === 1,
                  "bg-red-500/15 text-red-400": ourSets === 0,
                }
              )}>
                {ourSets}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground font-heading text-sm font-bold shrink-0">
                {opponent.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-md font-bold text-foreground">{opponent.name}</p>
                <p className="text-xs text-muted-foreground truncate">{opponent.player1} / {opponent.player2}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold tabular-nums text-foreground",
                {
                  "text-muted-foreground": result === "win",
                  "border border-amber-500/15 text-amber-400": result === "draw",
                  "border border-emerald-500/15 text-emerald-400": result === "loss",
                }
              )}>
                {theirScore[0]}
              </div>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold tabular-nums text-foreground",
                {
                  "text-muted-foreground": result === "win",
                  "border border-amber-500/15 text-amber-400": result === "draw",
                  "border border-emerald-500/15 text-emerald-400": result === "loss",
                }
              )}>
                {theirScore[1]}
              </div>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold tabular-nums",
                {
                  "bg-emerald-500/15 text-emerald-400": theirSets > 1,
                  "bg-amber-500/15 text-amber-400": theirSets === 1,
                  "bg-red-500/15 text-red-400": theirSets === 0,
                }
              )}>
                {theirSets}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const historyByWeek = useMemo(() => {
    const grouped: Record<number, Match[]> = {};
    history.forEach((m) => {
      const week = m.week_number || 0;
      if (!grouped[week]) grouped[week] = [];
      grouped[week].push(m);
    });
    return Object.entries(grouped)
      .sort(([weekA], [weekB]) => parseInt(weekB) - parseInt(weekA))
      .map(([week, matches]) => ({ week: parseInt(week), matches }));
  }, [history]);

  if (!team) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Tim tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background font-sans overflow-hidden">
      {/* Header - Back + Breadcrumb */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm px-4 md:px-6 py-3 shrink-0 relative z-10">
        <div className="flex items-center gap-2 text-sm overflow-x-auto">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors shrink-0 relative z-20"
          >
            <ChevronLeft className="size-4" />
          </button>
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground shrink-0">
            {source === "standings" ? "Klasemen" : source === "matches" ? "Pertandingan" : "Teams"}
          </span>
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground truncate">{team.name}</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto px-4 md:px-6 py-6 space-y-6">
        {/* Team Info Card */}
        <div className="rounded-[28px] border border-border bg-card backdrop-blur-md  p-4 md:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="grid gap-5 xl:grid-cols-[auto_1fr_auto] xl:items-center mb-5">
            <div className="flex items-center gap-4 md:gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card text-3xl font-black text-foreground shadow-inner border border-border md:h-24 md:w-24 md:text-4xl">
                {team.name.split(/\s+/).slice(0, 2).map(w => w[0]).join("")}
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-3 uppercase tracking-[0.18em] text-foreground text-[7px] font-semibold">
                <Badge className="bg-background text-emerald-400 border border-border text-[8px]">Divisi Ganda Putra</Badge>
                <span className="text-foreground">|</span>
                <Badge className="bg-background text-amber-400 border border-border text-[8px]">Libas 2026</Badge>
              </div>
              <h1 className="mt-2 font-heading text-2xl font-black tracking-wide text-foreground md:text-4xl">
                {team.name}
              </h1>
              <p className="mt-1 text-base text-muted-foreground md:text-lg">
                {team.player1} & {team.player2}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <div className="rounded-xl border border-border bg-background/60 p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] space-y-px">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Posisi Liga</p>
              <p className="text-2xl font-bold text-emerald-400">#{standing?.position}</p>
              <p className="text-xs text-muted-foreground">dari {teams.length}</p>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] space-y-px">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Dimainkan</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalMatches}</p>
              <p className="text-xs text-muted-foreground">{stats.wins}M {stats.draws}S {stats.losses}K</p>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] space-y-px">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total Poin Liga</p>
              <p className="text-2xl font-bold text-amber-400">{standing?.points}</p>
              <p className="text-xs text-muted-foreground">Sistem 3-1-0</p>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] space-y-px">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Selisih Skor</p>
              <p className={`text-2xl font-bold ${(stats.pointsFor - stats.pointsAgainst) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {(stats.pointsFor - stats.pointsAgainst) >= 0 ? "+" : ""}{stats.pointsFor - stats.pointsAgainst}
              </p>
              <p className="text-xs text-muted-foreground">{stats.pointsFor}/{stats.pointsAgainst}</p>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] space-y-px">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Game Set W/L</p>
              <p className="text-2xl font-bold text-indigo-400">{stats.winsetsFor}-{stats.winsetsAgainst}</p>
              <p className="text-xs text-muted-foreground">
                {stats.totalMatches > 0 ? ((stats.winsetsFor / (stats.winsetsFor + stats.winsetsAgainst)) * 100).toFixed(0) : 0}% Win 
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] space-y-px">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Rata-Rata Set</p>
              <p className="text-2xl font-bold text-cyan-400">
                {stats.totalMatches > 0 ? (stats.pointsFor / (stats.winsetsFor + stats.winsetsAgainst)).toFixed(1) : "0.0"}
              </p>
              <p className="text-xs text-muted-foreground">Poin/set</p>
            </div>
          </div>
        </div>


        {/* Tabs */}
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="flex gap-2 border-b border-border px-4 md:px-0 min-w-max">
            {[
              { key: "all" as const, label: "Semua Pertandingan", count: upcoming.length + history.length },
              { key: "upcoming" as const, label: "Jadwal Mendatang", count: upcoming.length },
              { key: "history" as const, label: "Riwayat", count: history.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && <span className="ml-2 text-xs bg-muted px-2 py-1 rounded-full">{tab.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-10">
          {activeTab === "all" && (
            <div className="space-y-6">
              {/* Upcoming Fixtures Section */}
              {upcoming.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Upcoming Fixtures</h3>
                  <div className="space-y-2 grid sm:grid-cols-2 gap-2">
                    {upcoming.map((m) => renderUpcomingMatch(m))}
                  </div>
                </div>
              )}

              {/* Match History Section - Grouped by Week */}
              {history.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Match History</h3>
                  {historyByWeek.map((group) => (
                    <div key={group.week} className="space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                        Minggu {group.week}
                      </h4>
                      {group.matches.map((m) => renderHistoryMatch(m))}
                    </div>
                  ))}
                </div>
              )}

              {upcoming.length === 0 && history.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-12 border border-dashed rounded-lg">
                  Tidak ada pertandingan
                </p>
              )}
            </div>
          )}

          {activeTab === "upcoming" && (
            <div className="space-y-3">
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12 border border-dashed rounded-lg">
                  Tidak ada pertandingan terjadwal
                </p>
              ) : (
                upcoming.map((m) => renderUpcomingMatch(m))
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12 border border-dashed rounded-lg">
                  Belum ada pertandingan selesai
                </p>
              ) : (
                historyByWeek.map((group) => (
                  <div key={group.week} className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                      Minggu {group.week}
                    </h4>
                    {group.matches.map((m) => renderHistoryMatch(m))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
