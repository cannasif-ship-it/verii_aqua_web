import { expect, test } from '@playwright/test';
import { installAquaSmokeApiMocks, installAquaSmokeSession } from './utils/aqua-smoke-fixtures';

test.beforeEach(async ({ page }) => {
  await installAquaSmokeSession(page);
  await installAquaSmokeApiMocks(page);
});

test('Opening Import smoke renders source system and action buttons', async ({ page }) => {
  await page.goto('/aqua/operations/opening-import');

  await expect(page.getByRole('heading', { name: 'İlk Geçiş / Data Migration' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Şablon İndir' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Önizle ve Doğrula' })).toBeVisible();
});

test('Quick Daily Entry smoke renders selectors and operation tabs', async ({ page }) => {
  await page.goto('/aqua/operations/quick-daily-entry');

  await expect(page.getByRole('heading', { name: 'Günlük Giriş' })).toBeVisible();
  await expect(page.getByText('Proje', { exact: true })).toBeVisible();
  await expect(page.getByText('Kafes', { exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Yemleme' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Sevkiyat' })).toBeVisible();
});

test('Shipments smoke renders shipment line list with readable values', async ({ page }) => {
  await page.goto('/aqua/operations/shipments');

  await expect(page.getByRole('heading', { name: 'Sevkiyat' })).toBeVisible();
  await expect(page.getByText('BATCH-001')).toBeVisible();
  await expect(page.getByText('Deniz Kafes Projesi')).toBeVisible();
});

test('Cage to warehouse transfer smoke renders readable transfer values', async ({ page }) => {
  await page.goto('/aqua/operations/cage-warehouse-transfers');

  await expect(page.getByRole('heading', { name: 'Kafesten Depoya Transfer' })).toBeVisible();
  await expect(page.getByText('BATCH-001')).toBeVisible();
  await expect(page.getByText('Ana Depo')).toBeVisible();
});

test('Warehouse to cage transfer smoke renders readable transfer values', async ({ page }) => {
  await page.goto('/aqua/operations/warehouse-cage-transfers');

  await expect(page.getByRole('heading', { name: 'Depodan Kafese Transfer' })).toBeVisible();
  await expect(page.getByText('BATCH-001')).toBeVisible();
  await expect(page.getByText('CAGE-01')).toBeVisible();
});

test('Raw KPI smoke renders project snapshot and KPI cards', async ({ page }) => {
  await page.goto('/aqua/reports/raw-kpi');

  await expect(page.locator('main').getByText('Raw KPI Raporu', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Proje Özeti', { exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Survival %' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'FCR' })).toBeVisible();
});

test('Project detail report smoke renders shipment and system stock summary', async ({ page }) => {
  await page.goto('/aqua/reports/project-detail');

  await expect(page.locator('main').getByText('Proje Detay Raporu', { exact: true }).first()).toBeVisible();
  await page.getByRole('combobox').click();
  await page.getByText('PRJ-001 - Deniz Kafes Projesi (1)', { exact: true }).click();
  await expect(page.getByText('Toplam Sistem Stoku', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Toplam Sevk Balık', { exact: true }).first()).toBeVisible();
});

test('Business KPI smoke renders business snapshot and assumptions', async ({ page }) => {
  await page.goto('/aqua/reports/business-kpi');

  await expect(page.locator('main').getByText('Business KPI Raporu', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Business Özet', { exact: true })).toBeVisible();
  await expect(page.getByText('Varsayımlar', { exact: true })).toBeVisible();
  await expect(page.getByText('Tahmini Ciro', { exact: true }).first()).toBeVisible();
});

test('Devir / FCR smoke renders summary cards and project table', async ({ page }) => {
  await page.goto('/aqua/reports/devir-fcr');

  await expect(page.locator('main').getByText('Devir / FCR Raporu', { exact: true }).first()).toBeVisible();
  await page.getByRole('checkbox').first().check();
  await expect(page.getByRole('button', { name: 'Raporu Getir' })).toBeVisible();
  await page.getByRole('button', { name: 'Raporu Getir' }).click();
  await expect(page.getByText('Satış Adet', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'FCR' })).toBeVisible();
});
