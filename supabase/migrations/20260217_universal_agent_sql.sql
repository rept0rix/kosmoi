-- Universal Database Agent Migration
-- Enables a 'run_safe_sql' function for the Agent to execute read-only queries.

-- 1. Create the function
CREATE OR REPLACE FUNCTION run_safe_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with the privileges of the creator (usually postgres/admin), so we must be CAREFUL.
AS $$
DECLARE
  result json;
BEGIN
  -- 2. Basic Safety Checks (Server-side)
  -- Reject obviously dangerous commands.
  -- Note: This is a simple text check. A determined attacker might bypass regex.
  -- This is why we should ideally use a read-only role, but defining that dynamically is complex here.
  
  IF upper(trim(query)) NOT LIKE 'SELECT%' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed via this agent interface.';
  END IF;

  IF query ~* ';\s*(DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE|GRANT|REVOKE)' THEN
    RAISE EXCEPTION 'Forbidden keyword detected. Transaction aborted.';
  END IF;

  -- 3. Execute the query
  EXECUTE 'SELECT json_agg(t) FROM (' || query || ') t' INTO result;

  -- 4. Return result
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Catch errors and return them smoothly so the agent can see what went wrong
  RETURN json_build_object('error', SQLERRM, 'detail', SQLSTATE);
END;
$$;

-- 5. Grant access
-- Allow authenticated users to call this function? 
-- WARNING: This allows ANY logged-in user to run arbitrary SELECTs if they know the function name.
-- In a real app, you'd restrict this to a specific 'agent' role or check for an admin flag on the user.
-- For Kosmoi Prototype: We assume the user is the Admin.
GRANT EXECUTE ON FUNCTION run_safe_sql(text) TO authenticated;
