BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'match_events'
      AND column_name = 'type'
  ) THEN
    EXECUTE 'ALTER TABLE match_events ALTER COLUMN type DROP NOT NULL';
  END IF;
END
$$;

COMMIT;
