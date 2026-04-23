import { Crown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  name: string;
  is_host: boolean;
  has_won: boolean;
  daubed: number[];
}

export const PlayerList = ({ players, meId }: { players: Player[]; meId: string | null }) => (
  <div className="surface-card rounded-3xl p-4">
    <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3 text-center">
      Players · {players.length}
    </div>
    <ul className="space-y-2">
      {players.map((p) => (
        <li
          key={p.id}
          className={cn(
            "flex items-center justify-between rounded-xl px-3 py-2 bg-muted/30 border border-border",
            p.id === meId && "ring-2 ring-gold",
            p.has_won && "ring-2 ring-secondary glow-magenta",
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {p.is_host && <Crown className="w-4 h-4 text-gold shrink-0" />}
            {p.has_won && <Trophy className="w-4 h-4 text-secondary shrink-0" />}
            <span className="font-display truncate">{p.name}</span>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {p.daubed.length} daubs
          </span>
        </li>
      ))}
    </ul>
  </div>
);
