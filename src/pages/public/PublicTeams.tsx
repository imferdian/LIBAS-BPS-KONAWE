import { Card, CardContent } from "../../components/ui/card";

type Team = {
  id: string;
  name: string;
  player1: string;
  player2: string;
};

interface PublicTeamsProps {
  teams: Team[];
}

export function PublicTeams({ teams }: PublicTeamsProps) {
  return (
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
  );
}
