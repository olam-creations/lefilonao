-- Migration 041: Clean up platform junk documents from dce_documents
-- These are help pages, tutorials, and generic platform assets that were
-- scraped alongside real DCE documents before the isPlatformJunk filter was added.

DELETE FROM dce_documents
WHERE filename ~* '(depot[\s_-]*pli|guide[\s_-]*(depot|utilisation|fournisseur|acheteur|plateforme|utilisateur)|aide[\s_-]*(depot|reponse|soumission)|tutori[ae]l|mode[\s_-]*emploi|faq[\s_-]*|cgu[\s_-]*(plateforme|site|portail)|mentions[\s_-]*legales|certificat[\s_-]*(eidas|electronique|signature)|aws[\s_-]*(solution|achat|france)|aw[\s_-]*solutions|marches[\s_-]*publics[\s_-]*info|achatpublic[\s_-]*(com|fr)|maximilien[\s_-]*|e[\s_-]*attestation|klekoon|dematerialisation|inscription[\s_-]*fournisseur)';

-- Reset discovery status for notices that now have zero documents after cleanup
UPDATE boamp_notices
SET dce_discovery_status = 'pending'
WHERE dce_discovery_status = 'done'
  AND id NOT IN (
    SELECT DISTINCT notice_id FROM dce_documents
  )
  AND dce_url IS NOT NULL
  AND dce_url NOT LIKE '%boamp.fr%';
