DO $$
DECLARE
  table_name TEXT;
  sequence_name TEXT;
  maximum_id BIGINT;
  table_has_rows BOOLEAN;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['leagues', 'teams', 'matches', 'standings']
  LOOP
    sequence_name := pg_get_serial_sequence(
      format('%I.%I', 'public', table_name),
      'id'
    );

    IF sequence_name IS NOT NULL THEN
      EXECUTE format(
        'SELECT COALESCE(MAX(id), 1), COUNT(*) > 0 FROM %I.%I',
        'public',
        table_name
      )
      INTO maximum_id, table_has_rows;

      PERFORM setval(sequence_name::regclass, maximum_id, table_has_rows);
    END IF;
  END LOOP;
END
$$;
