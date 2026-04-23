import { useEffect, useState } from "react";

const COLORS = ["hsl(45 100% 60%)", "hsl(320 90% 60%)", "hsl(190 95% 60%)", "hsl(120 80% 55%)"];

export const Confetti = ({ active }: { active: boolean }) => {
  const [pieces, setPieces] = useState<{ id: number; left: number; delay: number; color: string }[]>([]);

  useEffect(() => {
    if (!active) return;
    setPieces(
      Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })),
    );
  }, [active]);

  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
          }}
          className="absolute -top-4 w-3 h-4 rounded-sm"
        />
      ))}
      <style>{`
        .pointer-events-none span {
          animation: confetti-burst 2.5s linear forwards;
        }
      `}</style>
    </div>
  );
};
