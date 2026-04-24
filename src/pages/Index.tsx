import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { generateCard, generateRoomCode } from "@/lib/bingo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BingoBall } from "@/components/BingoBall";
import { SpinWheel } from "@/components/SpinWheel";
import { Sparkles, Plus, LogIn, Crown, Activity, Globe2, ShoppingBag } from "lucide-react";
import hero from "@/assets/hero-bingo.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [name, setName] = useState(localStorage.getItem("bb_name") || "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [livePlayers, setLivePlayers] = useState(0);
  const [activeRooms, setActiveRooms] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ count: pCount }, { count: rCount }] = await Promise.all([
        supabase.from("bingo_players").select("*", { count: "exact", head: true }),
        supabase.from("bingo_rooms").select("*", { count: "exact", head: true }).eq("status", "playing"),
      ]);
      if (cancelled) return;
      setLivePlayers(pCount ?? 0);
      setActiveRooms(rCount ?? 0);
    })();
    return () => { cancelled = true; };
  }, []);

  const persistMe = (playerId: string, roomId: string) => {
    localStorage.setItem("bb_name", name);
    localStorage.setItem(`bb_player_${roomId}`, playerId);
  };

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Enter your name to start");
    setBusy(true);
    const roomCode = generateRoomCode();
    const { data: room, error } = await supabase
      .from("bingo_rooms")
      .insert({ code: roomCode, host_name: name.trim() })
      .select()
      .single();
    if (error || !room) { setBusy(false); return toast.error("Could not create room"); }
    const { data: player, error: pErr } = await supabase
      .from("bingo_players")
      .insert({ room_id: room.id, name: name.trim(), card: generateCard() as never, is_host: true })
      .select()
      .single();
    if (pErr || !player) { setBusy(false); return toast.error("Could not join room"); }
    persistMe(player.id, room.id);
    navigate(`/room/${roomCode}`);
  };

  const handleJoin = async () => {
    if (!name.trim()) return toast.error("Enter your name to join");
    if (code.trim().length < 4) return toast.error("Enter a valid room code");
    setBusy(true);
    const cleanCode = code.trim().toUpperCase();
    const { data: room } = await supabase.from("bingo_rooms").select().eq("code", cleanCode).maybeSingle();
    if (!room) { setBusy(false); return toast.error("Room not found"); }
    const { data: player, error } = await supabase
      .from("bingo_players")
      .insert({ room_id: room.id, name: name.trim(), card: generateCard() as never })
      .select()
      .single();
    if (error || !player) { setBusy(false); return toast.error("Could not join room"); }
    persistMe(player.id, room.id);
    navigate(`/room/${cleanCode}`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img
          src={hero}
          alt="Bingo Bash hero — gold balls flying through neon lights"
          width={1920}
          height={1080}
          className="w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
      </div>

      <header className="container pt-8 pb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="animate-float">
            <BingoBall number={26} size="md" glow />
          </div>
          <div>
            <h1 className="font-marquee text-2xl sm:text-3xl text-gradient-gold leading-none">
              BINGO BASH
            </h1>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Multiplayer Party
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-gold">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            {livePlayers} online
          </span>
          <span className="flex items-center gap-1.5 text-accent">
            <Activity className="w-3.5 h-3.5" /> {activeRooms} live rooms
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Globe2 className="w-3.5 h-3.5" /> Realtime worldwide
          </span>
        </div>
      </header>

      <main className="container max-w-6xl pt-4 pb-20">
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full surface-card text-xs uppercase tracking-[0.25em] text-gold mb-4">
            <Crown className="w-3.5 h-3.5" /> Season 1 · Vegas Vibes
          </div>
          <h2 className="font-display text-4xl sm:text-6xl leading-[0.95] mb-3">
            <span className="text-gradient-gold">Bingo Night,</span>{" "}
            <span className="text-foreground">together.</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Spin the daily wheel, host a private room, and race your crew to{" "}
            <span className="text-gold font-semibold">BINGO!</span>
          </p>
          <div className="mt-5 flex justify-center gap-2">
            {[12, 34, 56, 7, 71].map((n) => (
              <div key={n} className="animate-float" style={{ animationDelay: `${n * 0.05}s` }}>
                <BingoBall number={n} size="sm" />
              </div>
            ))}
          </div>
        </section>

        {/* Main grid: spin wheel + room actions */}
        <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
          <SpinWheel />

          <div className="space-y-5">
            <div className="surface-card rounded-3xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-gold">
                <Plus className="w-5 h-5" />
                <h3 className="font-display text-xl">Host a Room</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Generate a 5-character pass and share it with friends.
              </p>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={16}
                className="bg-muted/40 border-border h-12 text-base"
              />
              <Button
                onClick={handleCreate}
                disabled={busy}
                className="h-12 font-display text-lg bg-gradient-to-r from-gold to-secondary text-primary-foreground hover:opacity-90 glow-gold"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Create Room
              </Button>
            </div>

            <div className="surface-card rounded-3xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-accent">
                <LogIn className="w-5 h-5" />
                <h3 className="font-display text-xl">Join with Code</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Got an invite? Drop the room pass below.
              </p>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Room pass (e.g. K7M2P)"
                maxLength={6}
                className="bg-muted/40 border-border h-12 text-base font-display tracking-[0.3em] text-center"
              />
              <Button
                onClick={handleJoin}
                disabled={busy}
                className="h-12 font-display text-lg bg-gradient-to-r from-accent to-cyan text-primary-foreground hover:opacity-90 glow-cyan"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Join Room
              </Button>
            </div>
          </div>
        </div>

        <section className="mt-12 grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { t: "75-Ball Classic", d: "Lines, X, four corners, blackout & Indian Housie." },
            { t: "Power-Ups", d: "Instant Bingo, Double Daub, Diamond & Peek." },
            { t: "Realtime", d: "Every call & daub syncs to all players instantly." },
          ].map((f) => (
            <div key={f.t} className="surface-card rounded-2xl p-5 text-center">
              <h4 className="font-display text-gold mb-1">{f.t}</h4>
              <p className="text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </section>

        <div className="md:hidden mt-8 flex items-center justify-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-gold">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            {livePlayers} online
          </span>
          <span className="flex items-center gap-1.5 text-accent">
            <Activity className="w-3.5 h-3.5" /> {activeRooms} live rooms
          </span>
        </div>
      </main>
    </div>
  );
};

export default Index;
