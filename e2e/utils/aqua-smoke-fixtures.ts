import type { Page, Route } from '@playwright/test';

function createJwt(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'aqua.smoke',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'smoke@v3rii.com',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '1',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Admin',
    firstName: 'Aqua',
    lastName: 'Smoke',
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    iss: 'smoke',
    aud: 'smoke',
  })).toString('base64url');

  return `${header}.${payload}.signature`;
}

function success<T>(data: T) {
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

function paged<T>(items: T[]) {
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

function json(route: Route, body: unknown): Promise<void> {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

const mockProject = {
  id: 1,
  projectCode: 'PRJ-001',
  projectName: 'Deniz Kafes Projesi',
  startDate: '2026-01-01',
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

const mockCage = {
  id: 101,
  cageCode: 'CAGE-01',
  cageName: 'Kafes 01',
  capacityCount: 10000,
  capacityGram: 1000000,
};

const mockFishBatch = {
  id: 201,
  projectId: 1,
  batchCode: 'BATCH-001',
  fishStockId: 301,
  currentAverageGram: 400,
};

const mockBatchCageBalance = {
  id: 1,
  projectCageId: 11,
  fishBatchId: 201,
  liveCount: 750,
  averageGram: 400,
  biomassGram: 300000,
  batchCode: 'BATCH-001',
};

const mockWeatherSeverity = { id: 1, code: 'MID', name: 'Orta', score: 50, weatherTypeId: null };
const mockWeatherType = { id: 1, code: 'WIND', name: 'Rüzgarlı' };
const mockNetOperationType = { id: 1, code: 'NET-CLEAN', name: 'Ağ Temizliği' };
const mockWarehouse = { id: 1, erpWarehouseCode: 100, warehouseName: 'Ana Depo' };
const mockStock = { id: 301, erpStockCode: 'YEM-01', stockName: 'Büyütme Yemi' };

const mockShipment = {
  id: 1,
  projectId: 1,
  shipmentNo: 'SHP-001',
  shipmentDate: '2026-04-20',
  status: 1,
  targetWarehouseId: 1,
};

const mockShipmentLine = {
  id: 1,
  shipmentId: 1,
  fishBatchId: 201,
  fromProjectCageId: 11,
  fishCount: 200,
  averageGram: 500,
  biomassGram: 100000,
  unitPrice: 95,
  localUnitPrice: 95,
  lineAmount: 9500,
  localLineAmount: 9500,
  batchCode: 'BATCH-001',
  projectCode: 'PRJ-001',
  projectName: 'Deniz Kafes Projesi',
  fromCageCode: 'CAGE-01',
  targetWarehouseCode: '100',
  targetWarehouseName: 'Ana Depo',
};

const mockFeeding = { id: 1, projectId: 1, feedingDate: '2026-04-20', status: 1 };
const mockFeedingLine = { id: 1, feedingId: 1, stockId: 301, totalGram: 300000 };
const mockFeedingDistribution = { id: 1, feedingLineId: 1, projectCageId: 11, feedGram: 300000, fed: true };
const mockMortality = { id: 1, projectId: 1, mortalityDate: '2026-04-18', status: 1 };
const mockMortalityLine = { id: 1, mortalityId: 1, fishBatchId: 201, projectCageId: 11, deadCount: 50 };
const mockWarehouseTransfer = { id: 1, projectId: 1, transferNo: 'WTR-001', transferDate: '2026-04-19', status: 1 };
const mockWarehouseTransferLine = {
  id: 1,
  warehouseTransferId: 1,
  fishBatchId: 201,
  fromWarehouseId: 1,
  toWarehouseId: 2,
  fishCount: 40,
  averageGram: 400,
  biomassGram: 16000,
  batchCode: 'BATCH-001',
  fromWarehouseCode: '100',
  fromWarehouseName: 'Ana Depo',
  toWarehouseCode: '200',
  toWarehouseName: 'İkinci Depo',
};
const mockCageWarehouseTransfer = { id: 1, projectId: 1, transferNo: 'CWT-001', transferDate: '2026-04-19', status: 1 };
const mockCageWarehouseTransferLine = {
  id: 1,
  cageWarehouseTransferId: 1,
  fishBatchId: 201,
  fromProjectCageId: 11,
  toWarehouseId: 1,
  fishCount: 60,
  averageGram: 400,
  biomassGram: 24000,
  batchCode: 'BATCH-001',
  fromCageCode: 'CAGE-01',
  toWarehouseCode: '100',
  toWarehouseName: 'Ana Depo',
};
const mockWarehouseCageTransfer = { id: 1, projectId: 1, transferNo: 'WCT-001', transferDate: '2026-04-19', status: 1 };
const mockWarehouseCageTransferLine = {
  id: 1,
  warehouseCageTransferId: 1,
  fishBatchId: 201,
  fromWarehouseId: 1,
  toProjectCageId: 11,
  fishCount: 20,
  averageGram: 400,
  biomassGram: 8000,
  batchCode: 'BATCH-001',
  fromWarehouseCode: '100',
  fromWarehouseName: 'Ana Depo',
  toProjectCode: 'PRJ-001',
  toCageCode: 'CAGE-01',
};
const mockGoodsReceipt = { id: 1, projectId: 1, receiptDate: '2026-04-10', status: 1 };
const mockGoodsReceiptLine = {
  id: 1,
  goodsReceiptId: 1,
  itemType: 0,
  stockId: 301,
  qtyUnit: 300,
  totalGram: 300000,
  currencyCode: 'TRY',
  exchangeRate: 1,
  unitPrice: 20,
  localUnitPrice: 20,
  lineAmount: 6000,
  localLineAmount: 6000,
};

const mockAquaSettings = {
  requireFullTransfer: true,
  partialTransferOccupiedCageMode: 1,
  allowProjectMerge: true,
  feedCostFallbackStrategy: 0,
};

export async function installAquaSmokeSession(page: Page): Promise<void> {
  const token = createJwt();
  await page.addInitScript((value) => {
    window.localStorage.setItem('access_token', value);
    window.localStorage.setItem('i18nextLng', 'tr');
  }, token);
}

export async function installAquaSmokeApiMocks(page: Page): Promise<void> {
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname } = url;

    if (pathname.endsWith('/api/auth/me/permissions')) {
      return json(route, success({
        userId: 1,
        roleTitle: 'Admin',
        isSystemAdmin: true,
        permissionGroups: ['System Admin'],
        permissionCodes: [],
      }));
    }

    if (pathname.endsWith('/api/aqua/AquaSettings')) {
      return json(route, success(mockAquaSettings));
    }

    if (pathname.endsWith('/api/aqua/Project')) return json(route, paged([mockProject]));
    if (pathname.endsWith('/api/aqua/ProjectCage')) return json(route, paged([mockProjectCage]));
    if (pathname.endsWith('/api/aqua/Cage')) return json(route, paged([mockCage]));
    if (pathname.endsWith('/api/aqua/FishBatch')) return json(route, paged([mockFishBatch]));
    if (pathname.endsWith('/api/aqua/BatchCageBalance')) return json(route, paged([mockBatchCageBalance]));
    if (pathname.endsWith('/api/aqua/BatchWarehouseBalance')) return json(route, paged([]));
    if (pathname.endsWith('/api/aqua/WeatherSeverity')) return json(route, paged([mockWeatherSeverity]));
    if (pathname.endsWith('/api/aqua/WeatherType')) return json(route, paged([mockWeatherType]));
    if (pathname.endsWith('/api/aqua/NetOperationType')) return json(route, paged([mockNetOperationType]));
    if (pathname.endsWith('/api/aqua/Warehouse')) return json(route, paged([mockWarehouse]));
    if (pathname.endsWith('/api/Stock')) return json(route, paged([mockStock]));

    if (pathname.endsWith('/api/aqua/Shipment')) return json(route, paged([mockShipment]));
    if (pathname.endsWith('/api/aqua/ShipmentLine')) return json(route, paged([mockShipmentLine]));
    if (pathname.endsWith('/api/aqua/Feeding')) return json(route, paged([mockFeeding]));
    if (pathname.endsWith('/api/aqua/FeedingLine')) return json(route, paged([mockFeedingLine]));
    if (pathname.endsWith('/api/aqua/FeedingDistribution')) return json(route, paged([mockFeedingDistribution]));
    if (pathname.endsWith('/api/aqua/GoodsReceipt')) return json(route, paged([mockGoodsReceipt]));
    if (pathname.endsWith('/api/aqua/GoodsReceiptLine')) return json(route, paged([mockGoodsReceiptLine]));
    if (pathname.endsWith('/api/aqua/Mortality')) return json(route, paged([mockMortality]));
    if (pathname.endsWith('/api/aqua/MortalityLine')) return json(route, paged([mockMortalityLine]));

    if (pathname.endsWith('/api/aqua/DailyWeather')) return json(route, paged([]));
    if (pathname.endsWith('/api/aqua/NetOperation')) return json(route, paged([]));
    if (pathname.endsWith('/api/aqua/NetOperationLine')) return json(route, paged([]));
    if (pathname.endsWith('/api/aqua/Transfer')) return json(route, paged([]));
    if (pathname.endsWith('/api/aqua/TransferLine')) return json(route, paged([]));
    if (pathname.endsWith('/api/aqua/WarehouseTransfer')) return json(route, paged([mockWarehouseTransfer]));
    if (pathname.endsWith('/api/aqua/WarehouseTransferLine')) return json(route, paged([mockWarehouseTransferLine]));
    if (pathname.endsWith('/api/aqua/CageWarehouseTransfer')) return json(route, paged([mockCageWarehouseTransfer]));
    if (pathname.endsWith('/api/aqua/CageWarehouseTransferLine')) return json(route, paged([mockCageWarehouseTransferLine]));
    if (pathname.endsWith('/api/aqua/WarehouseCageTransfer')) return json(route, paged([mockWarehouseCageTransfer]));
    if (pathname.endsWith('/api/aqua/WarehouseCageTransferLine')) return json(route, paged([mockWarehouseCageTransferLine]));
    if (pathname.endsWith('/api/aqua/Weighing')) return json(route, paged([]));
    if (pathname.endsWith('/api/aqua/WeighingLine')) return json(route, paged([]));
    if (pathname.endsWith('/api/aqua/StockConvert')) return json(route, paged([]));
    if (pathname.endsWith('/api/aqua/StockConvertLine')) return json(route, paged([]));
    if (pathname.endsWith('/api/aqua/BatchMovement')) return json(route, paged([]));

    if (pathname.includes('/api/aqua/') && request.method() !== 'GET') {
      return json(route, success({ id: 999, ok: true }));
    }

    return route.continue();
  });
}
