type PermissionDisplayMeta = { key: string; fallback: string };
type AquaCrudAction = 'view' | 'create' | 'update' | 'delete';

interface AquaPermissionResource {
  codeBase: string;
  routePermission?: string;
  routePaths?: string[];
  routePatterns?: RegExp[];
  actions: AquaCrudAction[];
  display: PermissionDisplayMeta;
}

const ACTION_FALLBACKS: Record<Exclude<AquaCrudAction, 'view'>, string> = {
  create: 'Oluşturma',
  update: 'Güncelleme',
  delete: 'Silme',
};

function createActionDisplayMap(
  display: PermissionDisplayMeta,
  actions: AquaCrudAction[]
): Record<string, PermissionDisplayMeta> {
  return actions.reduce<Record<string, PermissionDisplayMeta>>((acc, action) => {
    if (action === 'view') {
      acc[action] = display;
      return acc;
    }

    acc[action] = {
      key: `permissions.${display.key}.${action}`,
      fallback: `${display.fallback} - ${ACTION_FALLBACKS[action]}`,
    };
    return acc;
  }, {});
}

const AQUA_PERMISSION_RESOURCES: AquaPermissionResource[] = [
  {
    codeBase: 'aqua.definitions.projects',
    routePermission: 'aqua.definitions.projects.view',
    routePaths: ['/aqua/definitions/projects'],
    routePatterns: [/^\/aqua\/definitions\/projects(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'sidebar.aquaProjects', fallback: 'Projeler' },
  },
  {
    codeBase: 'aqua.definitions.cages',
    routePermission: 'aqua.definitions.cages.view',
    routePaths: ['/aqua/definitions/cages'],
    routePatterns: [/^\/aqua\/definitions\/cages(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'sidebar.aquaCages', fallback: 'Kafesler' },
  },
  {
    codeBase: 'aqua.definitions.project-cage-assignments',
    routePermission: 'aqua.definitions.project-cage-assignments.view',
    routePaths: ['/aqua/definitions/project-cage-assignments'],
    routePatterns: [/^\/aqua\/definitions\/project-cage-assignments(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'sidebar.aquaProjectCageAssignments', fallback: 'Proje-Kafes Atama' },
  },
  {
    codeBase: 'aqua.definitions.weather-severities',
    routePermission: 'aqua.definitions.weather-severities.view',
    routePaths: ['/aqua/definitions/weather-severities'],
    routePatterns: [/^\/aqua\/definitions\/weather-severities(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'sidebar.aquaWeatherSeverities', fallback: 'Hava Durumu Şiddet Tanımı' },
  },
  {
    codeBase: 'aqua.definitions.weather-types',
    routePermission: 'aqua.definitions.weather-types.view',
    routePaths: ['/aqua/definitions/weather-types'],
    routePatterns: [/^\/aqua\/definitions\/weather-types(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'sidebar.aquaWeatherTypes', fallback: 'Hava Durumu Tip Tanımı' },
  },
  {
    codeBase: 'aqua.definitions.net-operation-types',
    routePermission: 'aqua.definitions.net-operation-types.view',
    routePaths: ['/aqua/definitions/net-operation-types'],
    routePatterns: [/^\/aqua\/definitions\/net-operation-types(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'sidebar.aquaNetOperationTypes', fallback: 'Ağ İşlem Tipleri' },
  },
  {
    codeBase: 'aqua.definitions.settings',
    routePermission: 'aqua.definitions.settings.view',
    routePaths: ['/aqua/definitions/settings'],
    routePatterns: [/^\/aqua\/definitions\/settings(\/|$)/],
    actions: ['view', 'update'],
    display: { key: 'sidebar.aquaSettings', fallback: 'Aqua Ayarları' },
  },
  {
    codeBase: 'aqua.operations.quick-setup',
    routePermission: 'aqua.operations.quick-setup.view',
    routePaths: ['/aqua/operations/quick-setup'],
    routePatterns: [/^\/aqua\/operations\/quick-setup(\/|$)/],
    actions: ['view', 'create'],
    display: { key: 'sidebar.aquaQuickSetup', fallback: 'Hızlı Kurulum' },
  },
  {
    codeBase: 'aqua.operations.quick-daily-entry',
    routePermission: 'aqua.operations.quick-daily-entry.view',
    routePaths: ['/aqua/operations/quick-daily-entry'],
    routePatterns: [/^\/aqua\/operations\/quick-daily-entry(\/|$)/],
    actions: ['view', 'create'],
    display: { key: 'sidebar.aquaQuickDailyEntry', fallback: 'Hızlı Günlük Giriş' },
  },
  {
    codeBase: 'aqua.operations.goods-receipts',
    routePermission: 'aqua.operations.goods-receipts.view',
    routePaths: ['/aqua/operations/goods-receipts'],
    routePatterns: [/^\/aqua\/operations\/goods-receipts(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'sidebar.aquaGoodsReceipts', fallback: 'Mal Kabul (Balık/Yem)' },
  },
  {
    codeBase: 'aqua.operations.feedings',
    routePermission: 'aqua.operations.feedings.view',
    routePaths: ['/aqua/operations/feedings'],
    routePatterns: [/^\/aqua\/operations\/feedings(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'sidebar.aquaFeedings', fallback: 'Besleme (1. Tur/2. Tur)' },
  },
  {
    codeBase: 'aqua.operations.mortalities',
    routePermission: 'aqua.operations.mortalities.view',
    routePaths: ['/aqua/operations/mortalities'],
    routePatterns: [/^\/aqua\/operations\/mortalities(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'sidebar.aquaMortalities', fallback: 'Balık Fire' },
  },
  {
    codeBase: 'aqua.operations.transfers',
    routePermission: 'aqua.operations.transfers.view',
    routePaths: ['/aqua/operations/transfers'],
    routePatterns: [/^\/aqua\/operations\/transfers(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'sidebar.aquaTransfers', fallback: 'Transfer' },
  },
  {
    codeBase: 'aqua.operations.shipments',
    routePermission: 'aqua.operations.shipments.view',
    routePaths: ['/aqua/operations/shipments'],
    routePatterns: [/^\/aqua\/operations\/shipments(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'sidebar.aquaShipments', fallback: 'Sevkiyat' },
  },
  {
    codeBase: 'aqua.operations.weighings',
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'permissions.aqua.operations.weighings', fallback: 'Tartımlar' },
  },
  {
    codeBase: 'aqua.operations.stock-converts',
    routePermission: 'aqua.operations.stock-converts.view',
    routePaths: ['/aqua/operations/stock-converts'],
    routePatterns: [/^\/aqua\/operations\/stock-converts(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'sidebar.aquaStockConverts', fallback: 'Stok Dönüşüm' },
  },
  {
    codeBase: 'aqua.operations.daily-weathers',
    routePermission: 'aqua.operations.daily-weathers.view',
    routePaths: ['/aqua/operations/daily-weathers'],
    routePatterns: [/^\/aqua\/operations\/daily-weathers(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'sidebar.aquaDailyWeathers', fallback: 'Günlük Hava Durumu' },
  },
  {
    codeBase: 'aqua.operations.net-operations',
    routePermission: 'aqua.operations.net-operations.view',
    routePaths: ['/aqua/operations/net-operations'],
    routePatterns: [/^\/aqua\/operations\/net-operations(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'sidebar.aquaNetOperations', fallback: 'Ağ İşlemleri' },
  },
  {
    codeBase: 'aqua.operations.goods-receipt-lines',
    routePermission: 'aqua.operations.goods-receipt-lines.view',
    routePaths: ['/aqua/operations/goods-receipt-lines'],
    routePatterns: [/^\/aqua\/operations\/goods-receipt-lines(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'permissions.aqua.operations.goods-receipt-lines', fallback: 'Mal Kabul Satırları' },
  },
  {
    codeBase: 'aqua.operations.goods-receipt-fish-distributions',
    routePermission: 'aqua.operations.goods-receipt-fish-distributions.view',
    routePaths: ['/aqua/operations/goods-receipt-fish-distributions'],
    routePatterns: [/^\/aqua\/operations\/goods-receipt-fish-distributions(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'permissions.aqua.operations.goods-receipt-fish-distributions', fallback: 'Mal Kabul Balık Dağılımları' },
  },
  {
    codeBase: 'aqua.operations.feeding-lines',
    routePermission: 'aqua.operations.feeding-lines.view',
    routePaths: ['/aqua/operations/feeding-lines'],
    routePatterns: [/^\/aqua\/operations\/feeding-lines(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'permissions.aqua.operations.feeding-lines', fallback: 'Besleme Satırları' },
  },
  {
    codeBase: 'aqua.operations.feeding-distributions',
    routePermission: 'aqua.operations.feeding-distributions.view',
    routePaths: ['/aqua/operations/feeding-distributions'],
    routePatterns: [/^\/aqua\/operations\/feeding-distributions(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'permissions.aqua.operations.feeding-distributions', fallback: 'Besleme Dağılımları' },
  },
  {
    codeBase: 'aqua.operations.transfer-lines',
    routePermission: 'aqua.operations.transfer-lines.view',
    routePaths: ['/aqua/operations/transfer-lines'],
    routePatterns: [/^\/aqua\/operations\/transfer-lines(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'permissions.aqua.operations.transfer-lines', fallback: 'Transfer Satırları' },
  },
  {
    codeBase: 'aqua.operations.shipment-lines',
    routePermission: 'aqua.operations.shipment-lines.view',
    routePaths: ['/aqua/operations/shipment-lines'],
    routePatterns: [/^\/aqua\/operations\/shipment-lines(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'permissions.aqua.operations.shipment-lines', fallback: 'Sevkiyat Satırları' },
  },
  {
    codeBase: 'aqua.operations.mortality-lines',
    routePermission: 'aqua.operations.mortality-lines.view',
    routePaths: ['/aqua/operations/mortality-lines'],
    routePatterns: [/^\/aqua\/operations\/mortality-lines(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'permissions.aqua.operations.mortality-lines', fallback: 'Fire Satırları' },
  },
  {
    codeBase: 'aqua.operations.weighing-lines',
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'permissions.aqua.operations.weighing-lines', fallback: 'Tartım Satırları' },
  },
  {
    codeBase: 'aqua.operations.stock-convert-lines',
    routePermission: 'aqua.operations.stock-convert-lines.view',
    routePaths: ['/aqua/operations/stock-convert-lines'],
    routePatterns: [/^\/aqua\/operations\/stock-convert-lines(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'permissions.aqua.operations.stock-convert-lines', fallback: 'Stok Dönüşüm Satırları' },
  },
  {
    codeBase: 'aqua.operations.net-operation-lines',
    routePermission: 'aqua.operations.net-operation-lines.view',
    routePaths: ['/aqua/operations/net-operation-lines'],
    routePatterns: [/^\/aqua\/operations\/net-operation-lines(\/|$)/],
    actions: ['view', 'create', 'update', 'delete'],
    display: { key: 'permissions.aqua.operations.net-operation-lines', fallback: 'Ağ İşlem Satırları' },
  },
  {
    codeBase: 'aqua.reports.project-detail',
    routePermission: 'aqua.reports.project-detail.view',
    routePaths: ['/aqua/reports/project-detail'],
    routePatterns: [/^\/aqua\/reports\/project-detail(\/|$)/],
    actions: ['view'],
    display: { key: 'sidebar.aquaProjectDetailReport', fallback: 'Proje Detay Raporu' },
  },
  {
    codeBase: 'aqua.reports.batch-movements',
    routePermission: 'aqua.reports.batch-movements.view',
    routePaths: ['/aqua/reports/batch-movements'],
    routePatterns: [/^\/aqua\/reports\/batch-movements(\/|$)/],
    actions: ['view'],
    display: { key: 'sidebar.aquaBatchMovements', fallback: 'Parti Hareketleri' },
  },
  {
    codeBase: 'aqua.reports.cage-balances',
    routePermission: 'aqua.reports.cage-balances.view',
    routePaths: ['/aqua/reports/cage-balances'],
    routePatterns: [/^\/aqua\/reports\/cage-balances(\/|$)/],
    actions: ['view'],
    display: { key: 'sidebar.aquaCageBalances', fallback: 'Kafes Dengesi' },
  },
];

const AQUA_RESOURCE_PERMISSION_DISPLAY = AQUA_PERMISSION_RESOURCES.reduce<Record<string, PermissionDisplayMeta>>(
  (acc, resource) => {
    const actionDisplayMap = createActionDisplayMap(resource.display, resource.actions);
    resource.actions.forEach((action) => {
      acc[`${resource.codeBase}.${action}`] = actionDisplayMap[action];
    });
    return acc;
  },
  {}
);

export const AQUA_CONFIG_PERMISSION_CODES: Record<string, Partial<Record<AquaCrudAction, string>>> = {
  projects: {
    view: 'aqua.definitions.projects.view',
    create: 'aqua.definitions.projects.create',
    update: 'aqua.definitions.projects.update',
    delete: 'aqua.definitions.projects.delete',
  },
  cages: {
    view: 'aqua.definitions.cages.view',
    create: 'aqua.definitions.cages.create',
    update: 'aqua.definitions.cages.update',
    delete: 'aqua.definitions.cages.delete',
  },
  projectCageAssignments: {
    view: 'aqua.definitions.project-cage-assignments.view',
    create: 'aqua.definitions.project-cage-assignments.create',
    update: 'aqua.definitions.project-cage-assignments.update',
    delete: 'aqua.definitions.project-cage-assignments.delete',
  },
  weatherSeverities: {
    view: 'aqua.definitions.weather-severities.view',
    create: 'aqua.definitions.weather-severities.create',
    update: 'aqua.definitions.weather-severities.update',
    delete: 'aqua.definitions.weather-severities.delete',
  },
  weatherTypes: {
    view: 'aqua.definitions.weather-types.view',
    create: 'aqua.definitions.weather-types.create',
    update: 'aqua.definitions.weather-types.update',
    delete: 'aqua.definitions.weather-types.delete',
  },
  netOperationTypes: {
    view: 'aqua.definitions.net-operation-types.view',
    create: 'aqua.definitions.net-operation-types.create',
    update: 'aqua.definitions.net-operation-types.update',
    delete: 'aqua.definitions.net-operation-types.delete',
  },
  goodsReceipts: {
    view: 'aqua.operations.goods-receipts.view',
    create: 'aqua.operations.goods-receipts.create',
    update: 'aqua.operations.goods-receipts.update',
    delete: 'aqua.operations.goods-receipts.delete',
  },
  feedings: {
    view: 'aqua.operations.feedings.view',
    create: 'aqua.operations.feedings.create',
    update: 'aqua.operations.feedings.update',
    delete: 'aqua.operations.feedings.delete',
  },
  mortalities: {
    view: 'aqua.operations.mortalities.view',
    create: 'aqua.operations.mortalities.create',
    update: 'aqua.operations.mortalities.update',
    delete: 'aqua.operations.mortalities.delete',
  },
  transfers: {
    view: 'aqua.operations.transfers.view',
    create: 'aqua.operations.transfers.create',
    update: 'aqua.operations.transfers.update',
    delete: 'aqua.operations.transfers.delete',
  },
  shipments: {
    view: 'aqua.operations.shipments.view',
    create: 'aqua.operations.shipments.create',
    update: 'aqua.operations.shipments.update',
    delete: 'aqua.operations.shipments.delete',
  },
  weighings: {
    view: 'aqua.operations.weighings.view',
    create: 'aqua.operations.weighings.create',
    update: 'aqua.operations.weighings.update',
    delete: 'aqua.operations.weighings.delete',
  },
  stockConverts: {
    view: 'aqua.operations.stock-converts.view',
    create: 'aqua.operations.stock-converts.create',
    update: 'aqua.operations.stock-converts.update',
    delete: 'aqua.operations.stock-converts.delete',
  },
  dailyWeathers: {
    view: 'aqua.operations.daily-weathers.view',
    create: 'aqua.operations.daily-weathers.create',
    update: 'aqua.operations.daily-weathers.update',
    delete: 'aqua.operations.daily-weathers.delete',
  },
  netOperations: {
    view: 'aqua.operations.net-operations.view',
    create: 'aqua.operations.net-operations.create',
    update: 'aqua.operations.net-operations.update',
    delete: 'aqua.operations.net-operations.delete',
  },
  goodsReceiptLines: {
    view: 'aqua.operations.goods-receipt-lines.view',
    create: 'aqua.operations.goods-receipt-lines.create',
    update: 'aqua.operations.goods-receipt-lines.update',
    delete: 'aqua.operations.goods-receipt-lines.delete',
  },
  goodsReceiptFishDistributions: {
    view: 'aqua.operations.goods-receipt-fish-distributions.view',
    create: 'aqua.operations.goods-receipt-fish-distributions.create',
    update: 'aqua.operations.goods-receipt-fish-distributions.update',
    delete: 'aqua.operations.goods-receipt-fish-distributions.delete',
  },
  feedingLines: {
    view: 'aqua.operations.feeding-lines.view',
    create: 'aqua.operations.feeding-lines.create',
    update: 'aqua.operations.feeding-lines.update',
    delete: 'aqua.operations.feeding-lines.delete',
  },
  feedingDistributions: {
    view: 'aqua.operations.feeding-distributions.view',
    create: 'aqua.operations.feeding-distributions.create',
    update: 'aqua.operations.feeding-distributions.update',
    delete: 'aqua.operations.feeding-distributions.delete',
  },
  transferLines: {
    view: 'aqua.operations.transfer-lines.view',
    create: 'aqua.operations.transfer-lines.create',
    update: 'aqua.operations.transfer-lines.update',
    delete: 'aqua.operations.transfer-lines.delete',
  },
  shipmentLines: {
    view: 'aqua.operations.shipment-lines.view',
    create: 'aqua.operations.shipment-lines.create',
    update: 'aqua.operations.shipment-lines.update',
    delete: 'aqua.operations.shipment-lines.delete',
  },
  mortalityLines: {
    view: 'aqua.operations.mortality-lines.view',
    create: 'aqua.operations.mortality-lines.create',
    update: 'aqua.operations.mortality-lines.update',
    delete: 'aqua.operations.mortality-lines.delete',
  },
  weighingLines: {
    view: 'aqua.operations.weighing-lines.view',
    create: 'aqua.operations.weighing-lines.create',
    update: 'aqua.operations.weighing-lines.update',
    delete: 'aqua.operations.weighing-lines.delete',
  },
  stockConvertLines: {
    view: 'aqua.operations.stock-convert-lines.view',
    create: 'aqua.operations.stock-convert-lines.create',
    update: 'aqua.operations.stock-convert-lines.update',
    delete: 'aqua.operations.stock-convert-lines.delete',
  },
  netOperationLines: {
    view: 'aqua.operations.net-operation-lines.view',
    create: 'aqua.operations.net-operation-lines.create',
    update: 'aqua.operations.net-operation-lines.update',
    delete: 'aqua.operations.net-operation-lines.delete',
  },
  batchMovements: {
    view: 'aqua.reports.batch-movements.view',
  },
  cageBalances: {
    view: 'aqua.reports.cage-balances.view',
  },
};

export const AQUA_SPECIAL_PERMISSION_CODES = {
  settings: {
    view: 'aqua.definitions.settings.view',
    update: 'aqua.definitions.settings.update',
  },
  quickSetup: {
    view: 'aqua.operations.quick-setup.view',
    create: 'aqua.operations.quick-setup.create',
  },
  quickDailyEntry: {
    view: 'aqua.operations.quick-daily-entry.view',
    create: 'aqua.operations.quick-daily-entry.create',
  },
} as const;

export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/': 'dashboard.view',
  '/welcome': 'dashboard.view',

  '/stocks': 'stock.stocks.view',
  '/stocks/:id': 'stock.stocks.view',

  '/profile': 'users.profile.view',

  '/user-management': 'admin-only',
  '/users/mail-settings': 'admin-only',
  '/hangfire-monitoring': 'admin-only',
  '/access-control/permission-definitions': 'admin-only',
  '/access-control/permission-groups': 'admin-only',
  '/access-control/user-group-assignments': 'admin-only',

  '/aqua/definitions/projects': 'aqua.definitions.projects.view',
  '/aqua/definitions/cages': 'aqua.definitions.cages.view',
  '/aqua/definitions/project-cage-assignments': 'aqua.definitions.project-cage-assignments.view',
  '/aqua/definitions/weather-severities': 'aqua.definitions.weather-severities.view',
  '/aqua/definitions/weather-types': 'aqua.definitions.weather-types.view',
  '/aqua/definitions/net-operation-types': 'aqua.definitions.net-operation-types.view',
  '/aqua/definitions/settings': 'aqua.definitions.settings.view',

  '/aqua/operations/quick-setup': 'aqua.operations.quick-setup.view',
  '/aqua/operations/quick-daily-entry': 'aqua.operations.quick-daily-entry.view',
  '/aqua/operations/goods-receipts': 'aqua.operations.goods-receipts.view',
  '/aqua/operations/feedings': 'aqua.operations.feedings.view',
  '/aqua/operations/mortalities': 'aqua.operations.mortalities.view',
  '/aqua/operations/transfers': 'aqua.operations.transfers.view',
  '/aqua/operations/shipments': 'aqua.operations.shipments.view',
  '/aqua/operations/stock-converts': 'aqua.operations.stock-converts.view',
  '/aqua/operations/daily-weathers': 'aqua.operations.daily-weathers.view',
  '/aqua/operations/net-operations': 'aqua.operations.net-operations.view',

  '/aqua/operations/goods-receipt-lines': 'aqua.operations.goods-receipt-lines.view',
  '/aqua/operations/goods-receipt-fish-distributions': 'aqua.operations.goods-receipt-fish-distributions.view',
  '/aqua/operations/feeding-lines': 'aqua.operations.feeding-lines.view',
  '/aqua/operations/feeding-distributions': 'aqua.operations.feeding-distributions.view',
  '/aqua/operations/transfer-lines': 'aqua.operations.transfer-lines.view',
  '/aqua/operations/shipment-lines': 'aqua.operations.shipment-lines.view',
  '/aqua/operations/mortality-lines': 'aqua.operations.mortality-lines.view',
  '/aqua/operations/stock-convert-lines': 'aqua.operations.stock-convert-lines.view',
  '/aqua/operations/net-operation-lines': 'aqua.operations.net-operation-lines.view',

  '/aqua/reports/project-detail': 'aqua.reports.project-detail.view',
  '/aqua/reports/batch-movements': 'aqua.reports.batch-movements.view',
  '/aqua/reports/cage-balances': 'aqua.reports.cage-balances.view',
  '/aqua/dashboard': 'dashboard.view',
};

export const PATH_TO_PERMISSION_PATTERNS: Array<{ pattern: RegExp; permission: string }> = [
  { pattern: /^\/$/, permission: 'dashboard.view' },
  { pattern: /^\/welcome(\/|$)/, permission: 'dashboard.view' },

  { pattern: /^\/stocks(\/|$)/, permission: 'stock.stocks.view' },
  { pattern: /^\/profile(\/|$)/, permission: 'users.profile.view' },

  ...AQUA_PERMISSION_RESOURCES.flatMap((resource) =>
    (resource.routePatterns ?? []).map((pattern) => ({
      pattern,
      permission: resource.routePermission ?? `${resource.codeBase}.view`,
    }))
  ),
  {
    pattern: /^\/aqua\/dashboard(\/|$)/,
    permission: 'dashboard.view',
  },
];

export function isLeafPermissionCode(code: string): boolean {
  if (code === 'dashboard.view') return true;
  return code.split('.').filter(Boolean).length >= 3;
}

export const ACCESS_CONTROL_ADMIN_PERMISSIONS = [
  'access-control.permission-definitions.view',
  'access-control.permission-groups.view',
  'access-control.user-group-assignments.view',
] as const;

export const RBAC_FALLBACK_PERMISSION = 'access-control.permission-definitions.view' as const;

export const ACCESS_CONTROL_ADMIN_FALLBACK_TO_SYSTEM_ADMIN = true as const;

export const ACCESS_CONTROL_ADMIN_ONLY_PATTERNS: RegExp[] = [
  /^\/access-control(\/|$)/,
  /^\/user-management(\/|$)/,
  /^\/users\/mail-settings(\/|$)/,
  /^\/hangfire-monitoring(\/|$)/,
];

export const PERMISSION_CODE_DISPLAY: Record<string, PermissionDisplayMeta> = {
  'dashboard.view': { key: 'sidebar.home', fallback: 'Ana Sayfa' },
  'stock.stocks.view': { key: 'sidebar.stockManagement', fallback: 'Stok Yönetimi' },
  'users.profile.view': { key: 'sidebar.settings', fallback: 'Ayarlar' },
  ...AQUA_RESOURCE_PERMISSION_DISPLAY,
};

export function getPermissionDisplayMeta(code: string): PermissionDisplayMeta | null {
  return PERMISSION_CODE_DISPLAY[code] ?? null;
}

export const PERMISSION_MODULE_DISPLAY: Record<string, PermissionDisplayMeta> = {
  dashboard: { key: 'sidebar.home', fallback: 'Ana Sayfa' },
  stock: { key: 'sidebar.productAndStock', fallback: 'Ürünler ve Stok' },
  users: { key: 'sidebar.profile', fallback: 'Profil' },
  aqua: { key: 'sidebar.aquaOperations', fallback: 'Aqua İşlemleri' },
  'access-control': { key: 'sidebar.accessControl', fallback: 'Erişim Kontrolü' },
};

export function getPermissionModuleDisplayMeta(prefix: string): PermissionDisplayMeta | null {
  return PERMISSION_MODULE_DISPLAY[prefix] ?? null;
}

const SIDEBAR_PERMISSION_CODES = [
  'dashboard.view',
  'stock.stocks.view',
  'users.profile.view',
  ...AQUA_PERMISSION_RESOURCES.flatMap((resource) =>
    resource.actions.map((action) => `${resource.codeBase}.${action}`)
  ),
] as const;

export const PERMISSION_CODE_CATALOG: string[] = Array.from(new Set(SIDEBAR_PERMISSION_CODES)).sort((a, b) =>
  a.localeCompare(b)
);

export function getRoutesForPermissionCode(code: string): string[] {
  const routes = Object.entries(ROUTE_PERMISSION_MAP)
    .filter(([, permissionCode]) => permissionCode === code)
    .map(([route]) => route);
  return routes.sort((a, b) => a.localeCompare(b));
}
