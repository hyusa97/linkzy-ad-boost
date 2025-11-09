-- 20251110_fix_rpc_rls_bypass.sql
-- ============================================
-- FIX: Replaces resolve_short_code() to explicitly bypass
-- Row Level Security (RLS) on public.links, allowing public
-- lookup of original_url for the redirect process.
-- ============================================

-- 1️⃣ Function: resolve_short_code (RLS Bypass)
-- Fetches the original_url from public.links using the short_code.
CREATE OR REPLACE FUNCTION public.resolve_short_code(p_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner's privilege
SET search_path = public -- Ensures public.links is found
AS $$
DECLARE
  res text;
BEGIN
  -- TEMPORARILY disable RLS for this specific query inside the function
  PERFORM set_config('row_security', 'off', true);

  SELECT original_url INTO res
  FROM public.links
  WHERE short_code = p_code
  LIMIT 1;
  
  -- RLS is automatically reset after the function call
  
  RETURN res;
END;
$$;

-- Allow public (anon/authenticated) execution
GRANT EXECUTE ON FUNCTION public.resolve_short_code(text) TO public;


-- 2️⃣ Function: increment_link_clicks
-- Replaces with the PLPGSQL version for consistency and RLS safety.
CREATE OR REPLACE FUNCTION public.increment_link_clicks(p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- TEMPORARILY disable RLS for this update to ensure it runs for anon users
  PERFORM set_config('row_security', 'off', true); 

  UPDATE public.links
  SET clicks = coalesce(clicks, 0) + 1
  WHERE short_code = p_code;
  
END;
$$;

-- Allow public (anon/authenticated) execution
GRANT EXECUTE ON FUNCTION public.increment_link_clicks(text) TO public;

-- ============================================

