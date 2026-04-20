import { type ChangeEvent, type ReactElement, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, DatabaseZap, Download, FileSpreadsheet, RefreshCcw, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMyPermissionsQuery } from '@/features/access-control/hooks/useMyPermissionsQuery';
import { hasPermission } from '@/features/access-control/utils/hasPermission';
import { AQUA_SPECIAL_PERMISSION_CODES } from '@/features/access-control/utils/permission-config';
import { openingImportApi } from './api/opening-import-api';
import type {
  OpeningImportCommitResultDto,
  OpeningImportPreviewResponseDto,
  OpeningImportSheetDefinition,
  OpeningImportTargetField,
  ParsedImportSheet,
} from './types/opening-import-types';

const SHEET_DEFINITIONS: OpeningImportSheetDefinition[] = [
  {
    sheetName: 'Projects',
    titleKey: 'Projects',
    targets: [
      { field: 'projectCode', label: 'ProjectCode', required: true },
      { field: 'projectName', label: 'ProjectName', required: true },
      { field: 'startDate', label: 'StartDate', required: true },
      { field: 'status', label: 'Status' },
      { field: 'note', label: 'Note' },
    ],
  },
  {
    sheetName: 'Cages',
    titleKey: 'Cages',
    targets: [
      { field: 'projectCode', label: 'ProjectCode', required: true },
      { field: 'cageCode', label: 'CageCode', required: true },
      { field: 'cageName', label: 'CageName', required: true },
      { field: 'assignedDate', label: 'AssignedDate' },
    ],
  },
  {
    sheetName: 'OpeningStock',
    titleKey: 'OpeningStock',
    targets: [
      { field: 'projectCode', label: 'ProjectCode', required: true },
      { field: 'cageCode', label: 'CageCode' },
      { field: 'warehouseCode', label: 'WarehouseCode' },
      { field: 'batchCode', label: 'BatchCode' },
      { field: 'fishStockCode', label: 'FishStockCode', required: true },
      { field: 'fishCount', label: 'FishCount', required: true },
      { field: 'averageGram', label: 'AverageGram', required: true },
      { field: 'asOfDate', label: 'AsOfDate' },
    ],
  },
  {
    sheetName: 'OpeningGoodsReceipts',
    titleKey: 'OpeningGoodsReceipts',
    targets: [
      { field: 'projectCode', label: 'ProjectCode', required: true },
      { field: 'cageCode', label: 'CageCode', required: true },
      { field: 'warehouseCode', label: 'WarehouseCode' },
      { field: 'receiptNo', label: 'ReceiptNo' },
      { field: 'receiptDate', label: 'ReceiptDate', required: true },
      { field: 'batchCode', label: 'BatchCode' },
      { field: 'fishStockCode', label: 'FishStockCode', required: true },
      { field: 'fishCount', label: 'FishCount', required: true },
      { field: 'averageGram', label: 'AverageGram', required: true },
    ],
  },
  {
    sheetName: 'OpeningMortality',
    titleKey: 'OpeningMortality',
    targets: [
      { field: 'projectCode', label: 'ProjectCode', required: true },
      { field: 'cageCode', label: 'CageCode', required: true },
      { field: 'batchCode', label: 'BatchCode' },
      { field: 'fishStockCode', label: 'FishStockCode', required: true },
      { field: 'deadCount', label: 'DeadCount', required: true },
      { field: 'mortalityDate', label: 'MortalityDate', required: true },
    ],
  },
  {
    sheetName: 'OpeningFeedings',
    titleKey: 'OpeningFeedings',
    targets: [
      { field: 'projectCode', label: 'ProjectCode', required: true },
      { field: 'cageCode', label: 'CageCode', required: true },
      { field: 'batchCode', label: 'BatchCode', required: true },
      { field: 'fishStockCode', label: 'FishStockCode', required: true },
      { field: 'feedStockCode', label: 'FeedStockCode', required: true },
      { field: 'feedingDate', label: 'FeedingDate', required: true },
      { field: 'feedingSlot', label: 'FeedingSlot' },
      { field: 'feedGram', label: 'FeedGram', required: true },
    ],
  },
  {
    sheetName: 'OpeningShipments',
    titleKey: 'OpeningShipments',
    targets: [
      { field: 'projectCode', label: 'ProjectCode', required: true },
      { field: 'cageCode', label: 'CageCode', required: true },
      { field: 'batchCode', label: 'BatchCode', required: true },
      { field: 'fishStockCode', label: 'FishStockCode', required: true },
      { field: 'shipmentDate', label: 'ShipmentDate', required: true },
      { field: 'fishCount', label: 'FishCount', required: true },
      { field: 'averageGram', label: 'AverageGram', required: true },
      { field: 'currencyCode', label: 'CurrencyCode' },
      { field: 'exchangeRate', label: 'ExchangeRate' },
      { field: 'unitPrice', label: 'UnitPrice' },
      { field: 'targetWarehouseCode', label: 'TargetWarehouseCode' },
    ],
  },
];

const TEMPLATE_ROWS: Record<string, Record<string, string | number | null>[]> = {
  Projects: [
    {
      ProjectCode: 'PRJ-001',
      ProjectName: 'Geçiş Projesi 001',
      StartDate: '2026-01-01',
      Status: 'Draft',
      Note: 'Eski sistemden açılış',
    },
  ],
  Cages: [
    {
      ProjectCode: 'PRJ-001',
      CageCode: 'A1',
      CageName: 'A1 Kafesi',
      AssignedDate: '2026-01-01',
    },
  ],
  OpeningStock: [
    {
      ProjectCode: 'PRJ-001',
      CageCode: 'A1',
      WarehouseCode: null,
      BatchCode: 'BATCH-001',
      FishStockCode: 'F001',
      FishCount: 1000,
      AverageGram: 120,
      AsOfDate: '2026-01-01',
    },
  ],
  OpeningGoodsReceipts: [
    {
      ProjectCode: 'PRJ-001',
      CageCode: 'A1',
      WarehouseCode: null,
      ReceiptNo: 'OPEN-REC-001',
      ReceiptDate: '2026-03-31',
      BatchCode: 'BATCH-001',
      FishStockCode: 'F001',
      FishCount: 1000,
      AverageGram: 120,
    },
  ],
  OpeningMortality: [
    {
      ProjectCode: 'PRJ-001',
      CageCode: 'A1',
      BatchCode: 'BATCH-001',
      FishStockCode: 'F001',
      DeadCount: 300,
      MortalityDate: '2026-04-15',
    },
  ],
  OpeningFeedings: [
    {
      ProjectCode: 'PRJ-001',
      CageCode: 'A1',
      BatchCode: 'BATCH-001',
      FishStockCode: 'F001',
      FeedStockCode: 'YEM-001',
      FeedingDate: '2026-04-15',
      FeedingSlot: 'Morning',
      FeedGram: 85000,
    },
  ],
  OpeningShipments: [
    {
      ProjectCode: 'PRJ-001',
      CageCode: 'A1',
      BatchCode: 'BATCH-001',
      FishStockCode: 'F001',
      ShipmentDate: '2026-04-18',
      FishCount: 500,
      AverageGram: 420,
      CurrencyCode: 'TRY',
      ExchangeRate: 1,
      UnitPrice: 185,
      TargetWarehouseCode: 1,
    },
    {
      ProjectCode: 'PRJ-001',
      CageCode: 'A1',
      BatchCode: 'BATCH-001',
      FishStockCode: 'F001',
      ShipmentDate: '2026-04-18',
      FishCount: 300,
      AverageGram: 415,
      CurrencyCode: 'TRY',
      ExchangeRate: 1,
      UnitPrice: 192,
      TargetWarehouseCode: 1,
    },
  ],
};

const SHEET_NAME_ALIASES: Record<string, string[]> = {
  Projects: ['Projects', 'Projeler'],
  Cages: ['Cages', 'Kafesler'],
  OpeningStock: ['OpeningStock', 'Opening Stock', 'Açılış Stoku'],
  OpeningGoodsReceipts: ['OpeningGoodsReceipts', 'Opening Goods Receipts', 'Açılış Mal Kabulleri'],
  OpeningMortality: ['OpeningMortality', 'Opening Mortality', 'Açılış Fire', 'Açılış Ölüm'],
  OpeningFeedings: ['OpeningFeedings', 'Opening Feedings', 'Açılış Yemleme'],
  OpeningShipments: ['OpeningShipments', 'Opening Shipments', 'Açılış Sevkiyat'],
};

const FIELD_LABEL_ALIASES: Record<string, string[]> = {
  ProjectCode: ['ProjectCode', 'Project Code', 'Proje Kodu'],
  ProjectName: ['ProjectName', 'Project Name', 'Proje Adı'],
  StartDate: ['StartDate', 'Start Date', 'Başlangıç Tarihi'],
  Status: ['Status', 'Durum'],
  Note: ['Note', 'Not'],
  CageCode: ['CageCode', 'Cage Code', 'Kafes Kodu'],
  CageName: ['CageName', 'Cage Name', 'Kafes Adı'],
  AssignedDate: ['AssignedDate', 'Assignment Date', 'Atama Tarihi'],
  WarehouseCode: ['WarehouseCode', 'Warehouse Code', 'Depo Kodu'],
  BatchCode: ['BatchCode', 'Batch Code', 'Batch Kodu'],
  FishStockCode: ['FishStockCode', 'Fish Stock Code', 'Balık Stok Kodu'],
  FishCount: ['FishCount', 'Fish Count', 'Balık Adedi'],
  AverageGram: ['AverageGram', 'Average Gram', 'Ortalama Gram'],
  AsOfDate: ['AsOfDate', 'Balance Date', 'Bakiye Tarihi'],
  ReceiptNo: ['ReceiptNo', 'Receipt No', 'Mal Kabul No'],
  ReceiptDate: ['ReceiptDate', 'Receipt Date', 'Mal Kabul Tarihi'],
  DeadCount: ['DeadCount', 'Dead Count', 'Fire Adedi', 'Ölü Adedi'],
  MortalityDate: ['MortalityDate', 'Mortality Date', 'Fire Tarihi', 'Ölüm Tarihi'],
  FeedStockCode: ['FeedStockCode', 'Feed Stock Code', 'Yem Stok Kodu'],
  FeedingDate: ['FeedingDate', 'Feeding Date', 'Yemleme Tarihi'],
  FeedingSlot: ['FeedingSlot', 'Feeding Slot', 'Yemleme Turu'],
  FeedGram: ['FeedGram', 'Feed Gram', 'Yem Gramı'],
  ShipmentDate: ['ShipmentDate', 'Shipment Date', 'Sevkiyat Tarihi'],
  CurrencyCode: ['CurrencyCode', 'Currency Code', 'Para Birimi'],
  ExchangeRate: ['ExchangeRate', 'Exchange Rate', 'Kur'],
  UnitPrice: ['UnitPrice', 'Unit Price', 'Birim Fiyat'],
  TargetWarehouseCode: ['TargetWarehouseCode', 'Target Warehouse Code', 'Hedef Depo Kodu'],
};

function getSheetTitle(t: (key: string, options?: Record<string, unknown>) => string, sheetName: string): string {
  return t(`aqua.openingImport.sheets.${sheetName}`, { defaultValue: sheetName });
}

function getFieldLabel(t: (key: string, options?: Record<string, unknown>) => string, label: string): string {
  return t(`aqua.openingImport.fields.${label}`, { defaultValue: label });
}

function getPreviewStatusLabel(t: (key: string, options?: Record<string, unknown>) => string, status: string): string {
  return t(`aqua.openingImport.statusValues.${status}`, { defaultValue: status });
}

function findWorkbookSheetName(workbook: XLSX.WorkBook, canonicalSheetName: string): string | null {
  const aliases = SHEET_NAME_ALIASES[canonicalSheetName] ?? [canonicalSheetName];
  const aliasSet = new Set(aliases.map((item) => normalizeHeader(item)));

  return workbook.SheetNames.find((sheetName) => aliasSet.has(normalizeHeader(sheetName))) ?? null;
}

function getFieldAliases(label: string, field: string): string[] {
  return Array.from(new Set([label, field, ...(FIELD_LABEL_ALIASES[label] ?? [])]));
}

function normalizeHeader(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

function autoMapHeader(sheetName: string, header: string): OpeningImportTargetField | '' {
  const normalized = normalizeHeader(header);
  const definition = SHEET_DEFINITIONS.find((item) => item.sheetName === sheetName);
  if (!definition) return '';

  const match = definition.targets.find((target) =>
    getFieldAliases(target.label, target.field).some((alias) => normalizeHeader(alias) === normalized)
  );
  return match?.field ?? '';
}

function localizeSheetRows(
  t: (key: string, options?: Record<string, unknown>) => string,
  sheetName: string,
  rows: Array<Record<string, string | number | null>>
): Array<Record<string, string | number | null>> {
  const definition = SHEET_DEFINITIONS.find((item) => item.sheetName === sheetName);
  if (!definition) return rows;

  const labelByField = new Map(definition.targets.map((target) => [target.field, getFieldLabel(t, target.label)]));

  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        labelByField.get(key as OpeningImportTargetField) ?? getFieldLabel(t, key),
        value,
      ])
    )
  );
}

function readWorkbook(file: File): Promise<ParsedImportSheet[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: 'array' });
        const parsed = SHEET_DEFINITIONS.map<ParsedImportSheet>((definition) => {
          const resolvedSheetName = findWorkbookSheetName(workbook, definition.sheetName);
          const sheet = resolvedSheetName ? workbook.Sheets[resolvedSheetName] : undefined;
          if (!sheet) {
            return { sheetName: definition.sheetName, headers: [], rows: [], mappings: {} };
          }

          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
          const headers = Object.keys(rows[0] ?? {});

          return {
            sheetName: definition.sheetName,
            headers,
            rows: rows.map((row) =>
              Object.fromEntries(headers.map((header) => [header, row[header] == null ? null : String(row[header]).trim()]))
            ),
            mappings: Object.fromEntries(headers.map((header) => [header, autoMapHeader(definition.sheetName, header)])),
          };
        });

        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function downloadWorkbook(
  t: (key: string, options?: Record<string, unknown>) => string,
  fileName: string,
  sheets: ParsedImportSheet[] | null,
  preview?: OpeningImportPreviewResponseDto | null
): void {
  const workbook = XLSX.utils.book_new();

  if (preview && preview.rows.length > 0) {
    const groupedRows = preview.rows.reduce<Record<string, Array<Record<string, string | number>>>>((acc, row) => {
      const normalizedEntries = Object.entries(row.normalizedData).reduce<Record<string, string>>((normalized, [key, value]) => {
        normalized[key] = value ?? '';
        return normalized;
      }, {});

      acc[row.sheetName] ??= [];
      acc[row.sheetName].push({
        [ttExport(t, 'aqua.openingImport.previewRowNumber', 'Satır')]: row.rowNumber,
        [ttExport(t, 'aqua.openingImport.status', 'Durum')]: getPreviewStatusLabel(t, row.status),
        [ttExport(t, 'aqua.openingImport.messages', 'Mesajlar')]: row.messages.join(' | '),
        ...normalizedEntries,
      });
      return acc;
    }, {});

    Object.entries(groupedRows).forEach(([sheetName, rows]) => {
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(localizeSheetRows(t, sheetName, rows)),
        getSheetTitle(t, sheetName)
      );
    });
  } else if (sheets) {
    sheets.forEach((sheet) => {
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(localizeSheetRows(t, sheet.sheetName, sheet.rows)),
        getSheetTitle(t, sheet.sheetName)
      );
    });
  } else {
    SHEET_DEFINITIONS.forEach((definition) => {
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(localizeSheetRows(t, definition.sheetName, TEMPLATE_ROWS[definition.sheetName])),
        getSheetTitle(t, definition.sheetName)
      );
    });
  }

  XLSX.writeFile(workbook, fileName);
}

function ttExport(
  t: (key: string, options?: Record<string, unknown>) => string,
  key: string,
  defaultValue: string,
  options?: Record<string, unknown>
): string {
  return t(key, { defaultValue, ...options });
}

export function OpeningImportPage(): ReactElement {
  const { t } = useTranslation('common');
  const { data: permissions } = useMyPermissionsQuery();
  const canView =
    !AQUA_SPECIAL_PERMISSION_CODES.openingImport?.view ||
    hasPermission(permissions, AQUA_SPECIAL_PERMISSION_CODES.openingImport.view);
  const canCreate =
    !AQUA_SPECIAL_PERMISSION_CODES.openingImport?.create ||
    hasPermission(permissions, AQUA_SPECIAL_PERMISSION_CODES.openingImport.create);

  const tt = (key: string, defaultValue: string, options?: Record<string, unknown>): string =>
    t(key, { defaultValue, ...options });

  const [sourceSystem, setSourceSystem] = useState('Legacy ERP');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<ParsedImportSheet[]>([]);
  const [preview, setPreview] = useState<OpeningImportPreviewResponseDto | null>(null);
  const [commitResult, setCommitResult] = useState<OpeningImportCommitResultDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const parsedSheetMap = useMemo(
    () => Object.fromEntries(sheets.map((sheet) => [sheet.sheetName, sheet])) as Record<string, ParsedImportSheet>,
    [sheets]
  );

  if (!canView) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-sm text-slate-600">
        {tt('aqua.openingImport.noPermission', 'Bu ekranı görüntüleme yetkiniz yok.')}
      </div>
    );
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setSelectedFile(file);
      setPreview(null);
      setCommitResult(null);
      const parsed = await readWorkbook(file);
      setSheets(parsed);
      toast.success(tt('aqua.openingImport.toast.fileParsed', 'Excel dosyası okundu.'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tt('aqua.openingImport.toast.fileParseFailed', 'Excel dosyası okunamadı.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMappingChange = (sheetName: string, header: string, value: OpeningImportTargetField | ''): void => {
    setSheets((current) =>
      current.map((sheet) =>
        sheet.sheetName !== sheetName
          ? sheet
          : {
              ...sheet,
              mappings: {
                ...sheet.mappings,
                [header]: value,
              },
            }
      )
    );
  };

  const handlePreview = async (): Promise<void> => {
    if (!canCreate || !selectedFile || sheets.length === 0) return;

    try {
      setIsLoading(true);
      const response = await openingImportApi.preview({
        fileName: selectedFile.name,
        sourceSystem,
        sheets: sheets.map((sheet) => ({
          sheetName: sheet.sheetName,
          rows: sheet.rows,
          mappings: Object.entries(sheet.mappings)
            .filter(([, targetField]) => Boolean(targetField))
            .map(([sourceColumn, targetField]) => ({
              sourceColumn,
              targetField: targetField as string,
            })),
        })),
      });
      setPreview(response);
      setCommitResult(null);
      toast.success(tt('aqua.openingImport.toast.previewReady', 'Önizleme hazırlandı.'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tt('aqua.openingImport.toast.previewFailed', 'Önizleme alınamadı.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async (): Promise<void> => {
    if (!canCreate || !preview) return;

    try {
      setIsLoading(true);
      const result = await openingImportApi.commit(preview.jobId);
      setCommitResult(result);
      setPreview(await openingImportApi.getById(preview.jobId));
      toast.success(tt('aqua.openingImport.toast.commitSuccessful', 'İlk geçiş başarıyla içe aktarıldı.'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tt('aqua.openingImport.toast.commitFailed', 'İçe aktarma işlemi başarısız oldu.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200/70 bg-[linear-gradient(135deg,rgba(7,89,133,0.06),rgba(16,185,129,0.05),rgba(255,255,255,0.95))] p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge variant="outline" className="border-cyan-300 bg-cyan-50 text-cyan-700">
              {tt('aqua.openingImport.badge', 'İlk Geçiş')}
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {tt('aqua.openingImport.title', 'İlk Geçiş / Data Migration')}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              {tt(
                'aqua.openingImport.description',
                'Eski sistemdeki aktif proje, kafes ve açılış stok durumunu kontrollü şekilde içeri alın. Excel şablonu indirip doldurun, kolonları eşleyin, önizleyin ve hatasız ise tek adımda sisteme aktarın.'
              )}
            </p>
            <div className="max-w-4xl rounded-2xl border border-cyan-200/70 bg-cyan-50/80 px-4 py-3 text-xs leading-6 text-slate-700">
              {tt(
                'aqua.openingImport.cutoverModeHint',
                'Eğer sadece bugünkü net stokla başlayacaksan OpeningStock yeterlidir. Geçmiş özet mal kabul, fire, yemleme ve sevkiyat bilgisini de sisteme almak istersen ilgili açılış sheetlerini doldurabilirsin. OpeningStock boşsa sistem net açılış bakiyesini mal kabul ve fire özetlerinden türetir.'
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => downloadWorkbook(t, 'aqua-opening-import-template.xlsx', null)}>
              <Download className="mr-2 h-4 w-4" />
              {tt('aqua.openingImport.downloadTemplate', 'Şablon İndir')}
            </Button>
            {preview?.summary.errorRows ? (
              <Button type="button" variant="outline" onClick={() => downloadWorkbook(t, 'aqua-opening-import-errors.xlsx', null, preview)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {tt('aqua.openingImport.downloadErrors', "Hata Excel'i İndir")}
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="border-slate-200/70">
          <CardHeader>
            <CardTitle>{tt('aqua.openingImport.steps.uploadTitle', 'Dosya ve Kaynak Bilgisi')}</CardTitle>
            <CardDescription>{tt('aqua.openingImport.steps.uploadDescription', 'Şablonu indirip doldurduktan sonra Excel dosyasını seçin ve önizleme başlatın.')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr),220px]">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{tt('aqua.openingImport.sourceSystem', 'Kaynak Sistem')}</label>
                <Input value={sourceSystem} onChange={(event) => setSourceSystem(event.target.value)} placeholder="Legacy ERP" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{tt('aqua.openingImport.file', 'Excel Dosyası')}</label>
                <Input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm text-slate-600">
              {selectedFile ? (
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-slate-800">{selectedFile.name}</span>
                  <span className="text-slate-500">({Math.ceil(selectedFile.size / 1024)} KB)</span>
                </div>
              ) : (
                tt('aqua.openingImport.noFile', 'Henüz dosya seçilmedi.')
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" disabled={!selectedFile || isLoading || !canCreate} onClick={handlePreview}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                {tt('aqua.openingImport.preview', 'Önizle ve Doğrula')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!preview || preview.summary.errorRows > 0 || isLoading || !canCreate}
                onClick={handleCommit}
              >
                <DatabaseZap className="mr-2 h-4 w-4" />
                {tt('aqua.openingImport.commit', 'İçe Aktar')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/70">
          <CardHeader>
            <CardTitle>{tt('aqua.openingImport.summaryTitle', 'İş Özeti')}</CardTitle>
            <CardDescription>{tt('aqua.openingImport.summaryDescription', 'Önizleme sonrası satır bazlı validasyon sonuçları burada görünür.')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[
              { label: tt('aqua.openingImport.summary.totalRows', 'Toplam Satır'), value: preview?.summary.totalRows ?? 0, icon: FileSpreadsheet, tint: 'text-slate-700' },
              { label: tt('aqua.openingImport.summary.validRows', 'Geçerli Satır'), value: preview?.summary.validRows ?? 0, icon: CheckCircle2, tint: 'text-emerald-600' },
              { label: tt('aqua.openingImport.summary.warningRows', 'Uyarılı Satır'), value: preview?.summary.warningRows ?? 0, icon: AlertTriangle, tint: 'text-amber-600' },
              { label: tt('aqua.openingImport.summary.errorRows', 'Hatalı Satır'), value: preview?.summary.errorRows ?? 0, icon: AlertTriangle, tint: 'text-rose-600' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 ${item.tint}`} />
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{item.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/70">
        <CardHeader>
          <CardTitle>{tt('aqua.openingImport.mappingTitle', 'Kolon Eşleme')}</CardTitle>
          <CardDescription>{tt('aqua.openingImport.mappingDescription', 'Excel kolonlarını sistem alanlarına eşleyin. Zorunlu alanlar boş bırakılmamalıdır.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {SHEET_DEFINITIONS.map((definition) => {
            const sheet = parsedSheetMap[definition.sheetName];
            return (
              <div key={definition.sheetName} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{getSheetTitle(t, definition.titleKey)}</h3>
                    <p className="text-sm text-slate-500">
                      {tt('aqua.openingImport.sheetStats', '{{headers}} kolon, {{rows}} satır', { headers: sheet?.headers.length ?? 0, rows: sheet?.rows.length ?? 0 })}
                    </p>
                  </div>
                  <Badge variant="outline">{getSheetTitle(t, definition.sheetName)}</Badge>
                </div>

                {sheet?.headers.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tt('aqua.openingImport.sourceColumn', 'Excel Kolonu')}</TableHead>
                        <TableHead>{tt('aqua.openingImport.targetField', 'Sistem Alanı')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sheet.headers.map((header) => (
                        <TableRow key={`${definition.sheetName}-${header}`}>
                          <TableCell className="font-medium text-slate-700">{header}</TableCell>
                          <TableCell className="w-[260px]">
                            <Select
                              value={sheet.mappings[header] || '__none__'}
                              onValueChange={(value) => handleMappingChange(definition.sheetName, header, value === '__none__' ? '' : (value as OpeningImportTargetField))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">{tt('aqua.openingImport.ignoreColumn', 'Bu kolonu yoksay')}</SelectItem>
                                {definition.targets.map((target) => (
                                  <SelectItem key={target.field} value={target.field}>
                                    {getFieldLabel(t, target.label)}{target.required ? ' *' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    {tt('aqua.openingImport.sheetMissing', 'Bu sheet dosyada bulunamadı ya da boş.')}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {preview ? (
        <Card className="border-slate-200/70">
          <CardHeader>
            <CardTitle>{tt('aqua.openingImport.previewTitle', 'Önizleme Sonuçları')}</CardTitle>
            <CardDescription>{tt('aqua.openingImport.previewDescription', 'İş #{{jobId}} için durum: {{status}}', { jobId: preview.jobId, status: preview.status })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {SHEET_DEFINITIONS.map((definition) => {
              const rows = preview.rows.filter((row) => row.sheetName === definition.sheetName);
              if (rows.length === 0) return null;

              return (
                <div key={`preview-${definition.sheetName}`} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-900">{getSheetTitle(t, definition.titleKey)}</h3>
                    <Badge variant="outline">{rows.length}</Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>{tt('aqua.openingImport.status', 'Durum')}</TableHead>
                        <TableHead>{tt('aqua.openingImport.messages', 'Mesajlar')}</TableHead>
                        <TableHead>{tt('aqua.openingImport.normalizedData', 'Normalize Veri')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.rowId}>
                          <TableCell>{row.rowNumber}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                row.status === 'Valid'
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                  : row.status === 'Applied'
                                    ? 'border-cyan-300 bg-cyan-50 text-cyan-700'
                                    : 'border-rose-300 bg-rose-50 text-rose-700'
                              }
                            >
                              {getPreviewStatusLabel(t, row.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[360px] whitespace-normal text-sm text-slate-600">
                            {row.messages.length ? row.messages.join(' | ') : tt('aqua.openingImport.noIssues', 'Sorun yok')}
                          </TableCell>
                          <TableCell className="max-w-[360px] whitespace-normal text-xs text-slate-500">
                            {Object.entries(row.normalizedData)
                              .filter(([, value]) => value != null && String(value).trim().length > 0)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(' | ')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {commitResult ? (
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardHeader>
            <CardTitle>{tt('aqua.openingImport.commitResultTitle', 'İçe Aktarım Sonucu')}</CardTitle>
            <CardDescription>{tt('aqua.openingImport.commitResultDescription', 'İlk geçiş başarıyla işlendi. Oluşan kayıt özetini aşağıda görebilirsiniz.')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['createdProjects', commitResult.createdProjects, 'Oluşturulan Proje'],
              ['createdCages', commitResult.createdCages, 'Oluşturulan Kafes'],
              ['createdProjectCages', commitResult.createdProjectCages, 'Oluşturulan Proje-Kafes'],
              ['createdFishBatches', commitResult.createdFishBatches, 'Oluşturulan Batch'],
              ['createdGoodsReceipts', commitResult.createdGoodsReceipts, 'Oluşturulan Özet Mal Kabul'],
              ['createdFeedingHeaders', commitResult.createdFeedingHeaders, 'Oluşturulan Özet Yemleme'],
              ['createdGoodsReceiptLines', commitResult.createdGoodsReceiptLines, 'Oluşturulan Mal Kabul Satırı'],
              ['createdFeedingLines', commitResult.createdFeedingLines, 'Oluşturulan Yemleme Satırı'],
              ['createdFeedingDistributions', commitResult.createdFeedingDistributions, 'Oluşturulan Yemleme Dağılımı'],
              ['createdMortalityHeaders', commitResult.createdMortalityHeaders, 'Oluşturulan Özet Fire Belgesi'],
              ['createdMortalityLines', commitResult.createdMortalityLines, 'Oluşturulan Fire Satırı'],
              ['createdShipmentHeaders', commitResult.createdShipmentHeaders, 'Oluşturulan Özet Sevkiyat Belgesi'],
              ['createdShipmentLines', commitResult.createdShipmentLines, 'Oluşturulan Sevkiyat Satırı'],
              ['appliedCageRows', commitResult.appliedCageRows, 'Kafese Yazılan Satır'],
              ['appliedWarehouseRows', commitResult.appliedWarehouseRows, 'Depoya Yazılan Satır'],
              ['skippedRows', commitResult.skippedRows, 'Atlanan Satır'],
            ].map(([key, value, fallback]) => (
              <div key={String(key)} className="rounded-2xl border border-emerald-200 bg-white p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-emerald-700">{tt(`aqua.openingImport.commitSummary.${String(key)}`, String(fallback))}</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
