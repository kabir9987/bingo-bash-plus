import { BingoCard as TCard, COLUMNS } from "@/lib/bingo";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface Props {
  card: TCard;
  daubed: number[];
  drawn: number[];
  onDaub: (num: number) => void;
  diamondMode?: boolean;
  noFreeSpace?: boolean;
}

export const BingoCard = ({ card, daubed, drawn, onDaub, diamondMode, noFreeSpace }: Props) => {
  const isDaubed = (n: number) => (n === 0 && !noFreeSpace) || daubed.includes(n);
  const isCalled = (n: number) => drawn.includes(n);

  return (
    <div className="surface-card rounded-3xl p-3 sm:p-5 w-full max-w-md mx-auto">
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-2">
        {COLUMNS.map((c, i) => (
          <div
            key={c}
            className={cn(
              "h-10 sm:h-12 rounded-xl flex items-center justify-center font-display text-xl sm:text-2xl text-primary-foreground",
              i === 0 && "ball-b",
              i === 1 && "ball-i",
              i === 2 && "ball-n",
              i === 3 && "ball-g",
              i === 4 && "ball-o",
            )}
          >
            {c}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {Array.from({ length: 5 }).map((_, row) =>
          card.map((col, ci) => {
            const num = col[row];
            const free = num === 0 && !noFreeSpace;
            const daub = isDaubed(num);
            const called = isCalled(num);
            return (
              <button
                key={`${ci}-${row}`}
                onClick={() => !free && onDaub(num)}
                disabled={free && !diamondMode}
                className={cn(
                  "aspect-square rounded-xl font-display text-base sm:text-xl transition-all relative",
                  "border-2 border-border bg-muted/40 text-foreground",
                  called && !daub && "ring-2 ring-accent animate-pulse",
                  daub && !free && "ball-i text-primary-foreground border-gold scale-95 glow-gold",
                  free && "ball-n text-primary-foreground border-gold flex items-center justify-center",
                  diamondMode && !daub && !free && "ring-2 ring-secondary cursor-pointer",
                )}
              >
                {free ? <Sparkles className="w-5 h-5" /> : num}
                {daub && !free && (
                  <span className="absolute inset-0 rounded-xl flex items-center justify-center pointer-events-none">
                    <span className="absolute w-full h-1 bg-destructive/80 rotate-45 rounded-full" />
                  </span>
                )}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
};
