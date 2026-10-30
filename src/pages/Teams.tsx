import { useState, useEffect, useCallback } from "react";
import { createClient } from "../lib/client";
import { Trash2, Plus, Users, Loader2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
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
  player1: string;
  player2: string;
};

// ─── Main component ────────────────────────────────────────────────────────────

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState("");
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const supabase = createClient();

  const loadTeams = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, player1, player2")
      .order("name");

    if (error) {
      toast.error(`Gagal mengambil data: ${error.message}`);
    } else {
      setTeams(data ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTeams();
  }, [loadTeams]);

  function resetForm() {
    setName("");
    setPlayer1("");
    setPlayer2("");
    setEditingTeam(null);
  }

  function openEditDialog(team: Team) {
    setEditingTeam(team);
    setName(team.name);
    setPlayer1(team.player1);
    setPlayer2(team.player2);
    setDialogOpen(true);
  }

  async function handleSaveTeam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    if (!name.trim() || !player1.trim() || !player2.trim()) {
      toast.error("Semua field harus diisi");
      setSaving(false);
      return;
    }

    if (editingTeam) {
      // Update team
      const { error } = await supabase
        .from("teams")
        .update({
          name: name.trim(),
          player1: player1.trim(),
          player2: player2.trim(),
        })
        .eq("id", editingTeam.id);

      if (error) {
        toast.error(`Gagal: ${error.message}`);
      } else {
        setDialogOpen(false);
        resetForm();
        toast.success("Pasangan berhasil diperbarui");
        await loadTeams();
      }
    } else {
      // Add new team
      const { error } = await supabase.from("teams").insert({
        name: name.trim(),
        player1: player1.trim(),
        player2: player2.trim(),
      });

      if (error) {
        toast.error(`Gagal: ${error.message}`);
      } else {
        setDialogOpen(false);
        resetForm();
        toast.success("Pasangan berhasil ditambahkan");
        await loadTeams();
      }
    }
    setSaving(false);
  }

  async function handleDeleteTeam(id: string) {
    if (!window.confirm("Hapus pasangan ini?")) return;

    const { data: matchesCount } = await supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .or(`team1_id.eq.${id},team2_id.eq.${id}`);

    if (matchesCount && matchesCount.length > 0) {
      toast.error("Tidak bisa hapus pasangan yang masih memiliki pertandingan. Hapus pertandingan terlebih dahulu.");
      return;
    }

    const { error } = await supabase.from("teams").delete().eq("id", id);

    if (error) {
      if (error.message.includes("foreign key constraint")) {
        toast.error("Pasangan ini masih terikat dengan pertandingan yang ada. Hapus pertandingan terlebih dahulu.");
      } else {
        toast.error(`Gagal: ${error.message}`);
      }
    } else {
      toast.success("Pasangan berhasil dihapus");
      await loadTeams();
    }
  }

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 font-sans">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Manajemen Pasangan
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Kelola pasangan atlet yang mengikuti liga badminton.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus />
          Tambah
        </Button>
      </div>

      {/* ── Teams list ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4" />
              Daftar Pasangan
            </CardTitle>
            <Badge variant="secondary">{teams.length} pasangan</Badge>
          </div>
          <CardDescription>
            Kelola nama pasangan dan data pemain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : teams.length === 0 ? (
            <p className="py-12 text-center text-xs text-muted-foreground">
              Belum ada pasangan. Klik "Tambah" untuk menambahkan.
            </p>
          ) : (
            <div className="space-y-2">
              {teams.map((team, idx) => (
                <div
                  key={team.id}
                  className="group flex items-center gap-3 rounded-lg border border-border p-3 transition-all duration-200 hover:bg-muted/50 animate-fade-in"
                  style={{
                    animationDelay: `${idx * 50}ms`,
                  }}
                >
                  {/* Team info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{team.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {team.player1} & {team.player2}
                    </p>
                  </div>

                  {/* Edit & Delete buttons */}
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEditDialog(team)}
                      title="Edit pasangan"
                      className="text-primary hover:text-primary"
                    >
                      <Edit2 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => void handleDeleteTeam(team.id)}
                      title="Hapus pasangan"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── ADD/EDIT TEAM MODAL ── */}
      <Dialog open={dialogOpen} onOpenChange={(o: boolean) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveTeam}>
            <DialogHeader>
              <DialogTitle>{editingTeam ? "Edit Pasangan" : "Tambah Pasangan Baru"}</DialogTitle>
              <DialogDescription>
                {editingTeam ? "Ubah informasi pasangan atlet." : "Masukkan nama pasangan dan nama kedua pemain."}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              {/* Nama Pasangan */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Nama Pasangan</label>
                <Input
                  type="text"
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Smash Brothers"
                  required
                />
              </div>

              {/* Pemain 1 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Pemain Pertama</label>
                <Input
                  type="text"
                  maxLength={100}
                  value={player1}
                  onChange={(e) => setPlayer1(e.target.value)}
                  placeholder="Nama pemain pertama"
                  required
                />
              </div>

              {/* Pemain 2 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Pemain Kedua</label>
                <Input
                  type="text"
                  maxLength={100}
                  value={player2}
                  onChange={(e) => setPlayer2(e.target.value)}
                  placeholder="Nama pemain kedua"
                  required
                />
              </div>
            </div>

            <DialogFooter className="mt-6" showCloseButton>
              <Button type="submit" disabled={saving} size="sm">
                {saving && <Loader2 className="animate-spin" />}
                {editingTeam ? "Perbarui" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
