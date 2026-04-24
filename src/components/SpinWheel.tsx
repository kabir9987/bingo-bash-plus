import { useEffect, useMemo, useState } from "react";
import { SPIN_SEGMENTS, SpinReward, pickSegmentIndex, expectedValueCoins,
  getWallet, saveWallet, applyReward, canSpinToday, markSpunNow, msUntilNextSpin } from "@/lib/spinWheel";
import { Button } from "@/components/ui/button";
import { Coins, Gem, Sparkles, Zap, Timer, Trophy } from "lucide-react";
import { toast } from "sonner";

const SIZE = 320;
const RADIUS = SIZE / 2;
const SEG = 360 / SPIN_SEGMENTS.length;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(i: number) {
  const start = polar(RADIUS, RADIUS, RADIUS, i * SEG);
  const end = polar(RADIUS, RADIUS, RADIUS, (i + 1) * SEG);
  const large = SEG > 180 ? 1 : 0;
  return `M ${RADIUS} ${RADIUS} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${end.x} ${end.y} Z`;
}

export const SpinWheel = () => {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [wallet, setWallet] = useState(getWallet());
  const [available, setAvailable] = useState(canSpinToday());
  const [countdown, setCountdown] = useState(msUntilNextSpin());
  const [lastReward, setLastReward] = useState<SpinReward | null>(null);

  const ev = useMemo(() => Math.round(expectedValueCoins()), []);

  useEffect(() => {
    if (available) return;
    const t = setInterval(() => {
      const ms = msUntilNextSpin();
      setCountdown(ms);
      if (ms <= 0) setAvailable(true);
    }, 1000);
    return () => clearInterval(t);
  }, [available]);

  const fmt = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const spin = () => {
    if (spinning) return;
    if (!available && wallet.freeSpins <= 0) {
      toast.error("Come back tomorrow or use a free spin!");
      return;
    }
    setSpinning(true);
    setLastReward(null);

    const idx = pickSegmentIndex();
    const target = 360 - (idx * SEG + SEG / 2); // pointer is at top
    const turns = 6; // dramatic spin
    const next = rotation - (rotation % 360) + turns * 360 + target;
    setRotation(next);

    window.setTimeout(() => {
      const reward = SPIN_SEGMENTS[idx];
      let w = wallet;
      if (available) {
        markSpunNow();
        setAvailable(false);
        setCountdown(msUntilNextSpin());
      } else {
        w = { ...w, freeSpins: w.freeSpins - 1 };
      }
      w = applyReward(w, reward);
      saveWallet(w);
      setWallet(w);
      setLastReward(reward);
      setSpinning(false);
      toast.success(`You won ${reward.label}!`, { icon: reward.type === "coins" && reward.amount === 5000 ? "🎰" : "🎉" });
    }, 4200);
  };

  return (
    <div className="surface-card rounded-3xl p-5 sm:p-6 relative overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-secondary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-accent/20 blur-3xl" />

      <div className="flex items-center justify-between mb-4 relative">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Daily Reward</div>
          <h3 className="font-display text-2xl text-gradient-gold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" /> Spin & Win
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-gold"><Coins className="w-4 h-4" /> {wallet.coins.toLocaleString()}</span>
            <span className="flex items-center gap-1 text-accent"><Gem className="w-4 h-4" /> {wallet.gems}</span>
            <span className="flex items-center gap-1 text-secondary"><Zap className="w-4 h-4" /> {wallet.powerups}</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">EV ~{ev}c / spin</div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 relative">
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          {/* pointer */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-20 drop-shadow-[0_0_10px_hsl(45_100%_60%/0.8)]">
            <svg width="32" height="36" viewBox="0 0 32 36">
              <polygon points="16,36 0,0 32,0" fill="hsl(45 100% 55%)" stroke="hsl(45 100% 80%)" strokeWidth="2" />
            </svg>
          </div>
          {/* outer ring */}
          <div className="absolute inset-[-8px] rounded-full bg-gradient-to-br from-gold via-secondary to-accent opacity-80 blur-[1px]" />
          {/* wheel */}
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="relative z-10 rounded-full"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.16, 0.99)" : "none",
              filter: "drop-shadow(0 10px 30px hsl(270 80% 5% / 0.8))",
            }}
          >
            <defs>
              {SPIN_SEGMENTS.map((s, i) => (
                <radialGradient key={s.id} id={`g-${i}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={s.glow} />
                  <stop offset="100%" stopColor={s.color} />
                </radialGradient>
              ))}
            </defs>
            {SPIN_SEGMENTS.map((s, i) => {
              const mid = i * SEG + SEG / 2;
              const labelPos = polar(RADIUS, RADIUS, RADIUS * 0.65, mid);
              return (
                <g key={s.id}>
                  <path d={arcPath(i)} fill={`url(#g-${i})`} stroke="hsl(270 60% 8%)" strokeWidth="2" />
                  <g transform={`translate(${labelPos.x}, ${labelPos.y}) rotate(${mid})`}>
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="hsl(270 60% 8%)"
                      fontSize="16"
                      fontWeight="900"
                      fontFamily="Russo One, sans-serif"
                    >
                      {s.short}
                    </text>
                  </g>
                </g>
              );
            })}
            {/* pegs */}
            {SPIN_SEGMENTS.map((_, i) => {
              const p = polar(RADIUS, RADIUS, RADIUS - 6, i * SEG);
              return <circle key={i} cx={p.x} cy={p.y} r="3" fill="hsl(45 100% 80%)" />;
            })}
          </svg>
          {/* hub */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-full bg-gradient-to-br from-gold to-secondary flex items-center justify-center glow-gold">
            <Trophy className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>

        {lastReward && !spinning && (
          <div className="text-center animate-pop-in">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">You won</div>
            <div className="font-display text-xl text-gradient-gold">{lastReward.label}</div>
          </div>
        )}

        <div className="w-full flex flex-col items-center gap-2">
          <Button
            onClick={spin}
            disabled={spinning || (!available && wallet.freeSpins <= 0)}
            className="h-12 px-8 font-display text-lg bg-gradient-to-r from-gold to-secondary text-primary-foreground glow-gold disabled:opacity-50"
          >
            {spinning ? "Spinning…" : available ? "SPIN FREE" : wallet.freeSpins > 0 ? `Use Free Spin (${wallet.freeSpins})` : "Come back tomorrow"}
          </Button>
          {!available && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Timer className="w-3 h-3" /> Next free spin in {fmt(countdown)}
            </div>
          )}
        </div>
      </div>

      {/* segment legend with probabilities */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        {SPIN_SEGMENTS.map((s) => (
          <div key={s.id} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/30">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-foreground/80 truncate">{s.label}</span>
            <span className="ml-auto text-muted-foreground tabular-nums">{(s.probability * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
