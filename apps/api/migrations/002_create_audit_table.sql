BEGIN;

CREATE TABLE public.audit_logs (
    audit_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    action TEXT NOT NULL,
    actor_discord_user_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    changes JSONB NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT audit_logs_action_not_empty
        CHECK (length(btrim(action)) > 0),

    CONSTRAINT audit_logs_reason_not_empty
        CHECK (length(btrim(reason)) > 0),

    CONSTRAINT audit_logs_changes_is_object
        CHECK (jsonb_typeof(changes) = 'object')
);

CREATE INDEX audit_logs_target_history_idx
    ON public.audit_logs (target_type, target_id, created_at);

GRANT SELECT, INSERT
ON TABLE public.audit_logs
TO rml_api;

COMMIT;