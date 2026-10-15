BEGIN;

CREATE TABLE public.players (
    player_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    discord_user_id TEXT NOT NULL UNIQUE,
    in_game_name TEXT NOT NULL,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ign_updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT players_ign_not_empty
        CHECK (length(btrim(in_game_name)) > 0),

    CONSTRAINT players_ign_trimmed
        CHECK (in_game_name = btrim(in_game_name))
);

CREATE UNIQUE INDEX players_ign_case_insensitive_unique
    ON public.players (lower(in_game_name));

GRANT SELECT, INSERT, UPDATE
ON TABLE public.players
TO rml_api;

COMMIT;