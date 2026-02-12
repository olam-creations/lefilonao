-- Migration 042: Reset discovery status for notices that need re-discovery
-- After upgrading the DCE discovery pipeline with SPA-aware scraping,
-- re-attempt discovery for notices that previously found 0 documents
-- or only found platform junk.

-- Reset notices that are 'done' but have zero documents (discovery found nothing)
UPDATE boamp_notices
SET dce_discovery_status = 'pending'
WHERE dce_discovery_status = 'done'
  AND dce_url IS NOT NULL
  AND dce_url NOT LIKE '%boamp.fr%'
  AND id NOT IN (
    SELECT DISTINCT notice_id FROM dce_documents
  );

-- Reset notices that failed (network errors, timeouts)
UPDATE boamp_notices
SET dce_discovery_status = 'pending'
WHERE dce_discovery_status = 'failed'
  AND dce_url IS NOT NULL
  AND dce_url NOT LIKE '%boamp.fr%';

-- Reset any stuck 'discovering' status (likely from a timed-out previous attempt)
UPDATE boamp_notices
SET dce_discovery_status = 'pending'
WHERE dce_discovery_status = 'discovering';
