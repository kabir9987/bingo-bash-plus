import { BingoBall } from "./BingoBall";

interface Props {
  drawn: number[];
  current: number | null;
}

export const CalledBalls = ({ drawn, current }: Props) => {
  const recent = drawn.slice(-8).reverse();
  return (
    <div className="surface-card rounded-3xl p-4 sm:p-6 flex flex-col items-center gap-4">
      <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Now Calling</div>
      <div className="h-32 flex items-center justify-center">
        {current ? (
          <div key={current} className="animate-pop-in animate-float">
            <BingoBall number={current} size="xl" glow />
          </div>
        ) : (
          <div className="w-32 h-32 rounded-full border-4 border-dashed border-border flex items-center justify-center text-muted-foreground font-display">
            ?
          </div>
        )}
      </div>
      <div className="w-full">
        <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground text-center mb-2">
          Recent Calls · {drawn.length}/75
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {recent.map((n) => (
            <BingoBall key={n} number={n} size="sm" />
          ))}
          {recent.length === 0 && (
            <div className="text-sm text-muted-foreground italic">Game starting…</div>
          )}
        </div>
      </div>
    </div>
  );
};
