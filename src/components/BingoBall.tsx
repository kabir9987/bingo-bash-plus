import { columnFor } from "@/lib/bingo";
import { cn } from "@/lib/utils";

const colorFor = (n: number) => {
  const c = columnFor(n);
  return {
    B: "ball-b",
    I: "ball-i",
    N: "ball-n",
    G: "ball-g",
    O: "ball-o",
  }[c];
};

interface Props {
  number: number;
  size?: "sm" | "md" | "lg" | "xl";
  glow?: boolean;
  className?: string;
}

const sizes = {
  sm: "w-10 h-10 text-sm",
  md: "w-14 h-14 text-base",
  lg: "w-20 h-20 text-2xl",
  xl: "w-32 h-32 text-5xl",
};

export const BingoBall = ({ number, size = "md", glow, className }: Props) => {
  const col = columnFor(number);
  return (
    <div
      className={cn(
        "ball-shine rounded-full flex flex-col items-center justify-center font-display text-primary-foreground border-2 border-white/40 shadow-lg select-none",
        colorFor(number),
        sizes[size],
        glow && "animate-pulse-gold",
        className,
      )}
    >
      <span className="text-[0.55em] opacity-80 leading-none">{col}</span>
      <span className="leading-none">{number}</span>
    </div>
  );
};
