import { Card, CardContent } from "../../components/ui/card";
import { BarChart3, Medal, Info } from "lucide-react";

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

interface PublicStandingsProps {
  standings: Standing[];
}

export function PublicStandings({ standings }: PublicStandingsProps) {
  return (
    <div className="space-y-4">
      <header className="relative overflow-hidden rounded-xl border border-border bg-card px-5 py-5 "> 
        <div className="flex items-center gap-4">
          <div className="hidden md:flex size-14 items-center justify-center rounded-xl bg-emerald-500">
            <BarChart3 className="size-5 sm:size-7 text-slate-950" />
          </div>

          <div className="min-w-0 font-heading">
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              KLASMEN LENGKAP LIGA
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Turnamen Ganda Putra Liga Badminton Statistik (LIBAS) 2026 BPS Kabupaten Konawe  
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-lg border border-slate-700/80 bg-background/60 px-3 py-2 text-[9px] text-muted-foreground sm:text-[10px] ">
          <span className="inline-flex items-center gap-2 font-semibold tracking-wide uppercase text-foreground">
            <Info className="size-3 text-emerald-400" />
            Sistem poin BWF LIBAS:
          </span>

          <span className="rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-medium text-emerald-400">
            Menang 2 - 0 
          </span>
            = 3 poin
          <span className="rounded-sm border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-medium text-amber-400">
            Seri 1 - 1
          </span>
            = 1 poin
          <span className="rounded-sm border border-rose-500/30 bg-rose-500/10 px-2 py-1 font-medium text-rose-400">
            Kalah 0 - 2 
          </span>
            = 0 poin
        </div>
      </header>

      <Card className="animate-fade-in border-border/80">
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-[11px]">
                  <th className="py-2.5 px-3 text-left w-10 sticky left-0 bg-card z-10">Pos</th>
                  <th className="py-2.5 px-3 text-left sticky left-10 bg-card z-10">Pasangan</th>
                  <th className="py-2.5 px-3 text-left">Pemain</th>
                  <th className="py-2.5 px-3 text-center">Main</th>
                  <th className="py-2.5 px-3 text-center">M</th>
                  <th className="py-2.5 px-3 text-center">S</th>
                  <th className="py-2.5 px-3 text-center">K</th>
                  <th className="py-2.5 px-2 text-center bg-primary/10">Poin</th>
                  <th className="py-2.5 px-0 text-center">Skor Tim</th>
                  <th className="py-2.5 px-0 text-center">Skor Lawan</th>
                  <th className="py-2.5 px-0 text-center">Selisih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {standings.map((s, idx) => (
                  <tr key={s.team_id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-3 font-bold text-foreground sticky left-0 bg-card/50 z-10">
                      {idx === 0 ? <Medal className="size-3.5 text-yellow-500" /> : idx === 1 ? <Medal className="size-3.5 text-gray-400" /> : idx === 2 ? <Medal className="size-3.5 text-amber-600" /> : idx + 1}
                    </td>
                    <td className="py-3 px-3 font-semibold text-foreground sticky left-10 bg-card/50 z-10">{s.team_name}</td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {s.player1} & {s.player2}
                    </td>
                    <td className="py-3 px-3 text-center text-muted-foreground">{s.played}</td>
                    <td className="py-3 px-3 text-center text-green-600 dark:text-green-400 font-semibold">{s.wins}</td>
                    <td className="py-3 px-3 text-center text-muted-foreground">{s.draws}</td>
                    <td className="py-3 px-3 text-center text-red-600 dark:text-red-400">{s.losses}</td>
                    <td className="py-3 px-3 text-center font-heading font-black text-sm text-primary bg-primary/10">
                      {s.points}
                    </td>
                    <td className="py-3 px-3 text-center font-medium">{s.points_for}</td>
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
    </div>
  );
}