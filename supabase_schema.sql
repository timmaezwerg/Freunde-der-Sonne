-- ==============================================================================
-- FREUNDE DER SONNE - SUPABASE SCHEMA & INITIAL SEEDING
-- ==============================================================================
-- Anleitung:
-- 1. Öffne dein Supabase Projekt (https://supabase.com/dashboard)
-- 2. Klicke links im Menü auf 'SQL Editor' -> 'New Query'
-- 3. Füge dieses gesamte Skript ein und klicke auf 'Run' (Ausführen)
-- ==============================================================================

-- 1. Tabellen erstellen falls noch nicht vorhanden
CREATE TABLE IF NOT EXISTS public.members (
    id INT PRIMARY KEY,
    name TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    pin TEXT DEFAULT '1234',
    color TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.events (
    id INT PRIMARY KEY,
    round INT NOT NULL,
    title TEXT NOT NULL,
    organizer_id INT REFERENCES public.members(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    packing_list JSONB DEFAULT '[]'::jsonb,
    rsvps JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'upcoming',
    is_frozen BOOLEAN DEFAULT FALSE,
    pending_jokers JSONB DEFAULT '[]'::jsonb,
    scores JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Migration für bestehende Datenbanken
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS rsvps JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.history_seasons (
    year INT PRIMARY KEY,
    title TEXT NOT NULL,
    winner JSONB,
    last JSONB,
    summary TEXT,
    scores JSONB,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. Row Level Security (RLS) aktivieren & Lese-/Schreibzugriff für Anon-Client erlauben
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history_seasons ENABLE ROW LEVEL SECURITY;

-- Vorherige Policies löschen falls vorhanden
DROP POLICY IF EXISTS "Anon public access for members" ON public.members;
DROP POLICY IF EXISTS "Anon public access for events" ON public.events;
DROP POLICY IF EXISTS "Anon public access for history_seasons" ON public.history_seasons;

-- Voller Zugriff für die App via Anon Key
CREATE POLICY "Anon public access for members" ON public.members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon public access for events" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon public access for history_seasons" ON public.history_seasons FOR ALL USING (true) WITH CHECK (true);

-- 3. Supabase Realtime für Live-Synchronisation aktivieren
BEGIN;
  -- Prüfen ob Realtime-Publikation existiert und Tabellen hinzufügen
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'members'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'events'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
    END IF;
  END
  $$;
COMMIT;

-- 4. Initialdaten einfügen (UPSERT: überschreibt oder legt neu an)

-- 4a. 8 Freunde
INSERT INTO public.members (id, name, nickname, avatar, pin, color, is_admin)
VALUES
  (1, 'Lukas', 'Luki', '🎯', '1234', '#38bdf8', false),
  (2, 'Oli', 'Oli-Wan', '🧢', '1234', '#ec4899', false),
  (3, 'Sven', 'Der Stratege', '🧠', '1234', '#a855f7', false),
  (4, 'Tobi', 'Kraftpaket', '⚡', '1234', '#facc15', false),
  (5, 'Tomi', 'Sonnenanbeter', '☀️', '1234', '#ea580c', false),
  (6, 'Tim', 'Der Macher', '👑', '1234', '#f59e0b', false),
  (7, 'Gabi', 'Dauerläufer', '🏃‍♂️', '1234', '#059669', false),
  (8, 'Aaron', 'Glückspilz', '🍀', '1234', '#a3e635', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  nickname = COALESCE(members.nickname, EXCLUDED.nickname),
  avatar = COALESCE(members.avatar, EXCLUDED.avatar),
  color = EXCLUDED.color,
  is_admin = EXCLUDED.is_admin;

-- 4b. Historie 2025
INSERT INTO public.history_seasons (year, title, winner, last, summary, scores)
VALUES (
  2025,
  'Saison 2025',
  '{"name": "Lukas (Luki)", "points": 41, "title": "Sonnenkönig 2025 👑"}'::jsonb,
  '{"name": "Gabi & Tomi", "points": 21, "title": "Grillmeister 2025 🥩"}'::jsonb,
  'Lukas sicherte sich 2025 mit 41 Punkten die Krone der Sonne! Oli belegte Rang 2 mit 36 Punkten.',
  '[
    {"rank": 1, "name": "Lukas (Luki)", "points": 41, "rounds": [5, 7, 7, 7, 6, 4, 5], "avatar": "🎯"},
    {"rank": 2, "name": "Oli", "points": 36, "rounds": [4, 6, 4, 5, 4, 6, 7], "avatar": "🧢"},
    {"rank": 3, "name": "Tim", "points": 29, "rounds": [1, 4, 5, 6, 5, 3, 5], "avatar": "👑"},
    {"rank": 4, "name": "Sven", "points": 26, "rounds": [3, 1, 6, 4, 3, 7, 2], "avatar": "🧠"},
    {"rank": 5, "name": "Tobi", "points": 24, "rounds": [1, 2, 5, 3, 7, 5, 1], "avatar": "⚡"},
    {"rank": 6, "name": "Gabi", "points": 21, "rounds": [6, 5, 3, 1, 1, 2, 3], "avatar": "🏃‍♂️"},
    {"rank": 7, "name": "Tomi", "points": 21, "rounds": [7, 3, 1, 2, 1, 1, 6], "avatar": "☀️"}
  ]'::jsonb
)
ON CONFLICT (year) DO NOTHING;

-- 4c. Alle 8 Spieltage 2026 (mit den bisherigen echten Ergebnissen und Jokern)
INSERT INTO public.events (id, round, title, organizer_id, date, time, location, description, packing_list, status, is_frozen, pending_jokers, scores)
VALUES
(
  1, 1, 'Poker-Turnier & Drinks', 2, '2026-01-24', '18:00 Uhr', 'Olis Poker-Lounge',
  'Auftakt-Spieltag 2026 bei Oli! Großes Texas Hold''em Pokerturnier. Alle Plätze von 1 bis 8 wurden regulär ausgespielt – kein Spieler hat einen Joker gesetzt.',
  '["Pokerface", "Gute Laune", "Durst"]'::jsonb,
  'completed', true, '[]'::jsonb,
  '[
    {"playerId": 1, "rank": 1, "basePoints": 8, "points": 8, "jokerApplied": false},
    {"playerId": 6, "rank": 2, "basePoints": 7, "points": 7, "jokerApplied": false},
    {"playerId": 7, "rank": 3, "basePoints": 6, "points": 6, "jokerApplied": false},
    {"playerId": 5, "rank": 4, "basePoints": 5, "points": 5, "jokerApplied": false},
    {"playerId": 4, "rank": 5, "basePoints": 4, "points": 4, "jokerApplied": false},
    {"playerId": 3, "rank": 6, "basePoints": 3, "points": 3, "jokerApplied": false},
    {"playerId": 8, "rank": 7, "basePoints": 2, "points": 2, "jokerApplied": false},
    {"playerId": 2, "rank": 8, "basePoints": 1, "points": 1, "jokerApplied": false}
  ]'::jsonb
),
(
  2, 2, 'Quizduell-Meisterschaft', 1, '2026-03-13', '19:00 Uhr', 'Kneipen-Bar & Quiz-Arena',
  'Wissensduell im Kneipenformat bei Lukas! Tim, Oli und Tomi haben vorab ihren Jahres-Joker gezündet und jeweils 12 Punkte (6x2) abgeräumt!',
  '["Allgemeinwissen", "Schnelle Finger", "Teamgeist"]'::jsonb,
  'completed', true, '[]'::jsonb,
  '[
    {"playerId": 1, "rank": 1, "basePoints": 8, "points": 8, "jokerApplied": false},
    {"playerId": 4, "rank": 1, "basePoints": 8, "points": 8, "jokerApplied": false},
    {"playerId": 6, "rank": 3, "basePoints": 6, "points": 12, "jokerApplied": true},
    {"playerId": 2, "rank": 3, "basePoints": 6, "points": 12, "jokerApplied": true},
    {"playerId": 5, "rank": 3, "basePoints": 6, "points": 12, "jokerApplied": true},
    {"playerId": 8, "rank": 3, "basePoints": 6, "points": 6, "jokerApplied": false},
    {"playerId": 7, "rank": 7, "basePoints": 4, "points": 4, "jokerApplied": false},
    {"playerId": 3, "rank": 7, "basePoints": 4, "points": 4, "jokerApplied": false}
  ]'::jsonb
),
(
  3, 3, 'Lasertag Action', 3, '2026-04-10', '18:30 Uhr', 'LaserZone Arena',
  'Taktische Gefechte im Laser-Labyrinth bei Sven! Lukas schaltete seinen Joker scharf und sackte mit Rang 2 stolze 14 Punkte (7x2) ein.',
  '["Dunkle Kleidung", "Hallenschuhe", "Handtuch"]'::jsonb,
  'completed', true, '[]'::jsonb,
  '[
    {"playerId": 2, "rank": 1, "basePoints": 8, "points": 8, "jokerApplied": false},
    {"playerId": 1, "rank": 2, "basePoints": 7, "points": 14, "jokerApplied": true},
    {"playerId": 6, "rank": 3, "basePoints": 6, "points": 6, "jokerApplied": false},
    {"playerId": 4, "rank": 4, "basePoints": 5, "points": 5, "jokerApplied": false},
    {"playerId": 3, "rank": 5, "basePoints": 4, "points": 4, "jokerApplied": false},
    {"playerId": 8, "rank": 5, "basePoints": 4, "points": 4, "jokerApplied": false},
    {"playerId": 5, "rank": 7, "basePoints": 0, "points": 0, "jokerApplied": false},
    {"playerId": 7, "rank": 7, "basePoints": 0, "points": 0, "jokerApplied": false}
  ]'::jsonb
),
(
  4, 4, 'Kegelabend & Bier', 8, '2026-05-16', '17:00 Uhr', 'Kegelsportzentrum',
  'Volle Neun bei Aarons Heimspiel! Tomi sicherte sich 8 Punkte als Tagessieger. Gabi zündete ihren Joker und verdoppelte auf 10 Punkte (5x2)!',
  '["Hallensportschuhe", "Durst", "Gute Laune"]'::jsonb,
  'completed', true, '[]'::jsonb,
  '[
    {"playerId": 5, "rank": 1, "basePoints": 8, "points": 8, "jokerApplied": false},
    {"playerId": 4, "rank": 2, "basePoints": 7, "points": 7, "jokerApplied": false},
    {"playerId": 3, "rank": 3, "basePoints": 6, "points": 6, "jokerApplied": false},
    {"playerId": 7, "rank": 4, "basePoints": 5, "points": 10, "jokerApplied": true},
    {"playerId": 8, "rank": 5, "basePoints": 4, "points": 4, "jokerApplied": false},
    {"playerId": 6, "rank": 6, "basePoints": 3, "points": 3, "jokerApplied": false},
    {"playerId": 1, "rank": 7, "basePoints": 2, "points": 2, "jokerApplied": false},
    {"playerId": 2, "rank": 8, "basePoints": 0, "points": 0, "jokerApplied": false}
  ]'::jsonb
),
(
  5, 5, 'Minigames Olympiade', 5, '2026-08-07', '16:00 Uhr', 'Tomis Obstwiese & Park',
  'Geschicklichkeits-Challenges & Garten-Minigames bei Tomi. Oli setzte sich durch und holte sich den Tagessieg mit 8 Punkten! Aaron zündete seinen Joker und verdoppelte auf 4 Punkte (2x2).',
  '["Bequeme Kleidung", "Sneaker", "Sonnenschutz"]'::jsonb,
  'completed', true, '[]'::jsonb,
  '[
    {"playerId": 2, "rank": 1, "basePoints": 8, "points": 8, "jokerApplied": false},
    {"playerId": 1, "rank": 2, "basePoints": 7, "points": 7, "jokerApplied": false},
    {"playerId": 3, "rank": 3, "basePoints": 6, "points": 6, "jokerApplied": false},
    {"playerId": 6, "rank": 4, "basePoints": 5, "points": 5, "jokerApplied": false},
    {"playerId": 4, "rank": 5, "basePoints": 4, "points": 4, "jokerApplied": false},
    {"playerId": 7, "rank": 6, "basePoints": 3, "points": 3, "jokerApplied": false},
    {"playerId": 8, "rank": 7, "basePoints": 2, "points": 4, "jokerApplied": true},
    {"playerId": 5, "rank": 8, "basePoints": 1, "points": 1, "jokerApplied": false}
  ]'::jsonb
),
(
  6, 6, 'Squash & Power-Match', 4, '2026-08-29', '14:00 Uhr', 'Squash & Fitness Center',
  'Rasante Duelle auf dem Squash-Court bei Tobi! Tobi dominierte sein Heim-Event mit 8 Punkten.',
  '["Squashschläger", "Helle Hallensohlen", "Handtuch", "Viel Wasser"]'::jsonb,
  'completed', true, '[]'::jsonb,
  '[
    {"playerId": 4, "rank": 1, "basePoints": 8, "points": 8, "jokerApplied": false},
    {"playerId": 1, "rank": 2, "basePoints": 7, "points": 7, "jokerApplied": false},
    {"playerId": 2, "rank": 3, "basePoints": 6, "points": 6, "jokerApplied": false},
    {"playerId": 5, "rank": 4, "basePoints": 5, "points": 5, "jokerApplied": false},
    {"playerId": 7, "rank": 5, "basePoints": 4, "points": 4, "jokerApplied": false},
    {"playerId": 6, "rank": 6, "basePoints": 3, "points": 3, "jokerApplied": false},
    {"playerId": 3, "rank": 7, "basePoints": 2, "points": 2, "jokerApplied": false},
    {"playerId": 8, "rank": 8, "basePoints": 0, "points": 0, "jokerApplied": false}
  ]'::jsonb
),
(
  7, 7, 'Spieltag 7 (Überraschungs-Event)', 7, '2026-10-09', '18:00 Uhr', 'Wird von Gabi bekannt gegeben',
  'Der vorletzte Spieltag der Saison 2026! Tobi und Sven haben noch ihren Joker im Ärmel – wer greift nach der Krone oder wendet das Wintergrillen ab?',
  '["Gute Laune", "Details folgen"]'::jsonb,
  'upcoming', false, '[]'::jsonb, '[]'::jsonb
),
(
  8, 8, 'Großes Saison-Finale 2026', 6, '2026-10-30', '18:30 Uhr', 'Wird von Tim bekannt gegeben',
  'Das große Saison-Finale 2026 bei Tim! Wer wird neuer Sonnenkönig 👑 und wer muss als Tabellenletzter das Wintergrillen 🥩 für die Gruppe ausrichten?',
  '["Feierlaune", "Details folgen"]'::jsonb,
  'upcoming', false, '[]'::jsonb, '[]'::jsonb
),
(
  9, 9, 'Traditionelles Wintergrillen 2026', 5, '2026-11-21', '17:00 Uhr', 'Wird vom Grillmeister bekannt gegeben',
  'Das traditionelle Wintergrillen der Freunde der Sonne 🥩🔥! Der Tabellenletzte der Saison 2026 muss für die gesamte Truppe grillen und die Getränke stellen. Keine Spieltags-Wertung, keine Joker – einfach ein legendärer Jahresabschluss!',
  '["Riesiger Hunger", "Durst auf Bier & Glühwein", "Winterjacke & Handschuhe"]'::jsonb,
  'upcoming', false, '[]'::jsonb, '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  round = EXCLUDED.round,
  title = EXCLUDED.title,
  organizer_id = EXCLUDED.organizer_id,
  date = EXCLUDED.date,
  time = EXCLUDED.time,
  location = EXCLUDED.location,
  description = EXCLUDED.description,
  packing_list = EXCLUDED.packing_list,
  status = EXCLUDED.status,
  is_frozen = EXCLUDED.is_frozen,
  pending_jokers = EXCLUDED.pending_jokers,
  scores = EXCLUDED.scores;

-- ==============================================================================
-- 7. PUSH NOTIFICATION SUBSCRIPTIONS (Apple Web Push für iOS & Desktop)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT REFERENCES members(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public read push_subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Public insert push_subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Public update push_subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Public delete push_subscriptions" ON push_subscriptions;

-- Allow reading, inserting, updating and deleting subscriptions
CREATE POLICY "Public read push_subscriptions" ON push_subscriptions FOR SELECT USING (true);
CREATE POLICY "Public insert push_subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update push_subscriptions" ON push_subscriptions FOR UPDATE USING (true);
CREATE POLICY "Public delete push_subscriptions" ON push_subscriptions FOR DELETE USING (true);

-- ==============================================================================
-- FERTIG! Dein Supabase Backend ist nun voll einsatzbereit.
-- ==============================================================================

