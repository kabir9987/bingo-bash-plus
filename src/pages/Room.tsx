import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BingoCard as TCard, Pattern, PowerUps, checkWin, nextBall, generateIndianCard, generateCard, countCompletedLines } from "@/lib/bingo";
import { BingoCard } from "@/components/BingoCard";
import { BingoLetters } from "@/components/BingoLetters";
import { CalledBalls } from "@/components/CalledBalls";
import { PowerUpBar } from "@/components/PowerUpBar";
import { PlayerList } from "@/components/PlayerList";
import { Confetti } from "@/components/Confetti";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Copy, Play, RefreshCw, Trophy } from "lucide-react";

interface Room {
  id: string;
  code: string;
  host_name: string;
  status: string;
  drawn_balls: number[];
  current_ball: number | null;
  winner_name: string | null;
  pattern: string;
}
interface Player {
  id: string;
  room_id: string;
  name: string;
  card: TCard;
  daubed: number[];
  power_ups: PowerUps;
  is_host: boolean;
  has_won: boolean;
}

const Room = () => {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [pattern, setPattern] = useState<Pattern>("line");
  const [doubleActive, setDoubleActive] = useState(0);
  const [diamondActive, setDiamondActive] = useState(false);
  const [peeked, setPeeked] = useState<number[]>([]);
  const drawTimer = useRef<number | null>(null);

  const me = useMemo(() => players.find((p) => p.id === meId) || null, [players, meId]);
  const isHost = !!me?.is_host;

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: r } = await supabase
        .from("bingo_rooms")
        .select()
        .eq("code", code)
        .maybeSingle();
      if (!r) {
        toast.error("Room not found");
        navigate("/");
        return;
      }
      if (cancelled) return;
      setRoom(r as Room);
      setPattern((r.pattern as Pattern) || "line");
      const stored = localStorage.getItem(`bb_player_${r.id}`);
      setMeId(stored);
      const { data: ps } = await supabase
        .from("bingo_players")
        .select()
        .eq("room_id", r.id)
        .order("joined_at");
      setPlayers((ps || []) as unknown as Player[]);
    })();
    return () => { cancelled = true; };
  }, [code, navigate]);

  // Realtime
  useEffect(() => {
    if (!room) return;
    const ch = supabase
      .channel(`room-${room.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "bingo_rooms", filter: `id=eq.${room.id}` },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          setRoom(payload.new as Room);
        })
      .on("postgres_changes",
        { event: "*", schema: "public", table: "bingo_players", filter: `room_id=eq.${room.id}` },
        (payload) => {
          setPlayers((prev) => {
            const newP = payload.new as unknown as Player;
            const oldP = payload.old as unknown as Player;
            if (payload.eventType === "INSERT") return [...prev, newP];
            if (payload.eventType === "DELETE") return prev.filter((p) => p.id !== oldP.id);
            return prev.map((p) => (p.id === newP.id ? newP : p));
          });
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [room?.id]);

  // Auto-draw loop (host only)
  useEffect(() => {
    if (!room || !isHost) return;
    if (room.status !== "playing") return;
    if (room.winner_name) return;
    if (drawTimer.current) window.clearTimeout(drawTimer.current);
    drawTimer.current = window.setTimeout(async () => {
      const next = nextBall(room.drawn_balls);
      if (next == null) return;
      await supabase
        .from("bingo_rooms")
        .update({
          current_ball: next,
          drawn_balls: [...room.drawn_balls, next],
          updated_at: new Date().toISOString(),
        })
        .eq("id", room.id);
    }, 3500);
    return () => { if (drawTimer.current) window.clearTimeout(drawTimer.current); };
  }, [room, isHost]);

  // Auto-daub for double-daub power-up
  useEffect(() => {
    if (!me || !room?.current_ball) return;
    if (doubleActive <= 0) return;
    const num = room.current_ball;
    if (me.card.flat().includes(num) && !me.daubed.includes(num)) {
      void daub(num, true);
      setDoubleActive((d) => Math.max(0, d - 1));
    }
    // remove peek as ball is drawn
    setPeeked((p) => p.filter((n) => n !== num));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.current_ball]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success(`Code ${code} copied!`);
  };

  const startGame = async () => {
    if (!room) return;
    await supabase
      .from("bingo_rooms")
      .update({ status: "playing", pattern, drawn_balls: [], current_ball: null, winner_name: null })
      .eq("id", room.id);
    // reset all players — regenerate cards so the layout matches the chosen pattern
    const { data: roster } = await supabase
      .from("bingo_players")
      .select("id")
      .eq("room_id", room.id);
    if (roster) {
      await Promise.all(
        roster.map((p) =>
          supabase
            .from("bingo_players")
            .update({
              daubed: [],
              has_won: false,
              card: (pattern === "indian" ? generateIndianCard() : generateCard()) as never,
            })
            .eq("id", p.id),
        ),
      );
    }
    toast.success(pattern === "indian" ? "Housie time! Strike all 5 letters." : "Game on!");
  };

  const newRound = async () => {
    if (!room) return;
    await supabase
      .from("bingo_rooms")
      .update({ status: "waiting", drawn_balls: [], current_ball: null, winner_name: null })
      .eq("id", room.id);
    await supabase
      .from("bingo_players")
      .update({ daubed: [], has_won: false })
      .eq("room_id", room.id);
  };

  const daub = useCallback(
    async (num: number, silent = false) => {
      if (!me || !room) return;
      if (room.status !== "playing") return;
      // Diamond: any cell allowed
      if (!diamondActive && !room.drawn_balls.includes(num)) {
        if (!silent) toast.error("That ball hasn't been called!");
        return;
      }
      if (me.daubed.includes(num)) return;
      const newDaubed = [...me.daubed, num];
      const won = checkWin(me.card, newDaubed, (room.pattern as Pattern) || "line");
      await supabase
        .from("bingo_players")
        .update({ daubed: newDaubed, has_won: won })
        .eq("id", me.id);
      if (diamondActive) setDiamondActive(false);
      if (won) {
        await supabase
          .from("bingo_rooms")
          .update({ winner_name: me.name, status: "finished" })
          .eq("id", room.id);
      }
    },
    [me, room, diamondActive],
  );

  const usePower = async (key: keyof PowerUps) => {
    if (!me || !room || room.status !== "playing") return;
    if (me.power_ups[key] <= 0) return;
    const newPU = { ...me.power_ups, [key]: me.power_ups[key] - 1 } as unknown as PowerUps;

    if (key === "instant") {
      // Auto-daub everything to win current pattern: simply mark all numbers from card
      const allNums = me.card.flat().filter((n) => n !== 0);
      await supabase
        .from("bingo_players")
        .update({ daubed: allNums, has_won: true, power_ups: newPU as never })
        .eq("id", me.id);
      await supabase
        .from("bingo_rooms")
        .update({ winner_name: me.name, status: "finished" })
        .eq("id", room.id);
      toast.success("INSTANT BINGO! 🎉");
      return;
    }
    if (key === "doubleDaub") {
      setDoubleActive(2);
      toast("Double Daub armed for next 2 calls", { icon: "⚡" });
    }
    if (key === "diamond") {
      setDiamondActive(true);
      toast("Tap any cell to mark with Diamond", { icon: "💎" });
    }
    if (key === "reveal") {
      const remaining: number[] = [];
      for (let n = 1; n <= 75; n++) if (!room.drawn_balls.includes(n)) remaining.push(n);
      const peek = remaining.sort(() => Math.random() - 0.5).slice(0, 3);
      setPeeked(peek);
      toast("Next 3 likely calls revealed", { icon: "👁️" });
    }
    await supabase.from("bingo_players").update({ power_ups: newPU as never }).eq("id", me.id);
  };

  const leave = async () => {
    if (me) await supabase.from("bingo_players").delete().eq("id", me.id);
    localStorage.removeItem(`bb_player_${room?.id}`);
    navigate("/");
  };

  if (!room) {
    return <div className="container py-20 text-center text-muted-foreground">Loading room…</div>;
  }

  const winner = room.winner_name;

  return (
    <div className="min-h-screen pb-12">
      <Confetti active={!!winner && winner === me?.name} />

      <header className="container pt-6 pb-4 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={leave} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Leave
        </Button>
        <button
          onClick={copyCode}
          className="surface-card rounded-2xl px-4 py-2 flex items-center gap-2 hover:scale-105 transition"
        >
          <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Room</span>
          <span className="font-marquee text-2xl text-gradient-gold tracking-[0.3em]">{code}</span>
          <Copy className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="text-xs text-muted-foreground hidden sm:block">
          {room.status === "playing" ? "● LIVE" : room.status === "finished" ? "Finished" : "Lobby"}
        </div>
      </header>

      {winner && (
        <div className="container mb-4">
          <div className="surface-card rounded-3xl p-6 text-center glow-gold">
            <Trophy className="w-10 h-10 text-gold mx-auto mb-2" />
            <div className="font-display text-3xl text-gradient-gold">
              {winner === me?.name ? "YOU GOT BINGO!" : `${winner} got BINGO!`}
            </div>
            {isHost && (
              <Button onClick={newRound} className="mt-4 bg-gradient-to-r from-gold to-secondary text-primary-foreground font-display">
                <RefreshCw className="w-4 h-4 mr-2" /> New Round
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="container grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-4">
          {room.status === "waiting" && (
            <div className="surface-card rounded-3xl p-6 text-center space-y-4">
              <h2 className="font-display text-2xl text-gradient-gold">
                Waiting for players…
              </h2>
              <p className="text-sm text-muted-foreground">
                Share code <span className="text-gold font-marquee tracking-widest">{code}</span> with friends.
              </p>
              {isHost ? (
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Select value={pattern} onValueChange={(v) => setPattern(v as Pattern)}>
                    <SelectTrigger className="w-44 bg-muted/40 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line (any)</SelectItem>
                      <SelectItem value="corners">Four Corners</SelectItem>
                      <SelectItem value="x">X Pattern</SelectItem>
                      <SelectItem value="blackout">Blackout</SelectItem>
                      <SelectItem value="indian">Indian Classic (B-I-N-G-O)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={startGame}
                    disabled={players.length < 1}
                    className="font-display bg-gradient-to-r from-gold to-secondary text-primary-foreground glow-gold h-12 px-6"
                  >
                    <Play className="w-4 h-4 mr-2" /> Start Game
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Host {room.host_name} will start the game.
                </p>
              )}
            </div>
          )}

          {room.status !== "waiting" && (
            <CalledBalls drawn={room.drawn_balls} current={room.current_ball} />
          )}

          {me && room.pattern === "indian" && room.status !== "waiting" && (
            <BingoLetters linesCompleted={countCompletedLines(me.card, me.daubed)} />
          )}

          {me && (
            <BingoCard
              card={me.card}
              daubed={me.daubed}
              drawn={room.drawn_balls}
              onDaub={(n) => daub(n)}
              diamondMode={diamondActive}
              noFreeSpace={room.pattern === "indian"}
            />
          )}

          {me && room.status === "playing" && (
            <PowerUpBar
              powerUps={me.power_ups}
              onUse={usePower}
              doubleActive={doubleActive}
              diamondActive={diamondActive}
              peeked={peeked}
            />
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <PlayerList players={players} meId={meId} />
          <div className="surface-card rounded-3xl p-4 text-center">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
              Pattern
            </div>
            <div className="font-display text-xl text-gradient-gold capitalize">
              {room.pattern}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Room;
