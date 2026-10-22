BEGIN;

CREATE TABLE public.team_statuses(
	status_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	status_name TEXT UNIQUE NOT NULL
);

INSERT INTO public.team_statuses(status_name)
VALUES ('ACTIVE'), ('DISBANDED');

CREATE TABLE public.teams(
	team_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	team_acronym VARCHAR(5) NOT NULL DEFAULT 'RML',
	team_name VARCHAR(64) NOT NULL,
	team_logo_url TEXT,
	team_primary_color VARCHAR(7) NOT NULL DEFAULT '#FFFFFF',
	team_secondary_color VARCHAR(7),
	team_status_id INTEGER NOT NULL REFERENCES public.team_statuses(status_id),
	team_discord_role_id TEXT,
	team_thread_id TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

	CONSTRAINT team_name_not_empty
		CHECK (length(btrim(team_name)) > 0),

	CONSTRAINT team_name_trimmed
		CHECK (team_name = btrim(team_name)),

	CONSTRAINT team_acronym_not_empty
		CHECK (length(btrim(team_acronym)) > 0),

	CONSTRAINT team_acronym_trimmed
		CHECK (team_acronym = btrim(team_acronym)),

	CONSTRAINT team_primary_color_valid
    CHECK (
        team_primary_color ~ '^#[0-9A-Fa-f]{6}$'
        AND team_primary_color <> '#000000'
    ),

	CONSTRAINT team_secondary_color_valid
		CHECK (
			team_secondary_color ~ '^#[0-9A-Fa-f]{6}$'
			AND team_secondary_color <> '#000000'
		)
);

CREATE UNIQUE INDEX team_name_case_insensitive_unique
	ON public.teams(lower(team_name));

CREATE TABLE public.managing_types(
	type_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	type_name TEXT NOT NULL UNIQUE
);

INSERT INTO public.managing_types (type_name)
VALUES ('MANAGER'), ('ASSISTANT MANAGER');

CREATE TABLE public.team_management (
	manage_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	player_managing_id INTEGER NOT NULL REFERENCES public.players(player_id),
	team_managed_id INTEGER NOT NULL REFERENCES public.teams(team_id),
	managing_type_id INTEGER NOT NULL REFERENCES public.managing_types(type_id),
	started_managing_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	stopped_managing_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX no_duplicate_managing_times
ON public.team_management (player_managing_id, team_managed_id)
WHERE stopped_managing_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.teams
TO rml_api;

GRANT SELECT
ON TABLE public.team_statuses
TO rml_api;

GRANT SELECT
ON TABLE public.managing_types
TO rml_api;

GRANT SELECT, INSERT, UPDATE
ON TABLE public.team_management
TO rml_api;

COMMIT;