import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "../lib/client";
import { Calendar, Trophy, Plus, Trash2, Edit2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";

type Team = {
  id: string;
  name: string;
};

type MatchRow = {
  id: string;
  team1_id: string;
  team2_id: string;
  scheduled_at: string;
  week_number: number | null;
  set1_team1: number | null;
  set1_team2: number | null;
  set2_team1: number | null;
  set2_team2: number | null;
  team1: Team | Team[] | null;
  team2: Team | Team[] | null;
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
  team1?: Team;
  team2?: Team;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
  if (!dateString) return "-";

  const rawDate = new Date(dateString);

  if (Number.isNaN(rawDate.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Makassar",
  }).format(rawDate);
}

function normalizeTeamRelation(team: Team | Team[] | null | undefined, fallbackId?: string): Team | undefined {
  if (!team) return fallbackId ? { id: fallbackId, name: "Unknown" } : undefined;
  if (Array.isArray(team)) return team[0] ?? (fallbackId ? { id: fallbackId, name: "Unknown" } : undefined);
  return team;
}

function validateScores(s1t1: string, s1t2: string, s2t1: string, s2t2: string): string | null {
  const values = [s1t1, s1t2, s2t1, s2t2];
  const filled = values.filter((value) => value.trim() !== "");

  if (filled.length > 0 && filled.length < 4) {
    return "Isi semua skor atau kosongkan semua";
  }

  if (filled.length === 0) {
    return null;
  }

  if (values.some((value) => value.trim() !== "" && !/^\d+$/.test(value.trim()))) {
    return "Skor hanya boleh angka bulat";
  }

  const [n1, n2, n3, n4] = values.map((value) => Number(value.trim() || 0));

  if ([n1, n2, n3, n4].some((n) => n < 0)) {
    return "Skor tidak boleh negatif";
  }

  const isValidSet = (a: number, b: number) => {
    if (a === b) return false;
    const winner = Math.max(a, b);
    const loser = Math.min(a, b);

    // Winner harus minimal 21
    if (winner < 21) return false;
    // Selisih minimal 2 poin
    if (winner - loser < 2) return false;
    // Winner maksimal 30 (reasonable upper bound untuk deuce)
    if (winner > 30) return false;
    // Jika winner sudah 21+, loser harus maksimal winner-2
    // Artinya: 21-19 valid, 22-19 invalid (harusnya berhenti di 21-19)
    // Jika deuce (loser >= 20), game berlanjut sampai lead 2
    if (loser < 20 && winner > 21) return false;

    return true;
  };

  const set1Valid = isValidSet(n1, n2);
  const set2Valid = isValidSet(n3, n4);

  if (!set1Valid || !set2Valid) {
    return "Skor tidak valid: setiap set harus minimal 21 dan dimenangkan dengan selisih minimal 2 poin";
  }

  const t1Sets = (n1 > n2 ? 1 : 0) + (n3 > n4 ? 1 : 0);
  const t2Sets = (n2 > n1 ? 1 : 0) + (n4 > n3 ? 1 : 0);

  const isValidSetSplit = t1Sets === 1 && t2Sets === 1;
  const isValidSweep = t1Sets === 2 || t2Sets === 2;

  if (!isValidSetSplit && !isValidSweep) {
    return "Skor tidak valid: pertandingan harus berakhir dengan split 1-1 atau satu tim menang 2 set";
  }

  return null;
}

// ─── ScoreInput ───────────────────────────────────────────────────────────────

function ScoreInput({
  label,
  t1,
  t2,
  onT1,
  onT2,
}: {
  label: string;
  t1: string;
  t2: string;
  onT1: (v: string) => void;
  onT2: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Input
          type="number"
          min={0}
          value={t1}
          onChange={(e) => onT1(e.target.value)}
          placeholder="0"
          className="text-center"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <Input
          type="number"
          min={0}
          value={t2}
          onChange={(e) => onT2(e.target.value)}
          placeholder="0"
          className="text-center"
        />
      </div>
    </div>
  );
}

// ─── MatchesByWeek ────────────────────────────────────────────────────────────

interface MatchesByWeekProps {
  matches: Match[];
  onEdit: (match: Match) => void;
  onDelete: (id: string) => void;
}

function MatchesByWeek({ matches, onEdit, onDelete }: MatchesByWeekProps) {
  const weeks = useMemo(() => {
    const weekSet = new Set<number>();
    matches.forEach((m) => {
      if (m.week_number !== null) weekSet.add(m.week_number);
    });
    return Array.from(weekSet).sort((a, b) => a - b);
  }, [matches]);

  const matchesByWeek = useMemo(() => {
    const map = new Map<number, Match[]>();
    weeks.forEach((w) => map.set(w, []));
    matches.forEach((m) => {
      if (m.week_number !== null && map.has(m.week_number)) {
        map.get(m.week_number)!.push(m);
      }
    });
    return map;
  }, [matches, weeks]);

  return (
    <Accordion type="single" collapsible className="space-y-0">
      {weeks.map((week) => (
        <AccordionItem key={`week-${week}`} value={`week-${week}`} className="border-b-0">
          <AccordionTrigger className="px-0 py-3 font-semibold text-sm hover:bg-transparent">
            Minggu {week} ({matchesByWeek.get(week)?.length || 0} pertandingan)
          </AccordionTrigger>
          <AccordionContent className="px-0 pb-0">
            <div className="space-y-2 divide-y divide-border/50">
              {(matchesByWeek.get(week) || []).map((match, idx) => {
                const hasScore =
                  match.set1_team1 !== null && match.set1_team2 !== null;
                const t1Wins =
                  hasScore
                    ? (match.set1_team1! > match.set1_team2! ? 1 : 0) +
                      (match.set2_team1! > match.set2_team2! ? 1 : 0)
                    : 0;
                const t2Wins =
                  hasScore
                    ? (match.set1_team2! > match.set1_team1! ? 1 : 0) +
                      (match.set2_team2! > match.set2_team1! ? 1 : 0)
                    : 0;

                const isDraw = hasScore && t1Wins === 1 && t2Wins === 1;
                const isT1Winner = hasScore && t1Wins === 2;
                const isT2Winner = hasScore && t2Wins === 2;

                const scoreBadgeClass =
                  isT1Winner || isT2Winner
                    ? "border-primary bg-primary text-white"
                    : isDraw
                      ? "border-secondary bg-secondary text-foreground"
                      : "border-secondary bg-secondary text-secondary-foreground";

                const matchBadgeClass = scoreBadgeClass;

                return (
                  <div
                    key={match.id}
                    className="group flex items-center gap-3 py-2.5 first:pt-3 animate-fade-in"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <div className="hidden w-32 shrink-0 sm:block">
                      <p className="text-[0.65rem] leading-tight text-muted-foreground">
                        <Calendar className="mb-0.5 mr-0.5 inline size-3" />
                        {formatDate(match.scheduled_at)}
                      </p>
                    </div>

                    <div className="flex flex-1 items-center gap-2 overflow-hidden">
                      <p
                        className={`truncate text-right text-xs font-semibold flex-1 ${
                          hasScore && isT1Winner
                            ? "text-foreground"
                            : hasScore
                            ? "text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {match.team1?.name}
                      </p>

                      <div className="flex shrink-0 items-center gap-1">
                        {hasScore ? (
                          <>
                            <Badge
                              variant="outline"
                              className={`font-mono tabular-nums ${scoreBadgeClass}`}
                            >
                              {match.set1_team1} – {match.set1_team2}
                            </Badge>

                            {match.set2_team1 !== null && (
                              <Badge
                                variant="outline"
                                className={`font-mono tabular-nums ${scoreBadgeClass}`}
                              >
                                {match.set2_team1} – {match.set2_team2}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="px-2 text-[0.65rem] text-muted-foreground">VS</span>
                        )}
                      </div>

                      <p
                        className={`truncate text-left text-xs font-semibold flex-1 ${
                          hasScore && isT2Winner ? "text-foreground" : hasScore ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {match.team2?.name}
                      </p>
                    </div>

                    <Badge
                      variant="outline"
                      className={`hidden shrink-0 sm:inline-flex ${matchBadgeClass}`}
                    >
                      {hasScore ? (isDraw ? "Seri" : isT1Winner ? "Tim 1 menang" : "Tim 2 menang") : "Dijadwalkan"}
                    </Badge>

                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onEdit(match)}
                        title="Edit skor"
                      >
                        <Edit2 />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => void onDelete(match.id)}
                        title="Hapus"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // add-form modal
  const [addOpen, setAddOpen] = useState(false);
  const [team1Id, setTeam1Id] = useState("");
  const [team2Id, setTeam2Id] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [weekNumber, setWeekNumber] = useState("");
  const [set1T1, setSet1T1] = useState("");
  const [set1T2, setSet1T2] = useState("");
  const [set2T1, setSet2T1] = useState("");
  const [set2T2, setSet2T2] = useState("");

  // edit-score modal
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [editWeekNumber, setEditWeekNumber] = useState("");
  const [editSet1T1, setEditSet1T1] = useState("");
  const [editSet1T2, setEditSet1T2] = useState("");
  const [editSet2T1, setEditSet2T1] = useState("");
  const [editSet2T2, setEditSet2T2] = useState("");

  const supabase = createClient();

  const loadTeams = useCallback(async () => {
    const { data } = await supabase.from("teams").select("id, name").order("name");
    setTeams(data ?? []);
  }, [supabase]);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("matches")
      .select(
        `id, team1_id, team2_id, scheduled_at, week_number,
         set1_team1, set1_team2, set2_team1, set2_team2,
         team1:teams!matches_team1_id_fkey(id, name),
         team2:teams!matches_team2_id_fkey(id, name)`
      )
      .order("scheduled_at", { ascending: false });

    if (error) {
      toast.error(`Gagal mengambil data: ${error.message}`);
    } else {
      const normalizedMatches: Match[] = (data ?? []).map((match: MatchRow) => ({
        id: match.id,
        team1_id: match.team1_id,
        team2_id: match.team2_id,
        scheduled_at: match.scheduled_at,
        week_number: match.week_number,
        set1_team1: match.set1_team1,
        set1_team2: match.set1_team2,
        set2_team1: match.set2_team1,
        set2_team2: match.set2_team2,
        team1: normalizeTeamRelation(match.team1, match.team1_id),
        team2: normalizeTeamRelation(match.team2, match.team2_id),
      }));

      setMatches(normalizedMatches);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let alive = true;
    async function init() {
      await loadTeams();
      if (alive) await loadMatches();
    }
    void init();
    return () => { alive = false; };
  }, [loadMatches, loadTeams]);

  function matchExists(t1: string, t2: string) {
    return matches.some(
      (m) =>
        (m.team1_id === t1 && m.team2_id === t2) ||
        (m.team1_id === t2 && m.team2_id === t1)
    );
  }

  function resetAddForm() {
    setTeam1Id(""); setTeam2Id(""); setScheduledAt(""); setWeekNumber("");
    setSet1T1(""); setSet1T2(""); setSet2T1(""); setSet2T2("");
  }

  async function handleAddMatch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!team1Id || !team2Id || !scheduledAt || !weekNumber) {
      toast.error("Semua field harus diisi"); return;
    }
    if (team1Id === team2Id) {
      toast.error("Pilih dua tim berbeda"); return;
    }
    if (matchExists(team1Id, team2Id)) {
      toast.error("Pertandingan kedua tim sudah dijadwalkan"); return;
    }
    const scoreErr = validateScores(set1T1, set1T2, set2T1, set2T2);
    if (scoreErr) { toast.error(scoreErr); return; }

    setSaving(true);
    const utcTime = new Date(scheduledAt).toISOString();
    const { error } = await supabase.from("matches").insert({
      team1_id: team1Id,
      team2_id: team2Id,
      scheduled_at: utcTime,
      week_number: +weekNumber,
      set1_team1: set1T1 ? +set1T1 : null,
      set1_team2: set1T2 ? +set1T2 : null,
      set2_team1: set2T1 ? +set2T1 : null,
      set2_team2: set2T2 ? +set2T2 : null,
    });
    setSaving(false);

    if (error) {
      toast.error(`Gagal: ${error.message}`);
    } else {
      setAddOpen(false);
      resetAddForm();
      toast.success("Pertandingan berhasil ditambahkan");
      await loadMatches();
    }
  }

  function openEdit(match: Match) {
    setEditMatch(match);
    setEditWeekNumber(match.week_number?.toString() ?? "");
    setEditSet1T1(match.set1_team1?.toString() ?? "");
    setEditSet1T2(match.set1_team2?.toString() ?? "");
    setEditSet2T1(match.set2_team1?.toString() ?? "");
    setEditSet2T2(match.set2_team2?.toString() ?? "");
  }

  async function handleSaveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editMatch) return;
    if (!editWeekNumber) { toast.error("Week harus diisi"); return; }
    const scoreErr = validateScores(editSet1T1, editSet1T2, editSet2T1, editSet2T2);
    if (scoreErr) { toast.error(scoreErr); return; }

    setSaving(true);
    const { error } = await supabase
      .from("matches")
      .update({
        week_number: +editWeekNumber,
        set1_team1: editSet1T1 ? +editSet1T1 : null,
        set1_team2: editSet1T2 ? +editSet1T2 : null,
        set2_team1: editSet2T1 ? +editSet2T1 : null,
        set2_team2: editSet2T2 ? +editSet2T2 : null,
      })
      .eq("id", editMatch.id);
    setSaving(false);

    if (error) {
      toast.error(`Gagal: ${error.message}`);
    } else {
      setEditMatch(null);
      toast.success("Skor berhasil diperbarui");
      await loadMatches();
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Hapus pertandingan ini?")) return;
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) {
      toast.error(`Gagal: ${error.message}`);
    } else {
      toast.success("Pertandingan dihapus");
      await loadMatches();
    }
  }

  // ─── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 font-sans">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Jadwal Pertandingan
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Kelola jadwal dan hasil pertandingan liga badminton.
          </p>
        </div>
        <Button size="sm" onClick={() => { resetAddForm(); setAddOpen(true); }}>
          <Plus />
          Jadwalkan
        </Button>
      </div>

      {/* ── Global feedback ── */}

      {/* ── Matches list ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-4" />
              Daftar Pertandingan
            </CardTitle>
            <Badge variant="secondary">{matches.length} pertandingan</Badge>
          </div>
          <CardDescription>
            Klik ikon edit pada kartu pertandingan untuk memperbarui skor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : matches.length === 0 ? (
            <p className="py-12 text-center text-xs text-muted-foreground">
              Belum ada pertandingan. Klik "Jadwalkan" untuk menambahkan.
            </p>
          ) : (
            <MatchesByWeek matches={matches} onEdit={openEdit} onDelete={handleDelete} />
          )}
        </CardContent>
      </Card>

      {/* ── ADD MATCH MODAL ── */}
      <Dialog open={addOpen} onOpenChange={(o: boolean) => { setAddOpen(o); if (!o) resetAddForm(); }}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddMatch}>
            <DialogHeader>
              <DialogTitle>Jadwal Pertandingan Baru</DialogTitle>
              <DialogDescription>
                Pilih dua tim dan tanggal pertandingan. Skor bisa diisi setelah pertandingan.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              {/* Tim 1 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Tim Pertama</label>
                <select
                  value={team1Id}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setTeam1Id(nextValue);
                    if (nextValue === team2Id) {
                      setTeam2Id("");
                    }
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                >
                  <option value="">Pilih tim pertama</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Tim 2 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Tim Kedua</label>
                <select
                  value={team2Id}
                  onChange={(e) => setTeam2Id(e.target.value)}
                  disabled={!team1Id}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">{team1Id ? "Pilih tim kedua" : "Pilih tim pertama dulu"}</option>
                  {teams
                    .filter((t) => t.id !== team1Id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
              </div>

              {/* Jadwal */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Tanggal & Waktu</label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                />
              </div>

              {/* Week Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Minggu (Week)</label>
                <Input
                  type="number"
                  min="1"
                  max="26"
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(e.target.value)}
                  placeholder="Contoh: 1, 2, 3..."
                  required
                />
              </div>

              {/* Skor opsional */}
              <div className="space-y-3 rounded-md border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Skor (opsional — bisa diisi setelah pertandingan)
                </p>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 text-center">
                  <p className="truncate text-[0.65rem] font-medium">
                    {teams.find((t) => t.id === team1Id)?.name || "Tim 1"}
                  </p>
                  <span />
                  <p className="truncate text-[0.65rem] font-medium">
                    {teams.find((t) => t.id === team2Id)?.name || "Tim 2"}
                  </p>
                </div>
                <ScoreInput label="Set 1" t1={set1T1} t2={set1T2} onT1={setSet1T1} onT2={setSet1T2} />
                <ScoreInput label="Set 2" t1={set2T1} t2={set2T2} onT1={setSet2T1} onT2={setSet2T2} />
              </div>
            </div>

            <DialogFooter className="mt-6" showCloseButton>
              <Button type="submit" disabled={saving} size="sm">
                {saving && <Loader2 className="animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── EDIT SCORE MODAL ── */}
      <Dialog open={!!editMatch} onOpenChange={(o: boolean) => { if (!o) { setEditMatch(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle>Edit Skor</DialogTitle>
              {editMatch && (
                <DialogDescription>
                  {editMatch.team1?.name} vs {editMatch.team2?.name}
                  {" · "}
                  {formatDate(editMatch.scheduled_at)}
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="mt-4 space-y-3">
              {editMatch && (
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 text-center">
                  <p className="truncate text-[0.65rem] font-medium">{editMatch.team1?.name}</p>
                  <span />
                  <p className="truncate text-[0.65rem] font-medium">{editMatch.team2?.name}</p>
                </div>
              )}
              <ScoreInput label="Set 1" t1={editSet1T1} t2={editSet1T2} onT1={setEditSet1T1} onT2={setEditSet1T2} />
              <ScoreInput label="Set 2" t1={editSet2T1} t2={editSet2T2} onT1={setEditSet2T1} onT2={setEditSet2T2} />
              
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium">Minggu (Week)</label>
                <Input
                  type="number"
                  min="1"
                  max="26"
                  value={editWeekNumber}
                  onChange={(e) => setEditWeekNumber(e.target.value)}
                  placeholder="Contoh: 1, 2, 3..."
                  required
                />
              </div>
            </div>

            <DialogFooter className="mt-6" showCloseButton>
              <Button type="submit" disabled={saving} size="sm">
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                Simpan Skor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
