// Daily Spin Wheel — 8 segments
// Probabilities tuned for retention + balanced economy.
// Common low-coin rewards dominate; jackpot is a rare hook.
//
// Expected Value calculation (per single spin):
//   100c  ×0.30 = 30c
//   200c  ×0.22 = 44c
//   300c  ×0.15 = 45c
//   PowerUp×0.12 ≈ 60c equivalent value (power-up valued at ~500c) → 60c
//   5 gems ×0.10 = 0.5 gems  (≈ 50c if 1 gem ≈ 100c) → 50c
//   10 gems×0.06 = 0.6 gems  (≈ 60c) → 60c
//   FreeSpin×0.04 = 0.04 spins (≈ EV of another spin, retention value)
//   5000c  ×0.01 = 50c
// Total EV ≈ 339 coins + 1.1 gems + 0.04 spins (≈ ~340–400 coins equiv.)

export type SpinReward = {
  id: string;
  label: string;
  short: string;
  type: "coins" | "gems" | "powerup" | "spin";
  amount: number;
  probability: number; // 0..1
  color: string;       // hsl()
  glow: string;        // hsl()
};

export const SPIN_SEGMENTS: SpinReward[] = [
  { id: "c100",  label: "100 Coins",   short: "100",   type: "coins",   amount: 100,  probability: 0.30, color: "hsl(45 90% 55%)",  glow: "hsl(45 100% 70%)"  },
  { id: "c200",  label: "200 Coins",   short: "200",   type: "coins",   amount: 200,  probability: 0.22, color: "hsl(35 95% 55%)",  glow: "hsl(35 100% 70%)"  },
  { id: "gem5",  label: "5 Gems",      short: "5💎",   type: "gems",    amount: 5,    probability: 0.10, color: "hsl(190 95% 55%)", glow: "hsl(190 100% 70%)" },
  { id: "c300",  label: "300 Coins",   short: "300",   type: "coins",   amount: 300,  probability: 0.15, color: "hsl(45 90% 50%)",  glow: "hsl(45 100% 65%)"  },
  { id: "pu",    label: "Power-Up",    short: "⚡",    type: "powerup", amount: 1,    probability: 0.12, color: "hsl(280 80% 60%)", glow: "hsl(280 100% 75%)" },
  { id: "gem10", label: "10 Gems",     short: "10💎",  type: "gems",    amount: 10,   probability: 0.06, color: "hsl(170 90% 50%)", glow: "hsl(170 100% 65%)" },
  { id: "spin",  label: "Free Spin",   short: "🎯",    type: "spin",    amount: 1,    probability: 0.04, color: "hsl(320 90% 60%)", glow: "hsl(320 100% 75%)" },
  { id: "jp",    label: "JACKPOT 5000", short: "5000", type: "coins",   amount: 5000, probability: 0.01, color: "hsl(0 85% 55%)",   glow: "hsl(0 100% 70%)"   },
];

export function pickSegmentIndex(): number {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < SPIN_SEGMENTS.length; i++) {
    acc += SPIN_SEGMENTS[i].probability;
    if (r <= acc) return i;
  }
  return SPIN_SEGMENTS.length - 1;
}

// Coin equivalents for EV display
const GEM_TO_COIN = 10;
const POWERUP_TO_COIN = 500;
const SPIN_TO_COIN = 340; // roughly self-referential EV

export function expectedValueCoins(): number {
  return SPIN_SEGMENTS.reduce((sum, s) => {
    let coinValue = 0;
    if (s.type === "coins") coinValue = s.amount;
    else if (s.type === "gems") coinValue = s.amount * GEM_TO_COIN;
    else if (s.type === "powerup") coinValue = POWERUP_TO_COIN;
    else if (s.type === "spin") coinValue = SPIN_TO_COIN;
    return sum + coinValue * s.probability;
  }, 0);
}

const LAST_SPIN_KEY = "bb_last_spin";
const WALLET_KEY = "bb_wallet";

export type Wallet = { coins: number; gems: number; powerups: number; freeSpins: number };

export function getWallet(): Wallet {
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { coins: 500, gems: 5, powerups: 0, freeSpins: 0 };
}

export function saveWallet(w: Wallet) {
  localStorage.setItem(WALLET_KEY, JSON.stringify(w));
}

export function applyReward(w: Wallet, r: SpinReward): Wallet {
  const next = { ...w };
  if (r.type === "coins") next.coins += r.amount;
  if (r.type === "gems") next.gems += r.amount;
  if (r.type === "powerup") next.powerups += r.amount;
  if (r.type === "spin") next.freeSpins += r.amount;
  return next;
}

export function canSpinToday(): boolean {
  const last = localStorage.getItem(LAST_SPIN_KEY);
  if (!last) return true;
  const lastDay = new Date(parseInt(last, 10)).toDateString();
  return lastDay !== new Date().toDateString();
}

export function markSpunNow() {
  localStorage.setItem(LAST_SPIN_KEY, Date.now().toString());
}

export function msUntilNextSpin(): number {
  const next = new Date();
  next.setHours(24, 0, 0, 0);
  return next.getTime() - Date.now();
}
