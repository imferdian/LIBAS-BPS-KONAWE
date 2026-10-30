import { useState, useEffect } from "react";
import { createClient } from "../lib/client";
import { Trophy, TrendingUp, Medal, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

type TeamStanding = {
  team_id: string;
  team_name: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  sets_won: number;
  sets_lost: number;
  points_for: number;
  points_against: number;
  points: number;
};

type MatchRow = {
  id: string;
  team1_id: string;
  team2_id: string;
  set1_team1: number | null;
  set1_team2: number | null;
  set2_team1: number | null;
  set2_team2: number | null;
  team1: { name: string }[] | null;
  team2: { name: string }[] | null;
};

type Match = {
  id: string;
  team1_id: string;
  team2_id: string;
  set1_team1: number | null;
  set1_team2: number | null;
  set2_team1: number | null;
  set2_team2: number | null;
  team1: { name: string };
  team2: { name: string };
};

export default function Standings() {
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const calculateStandings = (matches: Match[], teams: { id: string; name: string }[]) => {
    const stats = new Map<string, TeamStanding>();

    teams.forEach((team) => {
      stats.set(team.id, {
        team_id: team.id,
        team_name: team.name,
        matches_played: 0,
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

    matches.forEach((match) => {
      if (
        match.set1_team1 === null ||
        match.set1_team2 === null ||
        match.set2_team1 === null ||
        match.set2_team2 === null
      ) {
        return;
      }

      const team1Stats = stats.get(match.team1_id);
      const team2Stats = stats.get(match.team2_id);

      if (!team1Stats || !team2Stats) return;

      const team1SetsWon =
        (match.set1_team1 > match.set1_team2 ? 1 : 0) +
        (match.set2_team1 > match.set2_team2 ? 1 : 0);
      const team2SetsWon =
        (match.set1_team2 > match.set1_team1 ? 1 : 0) +
        (match.set2_team2 > match.set2_team1 ? 1 : 0);

      team1Stats.matches_played++;
      team2Stats.matches_played++;

      team1Stats.sets_won += team1SetsWon;
      team1Stats.sets_lost += team2SetsWon;
      team2Stats.sets_won += team2SetsWon;
      team2Stats.sets_lost += team1SetsWon;

      team1Stats.points_for += match.set1_team1 + match.set2_team1;
      team1Stats.points_against += match.set1_team2 + match.set2_team2;
      team2Stats.points_for += match.set1_team2 + match.set2_team2;
      team2Stats.points_against += match.set1_team1 + match.set2_team1;

      if (team1SetsWon === 2 && team2SetsWon === 0) {
        team1Stats.wins++;
        team1Stats.points += 3;
        team2Stats.losses++;
      } else if (team2SetsWon === 2 && team1SetsWon === 0) {
        team2Stats.wins++;
        team2Stats.points += 3;
        team1Stats.losses++;
      } else if (team1SetsWon === 1 && team2SetsWon === 1) {
        team1Stats.draws++;
        team1Stats.points += 1;
        team2Stats.draws++;
        team2Stats.points += 1;
      }
    });

    return Array.from(stats.values())
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const aDiff = a.sets_won - a.sets_lost;
        const bDiff = b.sets_won - b.sets_lost;
        if (bDiff !== aDiff) return bDiff - aDiff;
        const pDiff = (b.points_for - b.points_against) - (a.points_for - a.points_against);
        if (pDiff !== 0) return pDiff;
        return a.team_name.localeCompare(b.team_name);
      });
  };

  useEffect(() => {
    let alive = true;

    async function loadData() {
      setLoading(true);

      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name");

      if (teamsError) {
        console.error("Error loading teams:", teamsError);
        setLoading(false);
        return;
      }

      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select(
          `id, team1_id, team2_id, set1_team1, set1_team2, set2_team1, set2_team2,
           team1:teams!matches_team1_id_fkey(name),
           team2:teams!matches_team2_id_fkey(name)`
        )
        .not("set1_team1", "is", null)
        .not("set1_team2", "is", null)
        .not("set2_team1", "is", null)
        .not("set2_team2", "is", null);

      if (matchesError) {
        console.error("Error loading matches:", matchesError);
        setLoading(false);
        return;
      }

      if (!alive) return;

      const matches: Match[] = (matchesData ?? []).map((match: MatchRow) => ({
        id: match.id,
        team1_id: match.team1_id,
        team2_id: match.team2_id,
        set1_team1: match.set1_team1,
        set1_team2: match.set1_team2,
        set2_team1: match.set2_team1,
        set2_team2: match.set2_team2,
        team1: match.team1?.[0] ?? { name: "Unknown" },
        team2: match.team2?.[0] ?? { name: "Unknown" },
      }));

      const calculatedStandings = calculateStandings(matches, teamsData ?? []);
      setStandings(calculatedStandings);
      setLoading(false);
    }

    void loadData();

    return () => { alive = false; };
  }, []);

  return (
    <div className="space-y-6 font-sans">

      {/* ── Page header ── */}
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Trophy className="size-5" />
          Klasemen Liga
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Peringkat tim berdasarkan hasil pertandingan.
        </p>
      </div>

      {/* ── Standings table ── */}
      <Card>
        <CardHeader>
          <CardTitle>Peringkat Saat Ini</CardTitle>
          <CardDescription>
            Sistem poin: Menang 2-0 = 3 poin, Seri 1-1 = 1 poin, Kalah 0-2 = 0 poin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : standings.length === 0 ? (
            <p className="py-12 text-center text-xs text-muted-foreground">
              Belum ada data. Jadwalkan dan selesaikan pertandingan untuk melihat klasemen.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tim</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground hidden sm:table-cell">Main</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground hidden md:table-cell">M</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground hidden md:table-cell">S</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground hidden md:table-cell">K</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Skor Tim</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Skor Lawan</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Selisih</th>
                    <th className="px-3 py-2 text-center font-medium text-primary">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {standings.map((team, idx) => {
                    const isMedal = idx < 3;

                    return (
                      <tr
                        key={team.team_id}
                        className="hover:bg-muted/50 transition-colors animate-fade-in"
                        style={{ animationDelay: `${idx * 40}ms` }}
                      >
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isMedal && (
                              <>
                                {idx === 0 && <Medal className="size-4 text-yellow-500" />}
                                {idx === 1 && <Medal className="size-4 text-gray-400" />}
                                {idx === 2 && <Medal className="size-4 text-amber-600" />}
                              </>
                            )}
                            <span className="font-semibold">{idx + 1}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-semibold truncate">
                          {team.team_name}
                        </td>
                        <td className="px-3 py-3 text-center text-muted-foreground hidden sm:table-cell">
                          {team.matches_played}
                        </td>
                        <td className="px-3 py-3 text-center text-muted-foreground hidden md:table-cell">
                          {team.wins}
                        </td>
                        <td className="px-3 py-3 text-center text-muted-foreground hidden md:table-cell">
                          {team.draws}
                        </td>
                        <td className="px-3 py-3 text-center text-muted-foreground hidden md:table-cell">
                          {team.losses}
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-medium">
                          {team.points_for}
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-medium text-muted-foreground">
                          {team.points_against}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`font-mono font-bold ${
                              team.points_for - team.points_against > 0
                                ? "text-green-600 dark:text-green-400"
                                : team.points_for - team.points_against < 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            {team.points_for - team.points_against > 0 ? "+" : ""}
                            {team.points_for - team.points_against}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <Badge variant="default" className="font-bold">
                            <TrendingUp className="size-3 mr-1" />
                            {team.points}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && standings.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border space-y-3">
              <h3 className="text-xs font-semibold">Keterangan</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex gap-1">
                  <span className="font-medium text-foreground min-w-fit">Main:</span>
                  <span>Jumlah pertandingan</span>
                </div>
                <div className="flex gap-1">
                  <span className="font-medium text-foreground min-w-fit">M:</span>
                  <span>Menang (2-0)</span>
                </div>
                <div className="flex gap-1">
                  <span className="font-medium text-foreground min-w-fit">S:</span>
                  <span>Seri (1-1)</span>
                </div>
                <div className="flex gap-1">
                  <span className="font-medium text-foreground min-w-fit">K:</span>
                  <span>Kalah (0-2)</span>
                </div>
                <div className="flex gap-1">
                  <span className="font-medium text-foreground min-w-fit">Set:</span>
                  <span>Menang–Kalah</span>
                </div>
                <div className="flex gap-1">
                  <span className="font-medium text-foreground min-w-fit">Pts:</span>
                  <span>Total poin</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
