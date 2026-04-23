// Bingo game logic — 75-ball
export const COLUMNS = ["B", "I", "N", "G", "O"] as const;
export type Column = typeof COLUMNS[number];

export const COLUMN_RANGES: Record<Column, [number, number]> = {
  B: [1, 15],
  I: [16, 30],
  N: [31, 45],
  G: [46, 60],
  O: [61, 75],
};

export type BingoCard = number[][]; // 5 columns x 5 rows; center [2][2] = 0 (free)

export function generateCard(): BingoCard {
  const card: BingoCard = [];
  COLUMNS.forEach((col, ci) => {
    const [min, max] = COLUMN_RANGES[col];
    const pool: number[] = [];
    for (let n = min; n <= max; n++) pool.push(n);
    // shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const colNums = pool.slice(0, 5);
    if (ci === 2) colNums[2] = 0; // free space
    card.push(colNums);
  });
  return card;
}

export function columnFor(num: number): Column {
  for (const c of COLUMNS) {
    const [min, max] = COLUMN_RANGES[c];
    if (num >= min && num <= max) return c;
  }
  return "B";
}

// Indian Housie-style card: 5x5 with 25 unique numbers from 1..75, no free space.
export function generateIndianCard(): BingoCard {
  const pool: number[] = [];
  for (let n = 1; n <= 75; n++) pool.push(n);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picks = pool.slice(0, 25);
  const card: BingoCard = [[], [], [], [], []];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      card[c].push(picks[r * 5 + c]);
    }
  }
  return card;
}

// Patterns
export type Pattern = "line" | "x" | "blackout" | "corners" | "indian";

// Count completed lines (rows + columns + 2 diagonals) — used for Indian mode.
export function countCompletedLines(card: BingoCard, daubedNums: number[]): number {
  const d = new Set(daubedNums);
  const cell = (c: number, r: number) => {
    const num = card[c][r];
    if (num === 0) return true;
    return d.has(num);
  };
  let count = 0;
  for (let r = 0; r < 5; r++) {
    let ok = true;
    for (let c = 0; c < 5; c++) if (!cell(c, r)) { ok = false; break; }
    if (ok) count++;
  }
  for (let c = 0; c < 5; c++) {
    let ok = true;
    for (let r = 0; r < 5; r++) if (!cell(c, r)) { ok = false; break; }
    if (ok) count++;
  }
  let d1 = true, d2 = true;
  for (let i = 0; i < 5; i++) {
    if (!cell(i, i)) d1 = false;
    if (!cell(i, 4 - i)) d2 = false;
  }
  if (d1) count++;
  if (d2) count++;
  return count;
}

function isDaubed(card: BingoCard, daubed: Set<number>, col: number, row: number) {
  const num = card[col][row];
  if (num === 0) return true; // free
  return daubed.has(num);
}

export function checkWin(card: BingoCard, daubedNums: number[], pattern: Pattern): boolean {
  const d = new Set(daubedNums);
  const cell = (c: number, r: number) => isDaubed(card, d, c, r);

  if (pattern === "indian") {
    return countCompletedLines(card, daubedNums) >= 5;
  }

  if (pattern === "corners") {
    return cell(0, 0) && cell(4, 0) && cell(0, 4) && cell(4, 4);
  }

  if (pattern === "x") {
    let ok = true;
    for (let i = 0; i < 5; i++) {
      if (!cell(i, i)) ok = false;
      if (!cell(i, 4 - i)) ok = false;
    }
    return ok;
  }

  if (pattern === "blackout") {
    for (let c = 0; c < 5; c++)
      for (let r = 0; r < 5; r++) if (!cell(c, r)) return false;
    return true;
  }

  // line: any row, column, or diagonal
  for (let r = 0; r < 5; r++) {
    let ok = true;
    for (let c = 0; c < 5; c++) if (!cell(c, r)) { ok = false; break; }
    if (ok) return true;
  }
  for (let c = 0; c < 5; c++) {
    let ok = true;
    for (let r = 0; r < 5; r++) if (!cell(c, r)) { ok = false; break; }
    if (ok) return true;
  }
  let d1 = true, d2 = true;
  for (let i = 0; i < 5; i++) {
    if (!cell(i, i)) d1 = false;
    if (!cell(i, 4 - i)) d2 = false;
  }
  return d1 || d2;
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function nextBall(drawn: number[]): number | null {
  const remaining: number[] = [];
  for (let n = 1; n <= 75; n++) if (!drawn.includes(n)) remaining.push(n);
  if (remaining.length === 0) return null;
  return remaining[Math.floor(Math.random() * remaining.length)];
}

export type PowerUps = {
  instant: number;     // instant bingo: auto-win this round
  doubleDaub: number;  // daub the next 2 calls automatically
  diamond: number;     // mark any 1 free cell
  reveal: number;      // peek next 3 balls
};
