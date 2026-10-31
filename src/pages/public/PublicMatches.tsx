import { useState, useMemo } from "react";
// import { Badge } from "../../components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, Trophy, CheckCircle2, Scale, Building2, Users } from "lucide-react";

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

interface PublicMatchesProps {
  matches: Match[];
  formatDate: (dateString: string) => string;
}

function formatMatchDateOnly(dateString?: string) {
  if (!dateString) return "Jumat, 30 Okt 2026";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Jumat, 30 Okt 2026";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Makassar",
  }).format(date);
}

export function PublicMatches({ matches, formatDate }: PublicMatchesProps) {
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);

  const weeks = useMemo(() => {
    const weekSet = new Set<number>();
    matches.forEach((m) => {
      if (m.week_number !== null) weekSet.add(m.week_number);
    });
    return Array.from(weekSet).sort((a, b) => a - b);
  }, [matches]);

  const activeWeek = useMemo(() => {
    if (currentWeek !== null && weeks.includes(currentWeek)) return currentWeek;
    return weeks.length > 0 ? weeks[0] : null;
  }, [currentWeek, weeks]);

  const weekMatches = useMemo(() => {
    if (activeWeek === null) return matches;
    return matches.filter((m) => m.week_number === activeWeek);
  }, [matches, activeWeek]);

  const weekIdx = activeWeek !== null ? weeks.indexOf(activeWeek) : 0;
  const prevWeek = weekIdx > 0 ? weeks[weekIdx - 1] : null;
  const nextWeek = weekIdx < weeks.length - 1 ? weeks[weekIdx + 1] : null;

  const stats = useMemo(() => {
    const completed = weekMatches.filter((m) => m.set1_team1 !== null).length;
    const upcoming = weekMatches.filter((m) => m.set1_team1 === null).length;

    const uniquePlayers = new Set<string>();
    weekMatches.forEach((m) => {
      if (m.team1.player1) uniquePlayers.add(m.team1.player1);
      if (m.team1.player2) uniquePlayers.add(m.team1.player2);
      if (m.team2.player1) uniquePlayers.add(m.team2.player1);
      if (m.team2.player2) uniquePlayers.add(m.team2.player2);
    });

    return {
      completed,
      upcoming,
      total: weekMatches.length,
      playerCount: uniquePlayers.size || 16,
    };
  }, [weekMatches]);

  const activeWeekDate = useMemo(() => {
    const firstMatch = weekMatches[0];
    return formatMatchDateOnly(firstMatch?.scheduled_at);
  }, [weekMatches]);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 px-4 lg:px-0 pt-2">
        {/* Left: Title & Subtitle */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            MUSIM 2026/2027
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Jadwal & Hasil Pertandingan
          </h1>
          <p className="text-sm text-muted-foreground">
            Jadwal pertandingan dan rekapitulasi hasil liga badminton LIBAS per minggu.
          </p>
        </div>

        {/* Right: Stats Widgets */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Stat 1: Dimainkan */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border/50 shadow-sm min-w-32.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7" />
                <path d="m21 21-6-6" />
                <circle cx="16" cy="19" r="1.5" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                DIMAINKAN
              </p>
              <p className="text-base font-bold text-foreground">
                {stats.completed} <span className="text-xs font-normal text-muted-foreground">Laga</span>
              </p>
            </div>
          </div>

          {/* Stat 2: Atlet */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border/50 shadow-sm min-w-32.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                ATLET
              </p>
              <p className="text-base font-bold text-foreground">
                {stats.playerCount} <span className="text-xs font-normal text-muted-foreground">Pemain</span>
              </p>
            </div>
          </div>

          {/* Stat 3: Venue */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border/50 shadow-sm min-w-32.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                VENUE
              </p>
              <p className="text-sm font-bold text-foreground">GOR Abunawas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Week Navigation Card (Pill Container sesuai referensi) */}
      <div className="px-4 lg:px-0">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/60 shadow-sm">
          {/* Left Button */}
          <button
            onClick={() => prevWeek !== null && setCurrentWeek(prevWeek)}
            disabled={prevWeek === null}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm font-medium shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Pekan Lalu</span>
          </button>

          {/* Center Info */}
          <div className="flex flex-col items-center justify-center text-center px-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[11px] tracking-wide uppercase">
                BABAK REGULAR
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="font-semibold text-blue-400">
                Minggu {activeWeek}
              </span>
            </div>
            <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground mt-1 tracking-tight">
              {activeWeekDate}
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Total {stats.total} Pertandingan Selesai Dimainkan • Update Terakhir: 10:30 WIB
            </p>
          </div>

          {/* Right Button */}
          <button
            onClick={() => nextWeek !== null && setCurrentWeek(nextWeek)}
            disabled={nextWeek === null}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm font-medium shrink-0"
          >
            <span className="hidden sm:inline">
              {nextWeek ? `Minggu ${nextWeek}` : "Pekan Depan"}
            </span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs Row */}
      {/* <div className="flex flex-wrap gap-2 items-center justify-between px-4 lg:px-0">
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" className="bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700">
            Semua {stats.total}
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            Selesai {stats.completed}
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            Akan Datang {stats.upcoming}
          </Badge>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <select className="bg-transparent text-xs font-medium text-foreground outline-none">
            <option>Lap. GOR Abunawas Konawe</option>
          </select>
        </div>
      </div> */}

      {/* Matches Grid */}
      {weekMatches.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-12">
          Tidak ada pertandingan di minggu ini.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 px-4 lg:px-0">
          {weekMatches.map((m, idx) => {
            const isDone = m.set1_team1 !== null;
            const t1s1Win = isDone && m.set1_team1! > m.set1_team2!;
            const t1s2Win = isDone && m.set2_team1! !== null && m.set2_team1! > m.set2_team2!;
            const t2s1Win = isDone && m.set1_team2! > m.set1_team1!;
            const t2s2Win = isDone && m.set2_team2! !== null && m.set2_team2! > m.set2_team1!;

            const t1Wins = (t1s1Win ? 1 : 0) + (t1s2Win ? 1 : 0);
            const t2Wins = (t2s1Win ? 1 : 0) + (t2s2Win ? 1 : 0);

            const isT1Winner = t1Wins === 2;
            const isT2Winner = t2Wins === 2;
            const isDraw = isDone && t1Wins === 1 && t2Wins === 1;

            return (
              <div
                key={m.id}
                className="group rounded-xl border border-border/50 bg-card p-5 hover:border-emerald-500/30 hover:shadow-lg transition-all animate-fade-in"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-xs font-bold">{formatDate(m.scheduled_at)}</span>
                    </div>
                    {/* <div className="flex items-center gap-1.5 text-muted-foreground/60">
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="text-xs">Lap. GOR Abunawas Konawe</span>
                    </div> */}
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-muted/50 border border-border/50">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {isDone ? "Selesai" : "Mendatang"}
                    </span>
                  </div>
                </div>

                {/* Team Rows */}
                <div className="space-y-1">
                  {/* Team 1 Row */}
                  <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isT1Winner ? "bg-emerald-500/5" : ""}`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg font-heading text-sm font-bold shrink-0 ${isT1Winner ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>
                        {m.team1.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-foreground truncate">{m.team1.name}</p>
                          {isT1Winner && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                        </div>
                        <p className={`text-[11px] truncate ${isT1Winner ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
                          {isT1Winner ? "Pemenang Pertandingan" : `${m.team1.player1} & ${m.team1.player2}`}
                        </p>
                      </div>
                    </div>
                    {isDone && (
                      <div className="flex items-center gap-2 pl-4 shrink-0">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold tabular-nums ${t1s1Win ? "bg-emerald-600 text-white" : "bg-muted/50 text-muted-foreground"}`}>
                          {m.set1_team1}
                        </div>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold tabular-nums ${t1s2Win ? "bg-emerald-600 text-white" : "bg-muted/50 text-muted-foreground"}`}>
                          {m.set2_team1}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Team 2 Row */}
                  <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isT2Winner ? "bg-emerald-500/5" : ""}`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg font-heading text-sm font-bold shrink-0 ${isT2Winner ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>
                        {m.team2.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-foreground truncate">{m.team2.name}</p>
                          {isT2Winner && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                        </div>
                        <p className={`text-[11px] truncate ${isT2Winner ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
                          {isT2Winner ? "Pemenang Pertandingan" : `${m.team2.player1} & ${m.team2.player2}`}
                        </p>
                      </div>
                    </div>
                    {isDone && (
                      <div className="flex items-center gap-2 pl-4 shrink-0">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold tabular-nums ${t2s1Win ? "bg-emerald-600 text-white" : "bg-muted/50 text-muted-foreground"}`}>
                          {m.set1_team2}
                        </div>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold tabular-nums ${t2s2Win ? "bg-emerald-600 text-white" : "bg-muted/50 text-muted-foreground"}`}>
                          {m.set2_team2}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Info */}
                {isDone && (
                  <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-start">
                    <div className="flex items-center gap-2">
                      {isDraw ? (
                        <>
                          <Scale className="h-4 w-4 text-orange-500" />
                          <span className="text-xs font-bold text-orange-500">Hasil Imbang Set (1 - 1)</span>
                        </>
                      ) : (
                        <>
                          <Trophy className="h-4 w-4 text-emerald-500" />
                          <span className="text-xs font-bold text-emerald-500">Menang Dominan (2 - 0)</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
