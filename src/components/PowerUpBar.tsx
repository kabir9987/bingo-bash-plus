import { Zap, Layers, Diamond, Eye } from "lucide-react";
import { PowerUps } from "@/lib/bingo";
import { cn } from "@/lib/utils";

interface Props {
  powerUps: PowerUps;
  onUse: (key: keyof PowerUps) => void;
  doubleActive: number;
  diamondActive: boolean;
  peeked: number[];
}

const items: { key: keyof PowerUps; label: string; Icon: typeof Zap; tone: string }[] = [
  { key: "instant", label: "Instant Bingo", Icon: Zap, tone: "from-gold to-secondary" },
  { key: "doubleDaub", label: "Double Daub", Icon: Layers, tone: "from-accent to-cyan" },
  { key: "diamond", label: "Diamond", Icon: Diamond, tone: "from-secondary to-magenta" },
  { key: "reveal", label: "Peek Next", Icon: Eye, tone: "from-cyan to-accent" },
];

export const PowerUpBar = ({ powerUps, onUse, doubleActive, diamondActive, peeked }: Props) => {
  return (
    <div className="surface-card rounded-3xl p-4">
      <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3 text-center">
        Power-Ups
      </div>
      <div className="grid grid-cols-4 gap-2">
        {items.map(({ key, label, Icon, tone }) => {
          const count = powerUps[key];
          const active =
            (key === "doubleDaub" && doubleActive > 0) ||
            (key === "diamond" && diamondActive);
          return (
            <button
              key={key}
              onClick={() => onUse(key)}
              disabled={count <= 0 || active}
              className={cn(
                "relative rounded-2xl p-3 flex flex-col items-center gap-1 transition-all",
                "bg-gradient-to-br border-2 border-white/20",
                tone,
                count <= 0 && "opacity-40 grayscale",
                active && "ring-4 ring-gold animate-pulse-gold",
                count > 0 && !active && "hover:scale-105 active:scale-95 glow-magenta",
              )}
            >
              <Icon className="w-5 h-5 text-primary-foreground" />
              <span className="text-[10px] font-bold text-primary-foreground uppercase">{label}</span>
              <span className="absolute -top-1 -right-1 bg-foreground text-background text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            </button>
          );
        })}
      </div>
      {peeked.length > 0 && (
        <div className="mt-3 text-center text-xs text-cyan">
          Next: {peeked.join(" • ")}
        </div>
      )}
      {doubleActive > 0 && (
        <div className="mt-2 text-center text-xs text-accent">
          Double Daub active: {doubleActive} call(s) left
        </div>
      )}
      {diamondActive && (
        <div className="mt-2 text-center text-xs text-secondary">
          Tap any cell to mark with Diamond
        </div>
      )}
    </div>
  );
};
