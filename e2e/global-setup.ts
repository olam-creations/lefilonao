import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Global setup for E2E tests.
 *
 * The auth login endpoint has a rate limit of 5 req/min (in-memory in dev).
 * Since the dev server persists between test runs, the rate limiter retains
 * entries from previous runs. This setup uses a timestamp file to detect
 * consecutive runs and waits for the rate limit window to expire — WITHOUT
 * consuming a rate limit slot by probing the endpoint.
 */
export default async function globalSetup() {
  const markerFile = join(tmpdir(), 'lefilonao-e2e-last-run');
  const windowMs = 65_000; // 60s rate limit window + 5s buffer

  const lastRun = existsSync(markerFile)
    ? parseInt(readFileSync(markerFile, 'utf8'), 10) || 0
    : 0;

  const elapsed = Date.now() - lastRun;

  if (lastRun > 0 && elapsed < windowMs) {
    const waitMs = windowMs - elapsed;
    const waitSec = Math.ceil(waitMs / 1000);
    console.log(`\n  Previous run was ${Math.ceil(elapsed / 1000)}s ago, waiting ${waitSec}s for rate limit window...\n`);
    await new Promise((r) => setTimeout(r, waitMs));
  }

  // Record this run's start time
  writeFileSync(markerFile, String(Date.now()));
}
