import { cn } from "@/lib/utils";

interface Props {
  linesCompleted: number; // 0..5+
}

const LETTERS = ["B", "I", "N", "G", "O"] as const;
const COLOR_CLASS = ["ball-b", "ball-i", "ball-n", "ball-g", "ball-o"];

export const BingoLetters = ({ linesCompleted }: Props) => {
  const struck = Math.min(5, linesCompleted);
  return (
    <div className="surface-card rounded-3xl p-4 sm:p-5">
      <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground text-center mb-3">
        Indian Classic · {struck}/5 letters struck
      </div>
      <div className="flex justify-center gap-2 sm:gap-3">
        {LETTERS.map((L, i) => {
          const isStruck = i < struck;
          return (
            <div key={L} className="relative">
              <div
                className={cn(
                  "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-display text-2xl sm:text-3xl text-primary-foreground border-2 transition-all",
                  COLOR_CLASS[i],
                  isStruck ? "border-gold scale-95 opacity-70 glow-gold" : "border-white/30",
                )}
              >
                {L}
              </div>
              {isStruck && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="block w-[120%] h-1.5 bg-destructive rotate-[-18deg] rounded-full shadow-[0_0_12px_hsl(var(--destructive))]" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
