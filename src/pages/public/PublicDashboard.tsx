import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Trophy, BarChart3, CalendarDays, Medal, Flame, Swords, Clock } from "lucide-react";

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

interface PublicDashboardProps {
  teams: { id: string; name: string; player1: string; player2: string }[];
  matches: Match[];
  standings: Standing[];
  upcomingMatches: Match[];
  recentMatches: Match[];
  totalPointsScored: number;
  formatDate: (dateString: string) => string;
  formatTimeOnly: (dateString: string) => string;
  onViewMatches: () => void;
  onViewStandings: () => void;
  onViewTeams: () => void;
}

export function PublicDashboard({
  teams,
  matches,
  standings,
  upcomingMatches,
  recentMatches,
  totalPointsScored,
  formatDate,
  formatTimeOnly,
  onViewMatches,
  onViewStandings,
  onViewTeams,
}: PublicDashboardProps) {
  const featuredMatch = upcomingMatches[0] || recentMatches[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* TOP ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Featured Match */}
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
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-16 w-16 rounded-2xl bg-secondary/80 flex items-center justify-center text-2xl font-black font-heading border border-border shadow-inner">
                    {featuredMatch.team1?.name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm md:text-base">{featuredMatch.team1?.name}</p>
                    <p className="text-[11px] text-muted-foreground">Tim Tuan Rumah</p>
                  </div>
                </div>

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

                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-16 w-16 rounded-2xl bg-secondary/80 flex items-center justify-center text-2xl font-black font-heading border border-border shadow-inner">
                    {featuredMatch.team2?.name?.charAt(0) || "B"}
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm md:text-base">{featuredMatch.team2?.name}</p>
                    <p className="text-[11px] text-muted-foreground">Tim Tamu</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-xs text-muted-foreground">Belum ada pertandingan.</p>
            )}
          </CardContent>
        </Card>

        {/* Info Musim */}
        <Card className="border-border/80 shadow-sm flex flex-col justify-between">
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

      {/* MIDDLE ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Medal className="size-4 text-primary" /> Pasangan Unggulan
            </CardTitle>
            <button onClick={onViewTeams} className="text-xs text-primary hover:underline font-medium">
              Lihat Semua
            </button>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {standings.slice(0, 4).map((s, idx) => (
              <div key={s.team_id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-secondary/40 transition-colors duration-150">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-heading font-bold text-xs text-muted-foreground w-4">{idx + 1}</span>
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

        {/* Top Standings */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" /> Top Klasemen
            </CardTitle>
            <button onClick={onViewStandings} className="text-xs text-primary hover:underline font-medium">
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

        {/* Upcoming */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" /> Jadwal Mendatang
            </CardTitle>
            <button onClick={onViewMatches} className="text-xs text-primary hover:underline font-medium">
              Semua
            </button>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {upcomingMatches.slice(0, 3).map((m) => (
              <div key={m.id} className="p-2.5 rounded-lg border border-border/60 bg-secondary/10 hover:border-primary/30 transition-all">
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

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats */}
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

        {/* Recent */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Swords className="size-4 text-primary" /> Hasil Terkini
            </CardTitle>
            <button onClick={onViewMatches} className="text-xs text-primary hover:underline font-medium">
              Semua
            </button>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {recentMatches.slice(0, 3).map((m) => (
              <div key={m.id} className="p-2.5 rounded-lg border border-border/60 bg-secondary/10 hover:border-primary/30 transition-all">
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
  );
}
