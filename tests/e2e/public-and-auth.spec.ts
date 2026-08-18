import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const publicRoutes = ['/', '/about', '/classes', '/pricing', '/contact', '/testimonials', '/terms', '/privacy'];

test.describe('public production surface', () => {
  for (const route of publicRoutes) {
    test(`${route} renders with one primary heading`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'networkidle' });
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
    });

    test(`${route} has no serious accessibility violations`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' });
      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''));
      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    });
  }

  test('unknown route returns branded 404', async ({ page }) => {
    const response = await page.goto('/does-not-exist-e2e');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /couldn.t find that page/i })).toBeVisible();
  });

  test('security, robots, sitemap and dependency health are production-safe', async ({ request }) => {
    const health = await request.get('/health');
    expect(health.status()).toBe(200);
    expect(await health.json()).toMatchObject({ status: 'ok', backend: 'reachable' });
    const home = await request.get('/');
    expect(home.headers()['content-security-policy']).toContain("default-src 'self'");
    expect(home.headers()['x-content-type-options']).toBe('nosniff');
    expect(home.headers()['x-frame-options']).toBe('DENY');
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('/admin');
    expect(robots).toContain('/dashboard');
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).not.toContain('/admin');
    expect(sitemap).not.toContain('/dashboard');
  });

  test('customer-facing pages contain no payment collection controls', async ({ page }) => {
    for (const route of ['/classes', '/pricing']) {
      await page.goto(route, { waitUntil: 'networkidle' });
      await expect(page.locator('input[type="file"], input[name*="card" i], input[name*="payment" i], input[name*="reference" i]')).toHaveCount(0);
      await expect(page.getByText(/upload payment|payment screenshot|card number|cvv/i)).toHaveCount(0);
    }
  });
});

test.describe('authentication and authorization', () => {
  test('invalid login fails safely', async ({ page }) => {
    await page.goto('/signin');
    await page.getByLabel('Email').fill('nobody@example.com');
    await page.locator('#signin-password').fill('WrongPassword1');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Invalid email or password', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/signin/);
  });

  test('external redirect is rejected and admin reaches admin dashboard', async ({ page }) => {
    await page.goto('/signin?redirect=https%3A%2F%2Fevil.example');
    await page.getByLabel('Email').fill('raji.saran2010@gmail.com');
    await page.locator('#signin-password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    expect(new URL(page.url()).hostname).toBe('127.0.0.1');
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
    const mobileAdminNavigation = page.getByRole('button', { name: 'Open admin navigation' });
    const tabRequests = [
      { label: 'Dashboard', paths: ['/api/admin/dashboard'] },
      { label: 'Users', paths: ['/api/users?limit=100'] },
      { label: 'Passes', paths: ['/api/passes/admin/options'] },
      { label: 'Classes', paths: ['/api/classes?limit=100'] },
      { label: 'Instructors', paths: ['/api/instructors'] },
      { label: 'Bookings & Payments', paths: ['/api/payments/manual?limit=100', '/api/enrollments?limit=100'] },
      { label: 'Attendance', paths: ['/api/classes?limit=100'] },
      { label: 'Messages', paths: ['/api/contact?limit=100'] },
      { label: 'Content Editor', paths: ['/api/admin/content/home'] },
      { label: 'Testimonials', paths: ['/api/testimonials'] },
    ];

    for (const tab of tabRequests) {
      if (await mobileAdminNavigation.isVisible()) await mobileAdminNavigation.click();
      const responses = tab.paths.map(path => page.waitForResponse(response => {
        const url = new URL(response.url());
        return `${url.pathname}${url.search}` === path && response.request().method() === 'GET';
      }));
      await page.getByRole('button', { name: tab.label, exact: true }).click();
      for (const response of await Promise.all(responses)) {
        expect(tab.allowedStatuses ?? [200]).toContain(response.status());
      }
      if (tab.label === 'Content Editor') {
        await expect(page.getByRole('heading', { name: 'Content Editor' })).toBeVisible();
        await expect(page.locator('main input[id^="cms-"][id$="ImageUrl" i]')).toHaveCount(0);
        await expect(page.getByText(/image url/i)).toHaveCount(0);
        for (const cmsPage of [
          { label: 'About Us', path: '/api/admin/content/about' },
          { label: 'Pricing', path: '/api/admin/content/pricing' },
          { label: 'Contact & Global', path: '/api/admin/content/contact' },
        ]) {
          const cmsResponse = page.waitForResponse(response => {
            const url = new URL(response.url());
            return url.pathname === cmsPage.path && response.request().method() === 'GET';
          });
          await page.getByRole('button', { name: cmsPage.label, exact: true }).click();
          expect((await cmsResponse).status()).toBe(200);
        }
      }
    }
  });

  test('every student sidebar tab refreshes its API data', async ({ page }) => {
    const email = `qa.dashboard.${Date.now()}.${Math.random().toString(16).slice(2)}@example.com`;
    const registration = await page.request.post('/api/auth/register', { data: {
      name: 'QA Dashboard Student', email, password: 'StrongPassword1', phone: '+1 555 010 1234',
      dob: '1990-01-01', emergencyContactName: 'QA Emergency', emergencyContactPhone: '+1 555 010 9999',
      physicalHealth: 'None', mentalHealth: 'None', digitalMediaWaiver: false, liabilityWaiver: true,
      liabilityWaiverVersion: '2026-08-18', digitalMediaWaiverVersion: '2026-08-18',
      termsVersion: '2026-08-18', privacyVersion: '2026-08-18',
    } });
    expect(registration.status()).toBe(201);
    const student = (await registration.json()).user;

    await page.goto('/dashboard');
    await expect(page.getByText('Student account')).toBeVisible();
    const mobileNavigation = page.getByRole('button', { name: 'Open dashboard navigation' });
    const tabRequests = [
      { label: 'Dashboard', paths: ['/api/enrollments/my?limit=50', '/api/attendance/my/stats', '/api/attendance/my', '/api/passes/me', '/api/users/me'] },
      { label: 'My Classes', paths: ['/api/enrollments/my?limit=50'] },
      { label: 'History', paths: ['/api/enrollments/my?limit=50'] },
      { label: 'Attendance', paths: ['/api/attendance/my/stats', '/api/attendance/my'] },
      { label: 'Payments', paths: ['/api/users/me'] },
      { label: 'My Passes', paths: ['/api/passes/me'] },
      { label: 'Write Review', paths: ['/api/users/me'] },
      { label: 'Profile', paths: ['/api/users/me'] },
    ];

    for (const tab of tabRequests) {
      if (await mobileNavigation.isVisible()) await mobileNavigation.click();
      const responses = tab.paths.map(path => page.waitForResponse(response => {
        const url = new URL(response.url());
        return `${url.pathname}${url.search}` === path && response.request().method() === 'GET';
      }));
      await page.getByRole('button', { name: tab.label, exact: true }).click();
      for (const response of await Promise.all(responses)) expect(response.ok()).toBeTruthy();
    }

    let csrf = (await page.context().cookies()).find(cookie => cookie.name === 'shakthi_csrf')?.value;
    expect(csrf).toBeTruthy();
    expect((await page.request.post('/api/auth/logout', { headers: { 'X-CSRF-Token': csrf! } })).status()).toBe(200);
    expect((await page.request.post('/api/auth/login', { data: { email: 'raji.saran2010@gmail.com', password: 'admin123' } })).status()).toBe(200);
    csrf = (await page.context().cookies()).find(cookie => cookie.name === 'shakthi_csrf')?.value;
    expect((await page.request.delete(`/api/users/${student.id}`, { headers: { 'X-CSRF-Token': csrf! } })).status()).toBe(200);
  });

  test('anonymous user cannot access private dashboards', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/signin/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/signin/);
  });
});
