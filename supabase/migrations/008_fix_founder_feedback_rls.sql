-- Fix: founder_feedback has RLS enabled but no policies, blocking all access.
-- Add service role full access policy.

CREATE POLICY "Service role full access"
  ON founder_feedback
  FOR ALL
  USING (true)
  WITH CHECK (true);
