import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getWallet, saveWallet, Wallet } from "@/lib/spinWheel";
import { ArrowLeft, Coins, Gem, Zap, Check, Crown, Flame, Sparkles, Star, Trophy } from "lucide-react";
import { toast } from "sonner";

type CardPack = {
  id: string;
  name: string;
  tagline: string;
  cards: number;
  costCoins?: number;
  costGems?: number;
  jackpot: number;
  perks: string[];
  hue: string;       // hsl base
  badge?: string;
  popular?: boolean;
  premium?: boolean;
};

const PACKS: CardPack[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Quick warm-up round",
    cards: 1,
    costCoins: 200,
    jackpot: 1000,
    perks: ["1 Bingo card", "Auto-daub off", "Standard payout"],
    hue: "190 90% 55%",
  },
  {
    id: "double",
    name: "Double Down",
    tagline: "Two boards, double odds",
    cards: 2,
    costCoins: 500,
    jackpot: 2500,
    perks: ["2 Bingo cards", "+1 Power-Up boost", "1.25× payout"],
    hue: "45 100% 55%",
    badge: "MOST PLAYED",
    popular: true,
  },
  {
    id: "highroller",
    name: "High Roller",
    tagline: "Four boards, big jackpot",
    cards: 4,
    costCoins: 1500,
    jackpot: 10000,
    perks: ["4 Bingo cards", "+2 Power-Ups", "2× payout", "VIP chat"],
    hue: "320 90% 60%",
    badge: "HOT",
  },
  {
    id: "vip",
    name: "VIP Diamond",
    tagline: "Premium gem-only ticket",
    cards: 6,
    costGems: 25,
    jackpot: 50000,
    perks: ["6 Bingo cards", "+3 Power-Ups", "3× payout", "Diamond frame", "Priority matchmaking"],
    hue: "270 90% 65%",
    badge: "ELITE",
    premium: true,
  },
];

const Shop = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<Wallet>(getWallet());
  const [selected, setSelected] = useState<string>("double");

  const totalSpent = useMemo(() => wallet, [wallet]);

  const buy = (pack: CardPack) => {
    const w = { ...wallet };
    if (pack.costCoins != null) {
      if (w.coins < pack.costCoins) return toast.error("Not enough coins. Spin the daily wheel!");
      w.coins -= pack.costCoins;
    }
    if (pack.costGems != null) {
      if (w.gems < pack.costGems) return toast.error("Not enough gems. Try the daily wheel!");
      w.gems -= pack.costGems;
    }
    // Boost power-ups based on pack
    if (pack.id === "double") w.powerups += 1;
    if (pack.id === "highroller") w.powerups += 2;
    if (pack.id === "vip") w.powerups += 3;
    saveWallet(w);
    setWallet(w);
    toast.success(`${pack.name} unlocked! ${pack.cards} card${pack.cards > 1 ? "s" : ""} ready.`, { icon: "🎟️" });
  };

  return (
    <div className="min-h-screen pb-16 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full bg-secondary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full bg-accent/20 blur-3xl" />

      <header className="container pt-6 pb-4 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Home
        </Button>
        <div className="flex items-center gap-3 surface-card rounded-full px-4 py-2 text-sm">
          <span className="flex items-center gap-1 text-gold"><Coins className="w-4 h-4" /> {totalSpent.coins.toLocaleString()}</span>
          <span className="w-px h-4 bg-border" />
          <span className="flex items-center gap-1 text-accent"><Gem className="w-4 h-4" /> {totalSpent.gems}</span>
          <span className="w-px h-4 bg-border" />
          <span className="flex items-center gap-1 text-secondary"><Zap className="w-4 h-4" /> {totalSpent.powerups}</span>
        </div>
      </header>

      <section className="container max-w-6xl text-center pt-4 pb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full surface-card text-xs uppercase tracking-[0.25em] text-gold mb-3">
          <Crown className="w-3.5 h-3.5" /> Card Shop
        </div>
        <h1 className="font-display text-4xl sm:text-6xl leading-tight">
          <span className="text-gradient-gold">Pick your</span>{" "}
          <span className="text-foreground">lucky cards.</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mt-3">
          More cards = more chances. Premium tiers unlock bigger jackpots and power-up boosts.
        </p>
      </section>

      <section className="container max-w-6xl grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {PACKS.map((p) => {
          const isSel = selected === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`group surface-card rounded-3xl p-5 text-left relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                isSel ? "ring-2 ring-gold scale-[1.02]" : "ring-1 ring-transparent"
              } ${p.popular ? "glow-gold" : ""}`}
              style={{
                background: `linear-gradient(160deg, hsl(${p.hue} / 0.18), hsl(270 50% 10%) 70%)`,
              }}
            >
              {p.badge && (
                <div className="absolute top-4 right-4 text-[10px] font-display tracking-widest px-2 py-1 rounded-full"
                  style={{ background: `hsl(${p.hue})`, color: "hsl(270 60% 8%)" }}>
                  {p.badge}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]" style={{ color: `hsl(${p.hue})` }}>
                {p.premium ? <Star className="w-3.5 h-3.5" /> : p.popular ? <Flame className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                {p.tagline}
              </div>
              <h3 className="font-display text-2xl mt-1 text-foreground">{p.name}</h3>

              {/* Mini stacked card preview */}
              <div className="relative h-32 mt-4 mb-3">
                {Array.from({ length: Math.min(p.cards, 4) }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-2xl border border-border/60"
                    style={{
                      background: `linear-gradient(135deg, hsl(${p.hue} / 0.35), hsl(270 50% 14%))`,
                      transform: `translate(${i * 6}px, ${-i * 6}px) rotate(${(i - 1) * 3}deg)`,
                      boxShadow: `0 8px 20px hsl(270 80% 5% / 0.5)`,
                    }}
                  >
                    <div className="grid grid-cols-5 grid-rows-5 gap-0.5 p-2 h-full">
                      {Array.from({ length: 25 }).map((_, j) => (
                        <div key={j} className="rounded-sm"
                          style={{ background: j === 12 ? `hsl(${p.hue})` : `hsl(${p.hue} / 0.18)` }} />
                      ))}
                    </div>
                  </div>
                ))}
                <div className="absolute bottom-1 right-1 text-[10px] font-display px-1.5 py-0.5 rounded bg-background/70 text-foreground">
                  ×{p.cards}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-sm mb-3">
                <Trophy className="w-4 h-4 text-gold" />
                <span className="text-muted-foreground">Jackpot</span>
                <span className="ml-auto font-display text-gold">{p.jackpot.toLocaleString()}</span>
              </div>

              <ul className="space-y-1.5 mb-4">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-xs text-foreground/80">
                    <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: `hsl(${p.hue})` }} />
                    {perk}
                  </li>
                ))}
              </ul>

              <div
                onClick={(e) => { e.stopPropagation(); buy(p); }}
                role="button"
                className="w-full h-11 rounded-xl flex items-center justify-center gap-2 font-display text-base text-primary-foreground transition-transform group-hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, hsl(${p.hue}), hsl(${p.hue.split(" ")[0]} 90% 45%))`,
                  boxShadow: `0 0 20px hsl(${p.hue} / 0.45)`,
                }}
              >
                {p.costCoins != null ? (
                  <>
                    <Coins className="w-4 h-4" /> {p.costCoins.toLocaleString()}
                  </>
                ) : (
                  <>
                    <Gem className="w-4 h-4" /> {p.costGems}
                  </>
                )}
              </div>
            </button>
          );
        })}
      </section>

      <section className="container max-w-6xl mt-12 grid sm:grid-cols-3 gap-4">
        {[
          { icon: <Trophy className="w-5 h-5 text-gold" />, t: "Bigger jackpots", d: "Premium tiers stack progressive prize pools." },
          { icon: <Zap className="w-5 h-5 text-secondary" />, t: "Power-Up boosts", d: "Each pack tops up your power-up arsenal." },
          { icon: <Sparkles className="w-5 h-5 text-accent" />, t: "Daily refresh", d: "Spin the wheel daily to refill your wallet." },
        ].map((b) => (
          <div key={b.t} className="surface-card rounded-2xl p-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center">{b.icon}</div>
            <div>
              <h4 className="font-display text-foreground">{b.t}</h4>
              <p className="text-sm text-muted-foreground">{b.d}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="container max-w-6xl mt-10 flex justify-center">
        <Button
          onClick={() => navigate("/")}
          className="h-12 px-8 font-display text-lg bg-gradient-to-r from-gold to-secondary text-primary-foreground glow-gold"
        >
          <Sparkles className="w-5 h-5 mr-2" /> Take cards into a room
        </Button>
      </div>
    </div>
  );
};

export default Shop;
