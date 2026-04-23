import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { generateCard, generateRoomCode } from "@/lib/bingo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BingoBall } from "@/components/BingoBall";
import { Sparkles, Users, Plus, LogIn } from "lucide-react";
import hero from "@/assets/hero-bingo.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [name, setName] = useState(localStorage.getItem("bb_name") || "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

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
    if (error || !room) {
      setBusy(false);
      return toast.error("Could not create room");
    }
    const { data: player, error: pErr } = await supabase
      .from("bingo_players")
      .insert({
        room_id: room.id,
        name: name.trim(),
        card: generateCard() as never,
        is_host: true,
      })
      .select()
      .single();
    if (pErr || !player) {
      setBusy(false);
      return toast.error("Could not join room");
    }
    persistMe(player.id, room.id);
    navigate(`/room/${roomCode}`);
  };

  const handleJoin = async () => {
    if (!name.trim()) return toast.error("Enter your name to join");
    if (code.trim().length < 4) return toast.error("Enter a valid room code");
    setBusy(true);
    const cleanCode = code.trim().toUpperCase();
    const { data: room } = await supabase
      .from("bingo_rooms")
      .select()
      .eq("code", cleanCode)
      .maybeSingle();
    if (!room) {
      setBusy(false);
      return toast.error("Room not found");
    }
    const { data: player, error } = await supabase
      .from("bingo_players")
      .insert({
        room_id: room.id,
        name: name.trim(),
        card: generateCard() as never,
      })
      .select()
      .single();
    if (error || !player) {
      setBusy(false);
      return toast.error("Could not join room");
    }
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
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background" />
      </div>

      <header className="container pt-10 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="animate-float">
            <BingoBall number={26} size="md" glow />
          </div>
          <div>
            <h1 className="font-marquee text-2xl sm:text-3xl text-gradient-gold leading-none">
              BINGO BASH
            </h1>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Multiplayer Party
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="w-4 h-4" /> Play with friends
        </div>
      </header>

      <main className="container max-w-5xl pt-8 pb-20">
        <section className="text-center mb-12">
          <h2 className="font-display text-5xl sm:text-7xl leading-[0.95] mb-4">
            <span className="text-gradient-gold">Bingo Night,</span>
            <br />
            <span className="text-foreground">Reimagined.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            75-ball bingo with explosive power-ups. Spin up a private room, share the pass, and
            race your friends to <span className="text-gold font-semibold">BINGO!</span>
          </p>
          <div className="mt-6 flex justify-center gap-2">
            {[12, 34, 56, 7, 71].map((n) => (
              <div key={n} className="animate-float" style={{ animationDelay: `${n * 0.05}s` }}>
                <BingoBall number={n} size="sm" />
              </div>
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="surface-card rounded-3xl p-6 sm:p-8 flex flex-col gap-4">
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

          <div className="surface-card rounded-3xl p-6 sm:p-8 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-accent">
              <LogIn className="w-5 h-5" />
              <h3 className="font-display text-xl">Join with Code</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Got an invite? Drop the room pass below.
            </p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={16}
              className="bg-muted/40 border-border h-12 text-base"
            />
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

        <section className="mt-16 grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { t: "75-Ball Classic", d: "Lines, X, four corners & full blackout patterns." },
            { t: "Power-Ups", d: "Instant Bingo, Double Daub, Diamond & Peek." },
            { t: "Realtime", d: "Every call & daub syncs to all players instantly." },
          ].map((f) => (
            <div key={f.t} className="surface-card rounded-2xl p-5 text-center">
              <h4 className="font-display text-gold mb-1">{f.t}</h4>
              <p className="text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Index;
