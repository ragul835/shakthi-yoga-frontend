import { expect, request as playwrightRequest, test } from '@playwright/test';

async function csrfToken(api: Awaited<ReturnType<typeof playwrightRequest.newContext>>) {
  const state = await api.storageState();
  return state.cookies.find((cookie) => cookie.name === 'shakthi_csrf')?.value;
}

test('cookie login, profile, CSRF rejection, logout and revocation', async () => {
  const api = await playwrightRequest.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const login = await api.post('/api/auth/login', { data: { email: 'raji.saran2010@gmail.com', password: 'admin123' } });
  expect(login.status()).toBe(200);
  const body = await login.json();
  expect(body.user.role).toBe('ADMIN');
  expect(body.accessToken).toBeUndefined();
  expect(body.refreshToken).toBeUndefined();
  const cookies = (await api.storageState()).cookies;
  expect(cookies.find((cookie) => cookie.name === 'shakthi_access')?.httpOnly).toBe(true);
  expect(cookies.find((cookie) => cookie.name === 'shakthi_refresh')?.httpOnly).toBe(true);
  expect(await csrfToken(api)).toBeTruthy();
  expect((await api.get('/api/auth/profile')).status()).toBe(200);
  expect((await api.post('/api/auth/logout')).status()).toBe(403);
  const logout = await api.post('/api/auth/logout', { headers: { 'X-CSRF-Token': (await csrfToken(api))! } });
  expect(logout.status()).toBe(200);
  expect((await api.get('/api/auth/profile')).status()).toBe(401);
  await api.dispose();
});

test('validation, authentication and role boundaries reject abuse', async ({ request }) => {
  expect((await request.get('/api/admin/dashboard')).status()).toBe(401);
  expect((await request.post('/api/auth/register', { data: { email: 'bad', unexpected: true } })).status()).toBe(400);
  expect((await request.post('/api/payments/manual', { data: { purchaseType: 'PASS', amountUsd: 0 } })).status()).toBe(401);
});

test('student class and pass requests require idempotent admin verification', async () => {
  const api = await playwrightRequest.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const email = `qa.student.${Date.now()}.${Math.random().toString(16).slice(2)}@example.com`;
  const registration = await api.post('/api/auth/register', { data: {
    name: 'QA Student', email, password: 'StrongPassword1', phone: '+1 555 010 1234',
    dob: '1990-01-01', emergencyContactName: 'QA Emergency', emergencyContactPhone: '+1 555 010 9999',
    physicalHealth: 'None', mentalHealth: 'None', digitalMediaWaiver: false, liabilityWaiver: true,
    liabilityWaiverVersion: '2026-08-18', digitalMediaWaiverVersion: '2026-08-18',
    termsVersion: '2026-08-18', privacyVersion: '2026-08-18',
  } });
  expect(registration.status()).toBe(201);
  const student = (await registration.json()).user;
  const studentCsrf = (await csrfToken(api))!;
  expect((await api.get('/api/admin/dashboard')).status()).toBe(403);

  const classesResponse = await api.get('/api/classes/public?limit=100');
  expect(classesResponse.status()).toBe(200);
  const classesBody = await classesResponse.json();
  const classes = Array.isArray(classesBody) ? classesBody : classesBody.data;
  const yogaClass = classes.find((item: { id: string; status: string; currentEnrollment: number; maxCapacity: number }) =>
    item.status !== 'INACTIVE' && item.currentEnrollment < item.maxCapacity,
  );
  expect(yogaClass).toBeTruthy();

  const classRequest = await api.post('/api/payments/manual', {
    headers: { 'X-CSRF-Token': studentCsrf }, data: { purchaseType: 'CLASS', classId: yogaClass.id },
  });
  expect(classRequest.status()).toBe(201);
  const classRequestBody = await classRequest.json();
  expect(classRequestBody.status).toBe('PENDING');
  expect((await api.post('/api/payments/manual', {
    headers: { 'X-CSRF-Token': studentCsrf }, data: { purchaseType: 'CLASS', classId: yogaClass.id },
  })).status()).toBe(409);

  const passOptions = await (await api.get('/api/passes/options')).json();
  expect(passOptions.length).toBeGreaterThan(0);
  const passRequest = await api.post('/api/payments/manual', {
    headers: { 'X-CSRF-Token': studentCsrf }, data: { purchaseType: 'PASS', passOptionId: passOptions[0].id },
  });
  expect(passRequest.status()).toBe(201);
  const passRequestBody = await passRequest.json();

  const admin = await playwrightRequest.newContext({ baseURL: 'http://127.0.0.1:3000' });
  expect((await admin.post('/api/auth/login', { data: { email: 'raji.saran2010@gmail.com', password: 'admin123' } })).status()).toBe(200);
  const adminCsrf = (await csrfToken(admin))!;
  for (const requestId of [classRequestBody.id, passRequestBody.id]) {
    const approve = await admin.patch(`/api/payments/manual/${requestId}`, {
      headers: { 'X-CSRF-Token': adminCsrf }, data: { status: 'SUCCEEDED', adminNote: 'QA approval' },
    });
    expect(approve.status()).toBe(200);
    expect((await admin.patch(`/api/payments/manual/${requestId}`, {
      headers: { 'X-CSRF-Token': adminCsrf }, data: { status: 'SUCCEEDED', adminNote: 'QA repeated approval' },
    })).status()).toBe(200);
    expect((await admin.patch(`/api/payments/manual/${requestId}`, {
      headers: { 'X-CSRF-Token': adminCsrf }, data: { status: 'FAILED' },
    })).status()).toBe(400);
    const receipt = await api.get(`/api/payments/${requestId}/receipt`);
    expect(receipt.status()).toBe(200);
    expect(receipt.headers()['content-type']).toContain('application/pdf');
  }
  const myPasses = await api.get('/api/passes/me');
  expect(myPasses.status()).toBe(200);
  expect((await myPasses.json()).length).toBeGreaterThan(0);

  expect((await admin.delete(`/api/users/${student.id}`, { headers: { 'X-CSRF-Token': adminCsrf } })).status()).toBe(200);
  await api.dispose();
  await admin.dispose();
});
