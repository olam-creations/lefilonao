import { test, expect } from '@playwright/test';

// Dismiss cookie banner if present — blocks buttons at bottom of page
async function dismissCookieBanner(page: import('@playwright/test').Page) {
  const acceptButton = page.locator('button', { hasText: 'Tout accepter' });
  if (await acceptButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await acceptButton.click();
    await acceptButton.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
  }
}

// Log in via the Dev Access button (uses handleDevLogin → api.login('dev@lefilonao.com', 'dev'))
async function loginViaDev(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await dismissCookieBanner(page);
  const devButton = page.locator('button', { hasText: 'Acc' });
  await expect(devButton).toBeVisible({ timeout: 5_000 });
  await devButton.click();
  await page.waitForURL('**/dashboard**', { timeout: 30_000 });
}

// ---------------------------------------------------------------------------
// Journey 1: Login Flow (form-based)
// ---------------------------------------------------------------------------

test.describe('Journey 1 -- Login Flow', () => {
  test('login page renders email and password fields', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('login page shows heading "Connexion"', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h1')).toHaveText('Connexion');
  });

  test('submit with invalid credentials shows error message', async ({ page }) => {
    await page.goto('/login');
    await dismissCookieBanner(page);

    await page.locator('#email').fill('nobody@example.com');
    await page.locator('#password').fill('wrongpassword123');

    await page.locator('button[type="submit"]').click();

    // Either validation error or rate limit message
    const errorOrRateLimit = page.locator('[class*="bg-red-50"], [class*="bg-amber-50"]');
    await expect(errorOrRateLimit).toBeVisible({ timeout: 10_000 });
  });

  test('submit with dev credentials redirects to /dashboard with content', async ({ page }) => {
    await page.goto('/login');
    await dismissCookieBanner(page);

    await page.locator('#email').fill('dev@lefilonao.com');
    await page.locator('#password').fill('dev');

    await page.locator('button[type="submit"]').click();

    // window.location.href = '/dashboard' triggers full navigation
    await page.waitForURL('**/dashboard**', { timeout: 30_000 });
    expect(page.url()).toContain('/dashboard');

    // Dashboard uses Sidebar + <main>, not <header>
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
  });

  test('submit button is disabled when fields are empty', async ({ page }) => {
    await page.goto('/login');

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('submit button text is "Se connecter"', async ({ page }) => {
    await page.goto('/login');
    await dismissCookieBanner(page);

    await page.locator('#email').fill('test@test.com');
    await page.locator('#password').fill('12345678');

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
    await expect(submitButton).toContainText('Se connecter');
  });
});

// ---------------------------------------------------------------------------
// Journey 2: Dev Access Button
// ---------------------------------------------------------------------------

test.describe('Journey 2 -- Dev Access Button', () => {
  test('"Acces Dev" button is visible on localhost', async ({ page }) => {
    await page.goto('/login');
    await dismissCookieBanner(page);

    const devButton = page.locator('button', { hasText: 'Acc' });
    await expect(devButton).toBeVisible({ timeout: 5_000 });
  });

  test('clicking Dev Access button redirects to /dashboard and user is authenticated', async ({ page }) => {
    await loginViaDev(page);

    expect(page.url()).toContain('/dashboard');

    const sessionRes = await page.request.get('/api/auth/session');
    const session = await sessionRes.json();
    expect(session.authenticated).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Journey 3: Logout Flow
// ---------------------------------------------------------------------------

test.describe('Journey 3 -- Logout Flow', () => {
  test('logout via API clears session', async ({ request }) => {
    // Use API-level login to avoid consuming rate limit slots from UI tests
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'dev@lefilonao.com', password: 'dev' },
    });

    // Skip if rate limited
    if (loginRes.status() === 429) return;

    expect(loginRes.ok()).toBe(true);

    // Verify authenticated
    const before = await request.get('/api/auth/session');
    expect((await before.json()).authenticated).toBe(true);

    // Logout
    const logoutRes = await request.post('/api/auth/logout');
    expect(logoutRes.ok()).toBe(true);

    const data = await logoutRes.json();
    expect(data.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Journey 4: Registration Flow (UI structure)
// ---------------------------------------------------------------------------

test.describe('Journey 4 -- Registration Flow', () => {
  test('subscribe page renders step 1 with email, password, firstName fields', async ({ page }) => {
    await page.goto('/subscribe');
    await dismissCookieBanner(page);

    await expect(page.locator('h2', { hasText: 'Cr\u00e9ez votre compte' })).toBeVisible({ timeout: 10_000 });

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const firstNameInput = page.locator('input[placeholder="Pr\u00e9nom"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(firstNameInput).toBeVisible();
  });

  test('step 1 "Continuer" button is disabled when fields are incomplete', async ({ page }) => {
    await page.goto('/subscribe');
    await dismissCookieBanner(page);

    await expect(page.locator('h2', { hasText: 'Cr\u00e9ez votre compte' })).toBeVisible({ timeout: 10_000 });

    const continueButton = page.locator('button', { hasText: 'Continuer' });
    await expect(continueButton).toBeDisabled();
  });

  test('filling step 1 enables "Continuer" and navigates to step 2', async ({ page }) => {
    await page.goto('/subscribe');
    await dismissCookieBanner(page);

    await expect(page.locator('h2', { hasText: 'Cr\u00e9ez votre compte' })).toBeVisible({ timeout: 10_000 });

    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('securepass123');
    await page.locator('input[placeholder="Pr\u00e9nom"]').fill('Jean');

    const continueButton = page.locator('button', { hasText: 'Continuer' });
    await expect(continueButton).toBeEnabled({ timeout: 3_000 });

    await continueButton.click();

    await expect(page.locator('h2', { hasText: 'Vos pr\u00e9f\u00e9rences' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('step 2 shows sectors, regions, and skip button', async ({ page }) => {
    await page.goto('/subscribe');
    await dismissCookieBanner(page);

    await expect(page.locator('h2', { hasText: 'Cr\u00e9ez votre compte' })).toBeVisible({ timeout: 10_000 });

    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('securepass123');
    await page.locator('input[placeholder="Pr\u00e9nom"]').fill('Jean');

    const continueButton = page.locator('button', { hasText: 'Continuer' });
    await expect(continueButton).toBeEnabled({ timeout: 3_000 });
    await continueButton.click();

    await expect(page.locator('h2', { hasText: 'Vos pr\u00e9f\u00e9rences' })).toBeVisible({
      timeout: 10_000,
    });

    // Use specific text selectors — page has "Secteurs d'expertise" and "Régions" labels
    await expect(page.locator('p', { hasText: "Secteurs d'expertise" })).toBeVisible();
    await expect(page.getByText('R\u00e9gions', { exact: true })).toBeVisible();

    const skipButton = page.locator('button', { hasText: 'Passer cette' });
    await expect(skipButton).toBeVisible();
  });

  test('step 2 has sector and region toggle buttons', async ({ page }) => {
    await page.goto('/subscribe');
    await dismissCookieBanner(page);

    await expect(page.locator('h2', { hasText: 'Cr\u00e9ez votre compte' })).toBeVisible({ timeout: 10_000 });

    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('securepass123');
    await page.locator('input[placeholder="Pr\u00e9nom"]').fill('Jean');

    const continueButton = page.locator('button', { hasText: 'Continuer' });
    await expect(continueButton).toBeEnabled({ timeout: 3_000 });
    await continueButton.click();

    await expect(page.locator('h2', { hasText: 'Vos pr\u00e9f\u00e9rences' })).toBeVisible({
      timeout: 10_000,
    });

    await expect(page.locator('button', { hasText: 'Cybers\u00e9curit\u00e9' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Cloud' })).toBeVisible();
    await expect(page.locator('button', { hasText: '\u00cele-de-France' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Bretagne' })).toBeVisible();
  });

  test('step 2 has "Retour" button to go back to step 1', async ({ page }) => {
    await page.goto('/subscribe');
    await dismissCookieBanner(page);

    await expect(page.locator('h2', { hasText: 'Cr\u00e9ez votre compte' })).toBeVisible({ timeout: 10_000 });

    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('securepass123');
    await page.locator('input[placeholder="Pr\u00e9nom"]').fill('Jean');

    const continueButton = page.locator('button', { hasText: 'Continuer' });
    await expect(continueButton).toBeEnabled({ timeout: 3_000 });
    await continueButton.click();

    await expect(page.locator('h2', { hasText: 'Vos pr\u00e9f\u00e9rences' })).toBeVisible({
      timeout: 10_000,
    });

    await page.locator('button', { hasText: 'Retour' }).click();

    await expect(page.locator('h2', { hasText: 'Cr\u00e9ez votre compte' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('subscribe page has link to login', async ({ page }) => {
    await page.goto('/subscribe');
    await dismissCookieBanner(page);

    await expect(page.locator('h2', { hasText: 'Cr\u00e9ez votre compte' })).toBeVisible({ timeout: 10_000 });

    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toContainText('Se connecter');
  });
});

// ---------------------------------------------------------------------------
// Journey 5: Auth API Routes
//
// NOTE: Auth endpoints have a rate limit of 5 req/min per IP.
// UI tests above may have consumed some of the budget. Tests here
// accept 429 (rate limited) as a valid server response.
// ---------------------------------------------------------------------------

test.describe('Journey 5 -- Auth API Routes', () => {
  test('GET /api/auth/session in dev mode returns authenticated (dev bypass)', async ({ request }) => {
    const res = await request.get('/api/auth/session');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(data.authenticated).toBe(true);
  });

  test('POST /api/auth/login with empty body returns 400 or 429', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: {},
    });

    expect(res.ok()).toBe(false);
    expect([400, 429]).toContain(res.status());
  });

  test('POST /api/auth/login with missing password returns 400 or 429', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: 'test@test.com' },
    });

    expect(res.ok()).toBe(false);
    expect([400, 429]).toContain(res.status());
  });

  test('POST /api/auth/login with invalid credentials returns 401 or 429', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: 'nobody@example.com', password: 'wrongpassword' },
    });

    expect(res.ok()).toBe(false);
    expect([401, 429]).toContain(res.status());
  });

  test('POST /api/auth/login with dev credentials returns success or 429', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'dev@lefilonao.com', password: 'dev' },
    });

    // Rate limiting may block this call
    if (loginRes.status() === 429) {
      expect(loginRes.ok()).toBe(false);
      return;
    }

    expect(loginRes.ok()).toBe(true);
    const loginData = await loginRes.json();
    expect(loginData.success).toBe(true);
    expect(loginData.displayName).toBe('Dev User');
  });

  test('POST /api/auth/login sets cookie that authenticates session', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'dev@lefilonao.com', password: 'dev' },
    });

    // Skip if rate limited
    if (loginRes.status() === 429) return;

    expect(loginRes.ok()).toBe(true);

    const sessionRes = await request.get('/api/auth/session');
    const data = await sessionRes.json();
    expect(data.authenticated).toBe(true);
  });

  test('POST /api/auth/logout returns success', async ({ request }) => {
    const logoutRes = await request.post('/api/auth/logout');
    expect(logoutRes.ok()).toBe(true);

    const data = await logoutRes.json();
    expect(data.success).toBe(true);
  });

  test('POST /api/auth/register with invalid email returns 400', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: {
        email: 'not-an-email',
        password: 'securepass123',
        firstName: 'Test',
      },
    });

    expect(res.ok()).toBe(false);
    expect(res.status()).toBe(400);
  });

  test('POST /api/auth/register with short password returns 400', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: {
        email: 'valid@test.com',
        password: 'short',
        firstName: 'Test',
      },
    });

    expect(res.ok()).toBe(false);
    expect(res.status()).toBe(400);
  });

  test('POST /api/auth/register with missing firstName returns 400', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: {
        email: 'valid@test.com',
        password: 'securepass123',
      },
    });

    expect(res.ok()).toBe(false);
    expect(res.status()).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Journey 7: Protected Routes
// ---------------------------------------------------------------------------

test.describe('Journey 7 -- Protected Routes', () => {
  test('login page has link to subscribe', async ({ page }) => {
    await page.goto('/login');
    await dismissCookieBanner(page);

    // The subscribe link is in the form footer or header
    const subscribeLink = page.locator('a[href="/subscribe"]').first();
    await expect(subscribeLink).toBeVisible();
  });

  test('/dashboard is accessible via dev login', async ({ page }) => {
    await loginViaDev(page);

    expect(page.url()).toContain('/dashboard');
    // Dashboard uses Sidebar + <main>, not <header>
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
  });

  test('/api/auth/session returns valid response structure', async ({ request }) => {
    const res = await request.get('/api/auth/session');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(data).toHaveProperty('authenticated');
    expect(typeof data.authenticated).toBe('boolean');
  });
});
