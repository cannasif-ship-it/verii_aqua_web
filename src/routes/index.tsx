import { Suspense, lazy, type ComponentType } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { RouteErrorFallback } from '@/components/shared/RouteErrorFallback';
import { ForbiddenPage } from '@/components/shared/ForbiddenPage';
import { getAppBasePath } from '@/lib/api-config';
import { ensureFeatureNamespacesReady } from '@/lib/i18n';
import { measureAsync } from '@/lib/performance';

const lazyImport = <T extends Record<string, unknown>, K extends keyof T>(
  factory: () => Promise<T>,
  name: K,
  features?: string | string[],
) =>
  lazy(async () => {
    const module = await measureAsync(`route-chunk:${String(name)}`, async () => {
      const [loadedModule] = await Promise.all([
        factory(),
        ...(features ? [ensureFeatureNamespacesReady(features)] : []),
      ]);
      return loadedModule;
    });
    return { default: module[name] as ComponentType };
  });

const LazyMainLayout = lazy(async () => {
  const module = await import('@/components/shared/MainLayout');
  return { default: module.MainLayout };
});

const LazyAuthLayout = lazy(async () => {
  const module = await import('@/layouts/AuthLayout');
  return { default: module.default };
});

const LoginPage = lazyImport(() => import('@/features/auth/components/LoginPage.tsx'), 'LoginPage', 'auth');
const ResetPasswordPage = lazyImport(() => import('@/features/auth/components/ResetPasswordPage.tsx'), 'ResetPasswordPage', 'auth');
const ForgotPasswordPage = lazyImport(() => import('@/features/auth/components/ForgotPasswordPage.tsx'), 'ForgotPasswordPage', 'auth');
const UserManagementPage = lazyImport(() => import('@/features/user-management/components/UserManagementPage.tsx'), 'UserManagementPage', 'user-management');
const MailSettingsPage = lazyImport(() => import('@/features/mail-settings/pages/MailSettingsPage.tsx'), 'MailSettingsPage', 'mail-settings');
const StockListPage = lazyImport(() => import('@/features/stock/components/StockListPage.tsx'), 'StockListPage', 'stock');
const StockDetailPage = lazyImport(() => import('@/features/stock/components/StockDetailPage.tsx'), 'StockDetailPage', 'stock');
const PermissionDefinitionsPage = lazyImport(() => import('@/features/access-control/components/PermissionDefinitionsPage.tsx'), 'PermissionDefinitionsPage', 'access-control');
const PermissionGroupsPage = lazyImport(() => import('@/features/access-control/components/PermissionGroupsPage.tsx'), 'PermissionGroupsPage', 'access-control');
const UserGroupAssignmentsPage = lazyImport(() => import('@/features/access-control/components/UserGroupAssignmentsPage.tsx'), 'UserGroupAssignmentsPage', 'access-control');
const HangfireMonitoringPage = lazyImport(() => import('@/features/hangfire-monitoring/components/HangfireMonitoringPage.tsx'), 'HangfireMonitoringPage', 'hangfire-monitoring');
const ProfilePage = lazyImport(() => import('@/features/user-detail-management/components/ProfilePage.tsx'), 'ProfilePage', 'user-detail-management');
const ProjectsPage = lazyImport(() => import('@/features/aqua/definitions/components/ProjectsPage.tsx'), 'ProjectsPage', 'aqua');
const CagesPage = lazyImport(() => import('@/features/aqua/definitions/components/CagesPage.tsx'), 'CagesPage', 'aqua');
const ProjectCageAssignmentsPage = lazyImport(() => import('@/features/aqua/definitions/components/ProjectCageAssignmentsPage.tsx'), 'ProjectCageAssignmentsPage', 'aqua');
const WeatherSeveritiesPage = lazyImport(() => import('@/features/aqua/definitions/components/WeatherSeveritiesPage.tsx'), 'WeatherSeveritiesPage', 'aqua');
const WeatherTypesPage = lazyImport(() => import('@/features/aqua/definitions/components/WeatherTypesPage.tsx'), 'WeatherTypesPage', 'aqua');
const NetOperationTypesPage = lazyImport(() => import('@/features/aqua/definitions/components/NetOperationTypesPage.tsx'), 'NetOperationTypesPage', 'aqua');
const AquaSettingsPage = lazyImport(() => import('@/features/aqua/settings/pages/AquaSettingsPage.tsx'), 'AquaSettingsPage', 'aqua');
const GoodsReceiptsPage = lazyImport(() => import('@/features/aqua/operations/components/GoodsReceiptsPage.tsx'), 'GoodsReceiptsPage', 'aqua');
const FeedingsPage = lazyImport(() => import('@/features/aqua/operations/components/FeedingsPage.tsx'), 'FeedingsPage', 'aqua');
const MortalitiesPage = lazyImport(() => import('@/features/aqua/operations/components/MortalitiesPage.tsx'), 'MortalitiesPage', 'aqua');
const TransfersPage = lazyImport(() => import('@/features/aqua/operations/components/TransfersPage.tsx'), 'TransfersPage', 'aqua');
const WarehouseTransfersPage = lazyImport(() => import('@/features/aqua/operations/components/WarehouseTransfersPage.tsx'), 'WarehouseTransfersPage', 'aqua');
const CageWarehouseTransfersPage = lazyImport(() => import('@/features/aqua/operations/components/CageWarehouseTransfersPage.tsx'), 'CageWarehouseTransfersPage', 'aqua');
const WarehouseCageTransfersPage = lazyImport(() => import('@/features/aqua/operations/components/WarehouseCageTransfersPage.tsx'), 'WarehouseCageTransfersPage', 'aqua');
const ShipmentsPage = lazyImport(() => import('@/features/aqua/operations/components/ShipmentsPage.tsx'), 'ShipmentsPage', 'aqua');
const WeighingsPage = lazyImport(() => import('@/features/aqua/operations/components/WeighingsPage.tsx'), 'WeighingsPage', 'aqua');
const StockConvertsPage = lazyImport(() => import('@/features/aqua/operations/components/StockConvertsPage.tsx'), 'StockConvertsPage', 'aqua');
const FishBatchesPage = lazyImport(() => import('@/features/aqua/operations/components/FishBatchesPage.tsx'), 'FishBatchesPage', 'aqua');
const DailyWeathersPage = lazyImport(() => import('@/features/aqua/operations/components/DailyWeathersPage.tsx'), 'DailyWeathersPage', 'aqua');
const NetOperationsPage = lazyImport(() => import('@/features/aqua/operations/components/NetOperationsPage.tsx'), 'NetOperationsPage', 'aqua');
const GoodsReceiptLinesPage = lazyImport(() => import('@/features/aqua/operations/components/GoodsReceiptLinesPage.tsx'), 'GoodsReceiptLinesPage', 'aqua');
const GoodsReceiptFishDistributionsPage = lazyImport(() => import('@/features/aqua/operations/components/GoodsReceiptFishDistributionsPage.tsx'), 'GoodsReceiptFishDistributionsPage', 'aqua');
const FeedingLinesPage = lazyImport(() => import('@/features/aqua/operations/components/FeedingLinesPage.tsx'), 'FeedingLinesPage', 'aqua');
const FeedingDistributionsPage = lazyImport(() => import('@/features/aqua/operations/components/FeedingDistributionsPage.tsx'), 'FeedingDistributionsPage', 'aqua');
const TransferLinesPage = lazyImport(() => import('@/features/aqua/operations/components/TransferLinesPage.tsx'), 'TransferLinesPage', 'aqua');
const WarehouseTransferLinesPage = lazyImport(() => import('@/features/aqua/operations/components/WarehouseTransferLinesPage.tsx'), 'WarehouseTransferLinesPage', 'aqua');
const CageWarehouseTransferLinesPage = lazyImport(() => import('@/features/aqua/operations/components/CageWarehouseTransferLinesPage.tsx'), 'CageWarehouseTransferLinesPage', 'aqua');
const WarehouseCageTransferLinesPage = lazyImport(() => import('@/features/aqua/operations/components/WarehouseCageTransferLinesPage.tsx'), 'WarehouseCageTransferLinesPage', 'aqua');
const ShipmentLinesPage = lazyImport(() => import('@/features/aqua/operations/components/ShipmentLinesPage.tsx'), 'ShipmentLinesPage', 'aqua');
const MortalityLinesPage = lazyImport(() => import('@/features/aqua/operations/components/MortalityLinesPage.tsx'), 'MortalityLinesPage', 'aqua');
const WeighingLinesPage = lazyImport(() => import('@/features/aqua/operations/components/WeighingLinesPage.tsx'), 'WeighingLinesPage', 'aqua');
const StockConvertLinesPage = lazyImport(() => import('@/features/aqua/operations/components/StockConvertLinesPage.tsx'), 'StockConvertLinesPage', 'aqua');
const NetOperationLinesPage = lazyImport(() => import('@/features/aqua/operations/components/NetOperationLinesPage.tsx'), 'NetOperationLinesPage', 'aqua');
const BatchMovementsPage = lazyImport(() => import('@/features/aqua/reports/components/BatchMovementsPage.tsx'), 'BatchMovementsPage', 'aqua');
const CageBalancesPage = lazyImport(() => import('@/features/aqua/reports/components/CageBalancesPage.tsx'), 'CageBalancesPage', 'aqua');
const ProjectDetailReportPage = lazyImport(() => import('@/features/aqua/reports/components/ProjectDetailReportPage.tsx'), 'ProjectDetailReportPage', 'aqua');
const AquaDashboardPage = lazyImport(() => import('@/features/aqua/reports/components/AquaDashboardPage.tsx'), 'AquaDashboardPage', 'aqua');
const RawKpiReportPage = lazyImport(() => import('@/features/aqua/reports/components/RawKpiReportPage.tsx'), 'RawKpiReportPage', 'aqua');
const BusinessKpiReportPage = lazyImport(() => import('@/features/aqua/reports/components/BusinessKpiReportPage.tsx'), 'BusinessKpiReportPage', 'aqua');
const DevirFcrReportPage = lazyImport(() => import('@/features/aqua/reports/components/DevirFcrReportPage.tsx'), 'DevirFcrReportPage', 'aqua');
const QuickSetupPage = lazyImport(() => import('@/features/aqua/operations/quick-setup/QuickSetupPage.tsx'), 'QuickSetupPage', 'aqua');
const QuickDailyEntryPage = lazyImport(() => import('@/features/aqua/operations/quick-daily-entry/QuickDailyEntryPage.tsx'), 'QuickDailyEntryPage', 'aqua');
const OpeningImportPage = lazyImport(() => import('@/features/aqua/operations/opening-import/OpeningImportPage.tsx'), 'OpeningImportPage', 'aqua');
const ProjectMergesPage = lazyImport(() => import('@/features/aqua/operations/project-merges/pages/ProjectMergesPage.tsx'), 'ProjectMergesPage', 'aqua');
const WelcomePage = lazyImport(() => import('@/features/welcome/WelcomePage.tsx'), 'WelcomePage', 'welcome');

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Suspense fallback={null}>
          <LazyMainLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorFallback />,
    children: [
      // Root/home artık dashboard olacak (redirect yok).
      { index: true, element: <AquaDashboardPage /> },
      { path: 'welcome', element: <WelcomePage /> },
      { path: 'forbidden', element: <ForbiddenPage /> },
      { path: 'user-management', element: <UserManagementPage /> },
      { path: 'users/mail-settings', element: <MailSettingsPage /> },
      { path: 'stocks', element: <StockListPage /> },
      { path: 'stocks/:id', element: <StockDetailPage /> },
      { path: 'access-control/permission-definitions', element: <PermissionDefinitionsPage /> },
      { path: 'access-control/permission-groups', element: <PermissionGroupsPage /> },
      { path: 'access-control/user-group-assignments', element: <UserGroupAssignmentsPage /> },
      { path: 'hangfire-monitoring', element: <HangfireMonitoringPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'aqua/definitions/projects', element: <ProjectsPage /> },
      { path: 'aqua/definitions/cages', element: <CagesPage /> },
      { path: 'aqua/definitions/project-cage-assignments', element: <ProjectCageAssignmentsPage /> },
      { path: 'aqua/definitions/weather-severities', element: <WeatherSeveritiesPage /> },
      { path: 'aqua/definitions/weather-types', element: <WeatherTypesPage /> },
      { path: 'aqua/definitions/net-operation-types', element: <NetOperationTypesPage /> },
      { path: 'aqua/definitions/settings', element: <AquaSettingsPage /> },
      { path: 'aqua/operations/quick-setup', element: <QuickSetupPage /> },
      { path: 'aqua/operations/quick-daily-entry', element: <QuickDailyEntryPage /> },
      { path: 'aqua/operations/opening-import', element: <OpeningImportPage /> },
      { path: 'aqua/operations/project-merges', element: <ProjectMergesPage /> },
      { path: 'aqua/operations/goods-receipts', element: <GoodsReceiptsPage /> },
      { path: 'aqua/operations/feedings', element: <FeedingsPage /> },
      { path: 'aqua/operations/mortalities', element: <MortalitiesPage /> },
      { path: 'aqua/operations/transfers', element: <TransfersPage /> },
      { path: 'aqua/operations/warehouse-transfers', element: <WarehouseTransfersPage /> },
      { path: 'aqua/operations/cage-warehouse-transfers', element: <CageWarehouseTransfersPage /> },
      { path: 'aqua/operations/warehouse-cage-transfers', element: <WarehouseCageTransfersPage /> },
      { path: 'aqua/operations/shipments', element: <ShipmentsPage /> },
      { path: 'aqua/operations/weighings', element: <WeighingsPage /> },
      { path: 'aqua/operations/stock-converts', element: <StockConvertsPage /> },
      { path: 'aqua/operations/fish-batches', element: <FishBatchesPage /> },
      { path: 'aqua/operations/daily-weathers', element: <DailyWeathersPage /> },
      { path: 'aqua/operations/net-operations', element: <NetOperationsPage /> },
      { path: 'aqua/operations/goods-receipt-lines', element: <GoodsReceiptLinesPage /> },
      { path: 'aqua/operations/goods-receipt-fish-distributions', element: <GoodsReceiptFishDistributionsPage /> },
      { path: 'aqua/operations/feeding-lines', element: <FeedingLinesPage /> },
      { path: 'aqua/operations/feeding-distributions', element: <FeedingDistributionsPage /> },
      { path: 'aqua/operations/transfer-lines', element: <TransferLinesPage /> },
      { path: 'aqua/operations/warehouse-transfer-lines', element: <WarehouseTransferLinesPage /> },
      { path: 'aqua/operations/cage-warehouse-transfer-lines', element: <CageWarehouseTransferLinesPage /> },
      { path: 'aqua/operations/warehouse-cage-transfer-lines', element: <WarehouseCageTransferLinesPage /> },
      { path: 'aqua/operations/shipment-lines', element: <ShipmentLinesPage /> },
      { path: 'aqua/operations/mortality-lines', element: <MortalityLinesPage /> },
      { path: 'aqua/operations/weighing-lines', element: <WeighingLinesPage /> },
      { path: 'aqua/operations/stock-convert-lines', element: <StockConvertLinesPage /> },
      { path: 'aqua/operations/net-operation-lines', element: <NetOperationLinesPage /> },
      { path: 'aqua/reports/batch-movements', element: <BatchMovementsPage /> },
      { path: 'aqua/reports/cage-balances', element: <CageBalancesPage /> },
      { path: 'aqua/reports/project-detail', element: <ProjectDetailReportPage /> },
      { path: 'aqua/reports/raw-kpi', element: <RawKpiReportPage /> },
      { path: 'aqua/reports/business-kpi', element: <BusinessKpiReportPage /> },
      { path: 'aqua/reports/devir-fcr', element: <DevirFcrReportPage /> },
      { path: 'aqua/dashboard', element: <AquaDashboardPage /> },
    ],
  },
  {
    path: '/auth',
    element: (
      <Suspense fallback={null}>
        <LazyAuthLayout />
      </Suspense>
    ),
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  {
    path: '/reset-password',
    element: (
      <Suspense fallback={null}>
        <LazyAuthLayout />
      </Suspense>
    ),
    children: [{ index: true, element: <ResetPasswordPage /> }],
  },
], {
  basename: getAppBasePath(),
});
