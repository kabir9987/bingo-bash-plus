
-- Rooms table
CREATE TABLE public.bingo_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  host_name text NOT NULL,
  status text NOT NULL DEFAULT 'waiting',
  drawn_balls integer[] NOT NULL DEFAULT '{}',
  current_ball integer,
  winner_name text,
  pattern text NOT NULL DEFAULT 'line',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Players table
CREATE TABLE public.bingo_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.bingo_rooms(id) ON DELETE CASCADE,
  name text NOT NULL,
  card jsonb NOT NULL,
  daubed integer[] NOT NULL DEFAULT '{}',
  power_ups jsonb NOT NULL DEFAULT '{"instant":1,"doubleDaub":2,"diamond":1,"reveal":2}'::jsonb,
  is_host boolean NOT NULL DEFAULT false,
  has_won boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_room ON public.bingo_players(room_id);
CREATE INDEX idx_rooms_code ON public.bingo_rooms(code);

ALTER TABLE public.bingo_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bingo_players ENABLE ROW LEVEL SECURITY;

-- Open access for share-code multiplayer (no auth)
CREATE POLICY "rooms_all_select" ON public.bingo_rooms FOR SELECT USING (true);
CREATE POLICY "rooms_all_insert" ON public.bingo_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "rooms_all_update" ON public.bingo_rooms FOR UPDATE USING (true);

CREATE POLICY "players_all_select" ON public.bingo_players FOR SELECT USING (true);
CREATE POLICY "players_all_insert" ON public.bingo_players FOR INSERT WITH CHECK (true);
CREATE POLICY "players_all_update" ON public.bingo_players FOR UPDATE USING (true);
CREATE POLICY "players_all_delete" ON public.bingo_players FOR DELETE USING (true);

-- Realtime
ALTER TABLE public.bingo_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.bingo_players REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bingo_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bingo_players;
