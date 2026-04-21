import { chromium } from 'playwright';

const BASE_URL = process.env.AQUA_LIVE_BASE_URL ?? 'https://aqua.v3rii.com';
const API_URL = process.env.AQUA_LIVE_API_URL ?? 'https://aquaapi.v3rii.com';
const EMAIL = process.env.AQUA_AUDIT_EMAIL ?? 'admin@v3rii.com';
const PASSWORD = process.env.AQUA_AUDIT_PASSWORD ?? 'Veriipass123!';
const BRANCH_CODE = process.env.AQUA_AUDIT_BRANCH_CODE ?? '001';

const ROUTES = [
  '/',
  '/user-management',
  '/users/mail-settings',
  '/stocks',
  '/stocks/1',
  '/access-control/permission-definitions',
  '/access-control/permission-groups',
  '/access-control/user-group-assignments',
  '/hangfire-monitoring',
  '/profile',
  '/aqua/dashboard',
  '/aqua/definitions/projects',
  '/aqua/definitions/cages',
  '/aqua/definitions/project-cage-assignments',
  '/aqua/definitions/weather-severities',
  '/aqua/definitions/weather-types',
  '/aqua/definitions/net-operation-types',
  '/aqua/definitions/settings',
  '/aqua/operations/quick-setup',
  '/aqua/operations/quick-daily-entry',
  '/aqua/operations/opening-import',
  '/aqua/operations/project-merges',
  '/aqua/operations/goods-receipts',
  '/aqua/operations/feedings',
  '/aqua/operations/mortalities',
  '/aqua/operations/transfers',
  '/aqua/operations/warehouse-transfers',
  '/aqua/operations/cage-warehouse-transfers',
  '/aqua/operations/warehouse-cage-transfers',
  '/aqua/operations/shipments',
  '/aqua/operations/weighings',
  '/aqua/operations/stock-converts',
  '/aqua/operations/fish-batches',
  '/aqua/operations/daily-weathers',
  '/aqua/operations/net-operations',
  '/aqua/reports/batch-movements',
  '/aqua/reports/cage-balances',
  '/aqua/reports/project-detail',
  '/aqua/reports/raw-kpi',
  '/aqua/reports/business-kpi',
  '/aqua/reports/devir-fcr',
];

async function login() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      rememberMe: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (!payload?.success || !payload?.data?.token) {
    throw new Error(`Login failed: ${JSON.stringify(payload)}`);
  }

  return payload.data;
}

async function installSession(page, auth) {
  await page.addInitScript(({ token, refreshToken, branchCode, email }) => {
    window.localStorage.setItem('access_token', token);
    window.localStorage.setItem('refresh_token', refreshToken);
    window.localStorage.setItem('i18nextLng', 'tr');
    window.localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          user: {
            id: 1,
            email,
            name: 'Admin User',
            role: 'Admin',
            roles: ['Admin'],
          },
          branch: {
            id: branchCode,
            name: 'Merkez',
            code: branchCode,
          },
        },
        version: 0,
      }),
    );
  }, {
    token: auth.token,
    refreshToken: auth.refreshToken,
    branchCode: BRANCH_CODE,
    email: EMAIL,
  });
}

async function waitForRouteReady(page) {
  await page.locator('body').waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForSelector('#root', { timeout: 15000 });
  await page.waitForFunction(() => {
    const root = document.querySelector('#root');
    return Boolean(root && root.childElementCount > 0);
  }, undefined, { timeout: 15000 });
  await page.waitForSelector('main', { timeout: 15000 });
  await page.waitForTimeout(500);
}

async function auditRoute(browser, auth, routePath) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  await installSession(page, auth);

  let requestCount = 0;
  let failedCount = 0;
  const pageErrors = [];
  const consoleErrors = [];

  page.on('requestfinished', (request) => {
    const url = request.url();
    if (url.startsWith(BASE_URL) || url.startsWith(API_URL)) {
      requestCount += 1;
    }
  });
  page.on('requestfailed', () => {
    failedCount += 1;
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.stack || error.message);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  const start = Date.now();
  try {
    await page.goto(`${BASE_URL}${routePath}`, { waitUntil: 'domcontentloaded' });
    await waitForRouteReady(page);

    const nav = await page.evaluate(() => {
      const entry = performance.getEntriesByType('navigation')[0];
      if (!entry) return null;
      return {
        domContentLoadedMs: Math.round(entry.domContentLoadedEventEnd),
        loadMs: Math.round(entry.loadEventEnd),
        transferSize: Math.round(entry.transferSize || 0),
      };
    });

    return {
      route: routePath,
      readyMs: Date.now() - start,
      domContentLoadedMs: nav?.domContentLoadedMs ?? null,
      loadMs: nav?.loadMs ?? null,
      transferSize: nav?.transferSize ?? null,
      requestCount,
      failedCount,
      ok: pageErrors.length === 0,
      pageErrors,
      consoleErrors,
    };
  } catch (error) {
    return {
      route: routePath,
      readyMs: Date.now() - start,
      domContentLoadedMs: null,
      loadMs: null,
      transferSize: null,
      requestCount,
      failedCount,
      ok: false,
      pageErrors,
      consoleErrors,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await context.close();
  }
}

async function main() {
  const auth = await login();
  const routeFilter = process.env.AQUA_AUDIT_ROUTE ?? '';
  const routes = routeFilter ? ROUTES.filter((route) => route === routeFilter) : ROUTES;

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const results = [];

  try {
    for (const routePath of routes) {
      const result = await auditRoute(browser, auth, routePath);
      results.push(result);
      console.log(
        `${String(result.readyMs).padStart(5, ' ')} ms | ${String(result.requestCount).padStart(3, ' ')} req | ${result.ok ? 'OK ' : 'ERR'} | ${routePath}`,
      );
      if (!result.ok) {
        if (result.error) console.log(`    error=${result.error}`);
        if (result.pageErrors?.length) console.log(`    pageErrors=${result.pageErrors.join(' | ')}`);
        if (result.consoleErrors?.length) console.log(`    consoleErrors=${result.consoleErrors.join(' | ')}`);
      }
    }
  } finally {
    await browser.close();
  }

  const slow = results.filter((item) => item.readyMs > 3000);
  const sorted = [...results].sort((a, b) => b.readyMs - a.readyMs);

  console.log('\nOver 3s:');
  for (const item of slow) {
    console.log(`- ${item.route}: ${item.readyMs} ms`);
  }

  console.log('\nJSON:');
  console.log(JSON.stringify({
    totalRoutes: results.length,
    slowerThan3s: slow.length,
    slowRoutes: slow.map((item) => ({
      route: item.route,
      readyMs: item.readyMs,
      requestCount: item.requestCount,
      ok: item.ok,
    })),
    top10: sorted.slice(0, 10).map((item) => ({
      route: item.route,
      readyMs: item.readyMs,
      requestCount: item.requestCount,
      domContentLoadedMs: item.domContentLoadedMs,
      loadMs: item.loadMs,
      ok: item.ok,
    })),
  }, null, 2));
}

await main();
