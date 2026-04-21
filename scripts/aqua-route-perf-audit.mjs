import { chromium } from 'playwright';

function createJwt() {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'aqua.perf',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'perf@v3rii.com',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '1',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Admin',
    firstName: 'Aqua',
    lastName: 'Perf',
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    iss: 'perf',
    aud: 'perf',
  })).toString('base64url');

  return `${header}.${payload}.signature`;
}

function success(data) {
  return {
    success: true,
    message: '',
    exceptionMessage: '',
    data,
    errors: [],
    timestamp: new Date().toISOString(),
    statusCode: 200,
    className: 'ApiResponse',
  };
}

function paged(items) {
  return success({
    items,
    totalCount: items.length,
    pageNumber: 1,
    pageSize: Math.max(items.length, 1),
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  });
}

const mockProject = {
  id: 1,
  projectCode: 'PRJ-001',
  projectName: 'Perf Projesi',
  startDate: '2026-01-01',
  endDate: null,
  status: 1,
};

const mockCage = {
  id: 101,
  cageCode: 'CAGE-01',
  cageName: 'Kafes 01',
  capacityCount: 10000,
  capacityGram: 1000000,
};

const mockProjectCage = {
  id: 11,
  projectId: 1,
  cageId: 101,
  cageCode: 'CAGE-01',
  cageName: 'Kafes 01',
  assignedDate: '2026-01-01',
  releasedDate: null,
};

const mockFishBatch = {
  id: 201,
  projectId: 1,
  batchCode: 'BATCH-001',
  fishStockId: 301,
  currentAverageGram: 420,
};

const mockStock = {
  id: 301,
  erpStockCode: 'STK-001',
  stockName: 'Perf Stock',
};

const mockWarehouse = {
  id: 1,
  erpWarehouseCode: 100,
  warehouseName: 'Ana Depo',
};

const mockWeatherSeverity = { id: 1, code: 'MID', name: 'Orta', score: 50, weatherTypeId: null };
const mockWeatherType = { id: 1, code: 'WIND', name: 'Rüzgarlı' };
const mockNetOperationType = { id: 1, code: 'NET-CLEAN', name: 'Ağ Temizliği' };

const mockDashboardSummary = [
  {
    projectId: 1,
    projectCode: 'PRJ-001',
    projectName: 'Perf Projesi',
    totalFishCount: 1000,
    totalBiomassGram: 420000,
    totalDeadCount: 10,
    totalDeadBiomassGram: 4200,
    totalShipmentCount: 100,
    totalShipmentBiomassGram: 42000,
    totalFeedGram: 150000,
    currentAverageGram: 420,
    cageCount: 1,
    fcr: 1.4,
    cages: [
      {
        projectCageId: 11,
        cageLabel: 'CAGE-01',
        measurementAverageGram: 420,
        initialFishCount: 1100,
        initialBiomassGram: 220000,
        currentFishCount: 1000,
        totalShipmentCount: 100,
        totalShipmentBiomassGram: 42000,
        totalDeadCount: 10,
        totalDeadBiomassGram: 4200,
        totalFeedGram: 150000,
        currentBiomassGram: 420000,
        fcr: 1.4,
      },
    ],
  },
];

const mockDashboardDetail = {
  projectId: 1,
  projectCode: 'PRJ-001',
  projectName: 'Perf Projesi',
  cages: [
    {
      projectCageId: 11,
      cageLabel: 'CAGE-01',
      initialFishCount: 1100,
      initialBiomassGram: 220000,
      currentFishCount: 1000,
      currentBiomassGram: 420000,
      currentAverageGram: 420,
      totalDeadCount: 10,
      totalFeedGram: 150000,
      dailyRows: [
        {
          date: '2026-04-21',
          weather: 'Rüzgarlı',
          fed: true,
          feedGram: 25000,
          deadCount: 2,
          deadBiomassGram: 800,
          countDelta: -2,
          biomassDelta: 24100,
          feedStockCount: 1,
          feedDetails: ['STK-001'],
          netOperationCount: 0,
          netOperationDetails: [],
          transferCount: 0,
          transferDetails: [],
          shipmentCount: 0,
          shipmentFishCount: 0,
          shipmentBiomassGram: 0,
          shipmentDetails: [],
          stockConvertCount: 0,
          stockConvertDetails: [],
        },
      ],
    },
  ],
};

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

async function installSession(page) {
  const token = createJwt();
  await page.addInitScript((value) => {
    window.localStorage.setItem('access_token', value);
    window.localStorage.setItem('i18nextLng', 'tr');
    window.localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        accessToken: value,
        refreshToken: 'perf-refresh',
        refreshTokenExpiresAt: '2099-01-01T00:00:00Z',
        rememberMe: true,
        authReady: true,
        user: {
          id: 1,
          email: 'perf@v3rii.com',
          firstName: 'Aqua',
          lastName: 'Perf',
          roleTitle: 'Admin',
          branch: { code: '001', branchCode: '001', branchName: 'Merkez' },
        },
      },
      version: 0,
    }));
  }, token);
}

async function installMocks(page) {
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname } = url;

    if (pathname.includes('gstatic') || pathname.includes('google')) {
      return route.fulfill({ status: 204, body: '' });
    }

    if (pathname.endsWith('/api/auth/me/permissions')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(success({
        userId: 1,
        roleTitle: 'Admin',
        isSystemAdmin: true,
        permissionGroups: ['System Admin'],
        permissionCodes: ['*'],
      })) });
    }

    if (pathname.endsWith('/api/auth/refresh-token')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(success({
        accessToken: createJwt(),
        refreshToken: 'perf-refresh',
        refreshTokenExpiresAt: '2099-01-01T00:00:00Z',
      })) });
    }

    if (pathname.endsWith('/api/UserDetail/user/1')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(success({
        id: 1,
        email: 'perf@v3rii.com',
        firstName: 'Aqua',
        lastName: 'Perf',
      })) });
    }

    if (pathname.endsWith('/api/aqua/dashboard-project/summary')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(success(mockDashboardSummary)) });
    }

    if (pathname.endsWith('/api/aqua/dashboard-project/detail/1')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(success(mockDashboardDetail)) });
    }

    if (pathname.endsWith('/api/aqua/AquaSettings')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(success({
        requireFullTransfer: true,
        partialTransferOccupiedCageMode: 1,
        allowProjectMerge: true,
        feedCostFallbackStrategy: 0,
      })) });
    }

    if (pathname.endsWith('/api/aqua/Project')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paged([mockProject])) });
    if (pathname.endsWith('/api/aqua/ProjectCage')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paged([mockProjectCage])) });
    if (pathname.endsWith('/api/aqua/Cage')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paged([mockCage])) });
    if (pathname.endsWith('/api/aqua/FishBatch')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paged([mockFishBatch])) });
    if (pathname.endsWith('/api/aqua/WeatherSeverity')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paged([mockWeatherSeverity])) });
    if (pathname.endsWith('/api/aqua/WeatherType')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paged([mockWeatherType])) });
    if (pathname.endsWith('/api/aqua/NetOperationType')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paged([mockNetOperationType])) });
    if (pathname.endsWith('/api/Warehouse') || pathname.endsWith('/api/aqua/Warehouse')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paged([mockWarehouse])) });
    if (pathname.endsWith('/api/Stock')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paged([mockStock])) });

    if (pathname.startsWith('/api/')) {
      if (request.method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paged([])) });
      }

      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(success({ id: 1 })) });
    }

    return route.continue();
  });
}

async function auditRoute(browser, baseUrl, routePath) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  await installSession(page);
  await installMocks(page);

  let requestCount = 0;
  let failedCount = 0;
  const pageErrors = [];
  const consoleErrors = [];
  page.on('requestfinished', (request) => {
    const url = request.url();
    if (url.startsWith(baseUrl) || url.includes('/api/')) requestCount += 1;
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
    await page.goto(`${baseUrl}${routePath}`, { waitUntil: 'domcontentloaded' });
    await page.locator('body').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForFunction(() => {
      const root = document.querySelector('#root');
      return Boolean(root && root.childElementCount > 0);
    }, undefined, { timeout: 15000 });
    await page.waitForTimeout(350);
    const durationMs = Date.now() - start;
    const title = await page.title();
    const hasMain = (await page.locator('main').count()) > 0;
    const hasError = await page.locator('text=Unexpected Application Error').count();
    const hasRootContent = await page.evaluate(() => {
      const root = document.querySelector('#root');
      return Boolean(root && root.childElementCount > 0);
    });
    const urlAfter = page.url();
    const bodySnippet = (await page.locator('body').innerText()).slice(0, 240).replace(/\s+/g, ' ');

    return {
      route: routePath,
      durationMs,
      requestCount,
      failedCount,
      ok: hasError === 0 && (hasMain || hasRootContent),
      title,
      urlAfter,
      bodySnippet,
      pageErrors,
      consoleErrors,
      error: hasError > 0 ? 'route-error' : hasMain || hasRootContent ? null : 'root-missing',
    };
  } catch (error) {
    return {
      route: routePath,
      durationMs: Date.now() - start,
      requestCount,
      failedCount,
      ok: false,
      title: '',
      urlAfter: page.url(),
      bodySnippet: '',
      pageErrors,
      consoleErrors,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await context.close();
  }
}

async function main() {
  const baseUrl = process.env.AQUA_AUDIT_BASE_URL ?? 'http://127.0.0.1:4173';
  const routeFilter = process.env.AQUA_AUDIT_ROUTE ?? '';
  const routes = routeFilter ? ROUTES.filter((route) => route === routeFilter) : ROUTES;
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const results = [];

  try {
    for (const routePath of routes) {
      const result = await auditRoute(browser, baseUrl, routePath);
      results.push(result);
      console.log(`${result.durationMs.toString().padStart(5, ' ')} ms | ${String(result.requestCount).padStart(3, ' ')} req | ${result.ok ? 'OK ' : 'ERR'} | ${result.route}${result.error ? ` | ${result.error}` : ''}`);
      if (!result.ok) {
        console.log(`    url=${result.urlAfter}`);
        if (result.bodySnippet) console.log(`    body=${result.bodySnippet}`);
        if (result.pageErrors?.length) console.log(`    pageErrors=${result.pageErrors.join(' | ')}`);
        if (result.consoleErrors?.length) console.log(`    consoleErrors=${result.consoleErrors.join(' | ')}`);
      }
    }
  } finally {
    await browser.close();
  }

  const sorted = [...results].sort((a, b) => b.durationMs - a.durationMs);
  const avg = Math.round(results.reduce((sum, item) => sum + item.durationMs, 0) / results.length);
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.05))]?.durationMs ?? 0;

  console.log('\nTop 10 slowest routes:');
  for (const item of sorted.slice(0, 10)) {
    console.log(`- ${item.route}: ${item.durationMs} ms, ${item.requestCount} req, failed=${item.failedCount}, ok=${item.ok}`);
  }

  console.log('\nSummary:');
  console.log(JSON.stringify({
    totalRoutes: results.length,
    averageMs: avg,
    maxMs: sorted[0]?.durationMs ?? 0,
    minMs: sorted[sorted.length - 1]?.durationMs ?? 0,
    p95Ms: p95,
    failedRoutes: results.filter((item) => !item.ok || item.failedCount > 0).map((item) => item.route),
  }, null, 2));
}

await main();
