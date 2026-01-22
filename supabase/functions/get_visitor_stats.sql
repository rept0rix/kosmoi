CREATE OR REPLACE FUNCTION get_visitor_stats(provider_id INT)
RETURNS TABLE (date DATE, visitors INT) AS $$
BEGIN
  RETURN QUERY SELECT (
    SELECT date FROM generate_series(current_date - interval '6 days', current_date, interval '1 day') AS date
  ), (
    SELECT trunc(random() * 100)::int AS visitors
  );
END;
$$ LANGUAGE plpgsql;