import { projectDetailReportApi } from './project-detail-report-api';

export interface DevirFcrProjectOption {
  id: number;
  projectCode?: string;
  projectName?: string;
}

export interface DevirFcrRow {
  projectId: number;
  projectCode: string;
  projectName: string;
  openingFishCount: number;
  shipmentFishCount: number;
  mortalityFishCount: number;
  mortalityPct: number | null;
  endingFishCount: number;
  endingAverageGram: number;
  openingBiomassKg: number;
  endingBiomassKg: number;
  shippedBiomassKg: number;
  mortalityBiomassKg: number;
  totalFeedKg: number;
  producedBiomassKg: number;
  fcr: number | null;
}

export interface DevirFcrReport {
  fromDate: string;
  toDate: string;
  rows: DevirFcrRow[];
  totals: Omit<DevirFcrRow, 'projectId' | 'projectCode' | 'projectName'> & {
    projectCode: string;
    projectName: string;
  };
}

function round(value: number): number {
  return Number(value.toFixed(3));
}

function clampDate(value: string): string {
  return value.slice(0, 10);
}

function isWithinRange(date: string, fromDate: string, toDate: string): boolean {
  return date >= fromDate && date <= toDate;
}

function buildRow(detail: Awaited<ReturnType<typeof projectDetailReportApi.getProjectDetailReport>>, fromDate: string, toDate: string): DevirFcrRow {
  const aggregates = detail.cages.reduce(
    (acc, cage) => {
      const openingCount = cage.initialFishCount + cage.dailyRows
        .filter((row) => row.date < fromDate)
        .reduce((sum, row) => sum + row.countDelta, 0);
      const endingCount = cage.initialFishCount + cage.dailyRows
        .filter((row) => row.date <= toDate)
        .reduce((sum, row) => sum + row.countDelta, 0);

      const openingBiomassGram = cage.initialBiomassGram + cage.dailyRows
        .filter((row) => row.date < fromDate)
        .reduce((sum, row) => sum + row.biomassDelta, 0);
      const endingBiomassGram = cage.initialBiomassGram + cage.dailyRows
        .filter((row) => row.date <= toDate)
        .reduce((sum, row) => sum + row.biomassDelta, 0);

      const inRangeRows = cage.dailyRows.filter((row) => isWithinRange(row.date, fromDate, toDate));
      const shipmentFishCount = inRangeRows.reduce((sum, row) => sum + row.shipmentFishCount, 0);
      const shipmentBiomassGram = inRangeRows.reduce((sum, row) => sum + row.shipmentBiomassGram, 0);
      const mortalityFishCount = inRangeRows.reduce((sum, row) => sum + row.deadCount, 0);
      const mortalityBiomassGram = inRangeRows.reduce((sum, row) => sum + row.deadBiomassGram, 0);
      const totalFeedGram = inRangeRows.reduce((sum, row) => sum + row.feedGram, 0);

      acc.openingFishCount += openingCount;
      acc.endingFishCount += endingCount;
      acc.openingBiomassGram += openingBiomassGram;
      acc.endingBiomassGram += endingBiomassGram;
      acc.shipmentFishCount += shipmentFishCount;
      acc.shippedBiomassGram += shipmentBiomassGram;
      acc.mortalityFishCount += mortalityFishCount;
      acc.mortalityBiomassGram += mortalityBiomassGram;
      acc.totalFeedGram += totalFeedGram;
      return acc;
    },
    {
      openingFishCount: 0,
      endingFishCount: 0,
      openingBiomassGram: 0,
      endingBiomassGram: 0,
      shipmentFishCount: 0,
      shippedBiomassGram: 0,
      mortalityFishCount: 0,
      mortalityBiomassGram: 0,
      totalFeedGram: 0,
    }
  );

  const openingBiomassKg = Math.max(0, aggregates.openingBiomassGram / 1000);
  const endingBiomassKg = Math.max(0, aggregates.endingBiomassGram / 1000);
  const shippedBiomassKg = Math.max(0, aggregates.shippedBiomassGram / 1000);
  const mortalityBiomassKg = Math.max(0, aggregates.mortalityBiomassGram / 1000);
  const totalFeedKg = Math.max(0, aggregates.totalFeedGram / 1000);
  const producedBiomassKg = Math.max(0, endingBiomassKg + shippedBiomassKg - openingBiomassKg);
  const endingAverageGram =
    aggregates.endingFishCount > 0 ? round(aggregates.endingBiomassGram / aggregates.endingFishCount) : 0;
  const mortalityPct =
    aggregates.openingFishCount > 0 ? round((aggregates.mortalityFishCount / aggregates.openingFishCount) * 100) : null;
  const fcr = producedBiomassKg > 0 ? round(totalFeedKg / producedBiomassKg) : null;

  return {
    projectId: detail.project.id,
    projectCode: detail.project.projectCode?.trim() || String(detail.project.id),
    projectName: detail.project.projectName?.trim() || '-',
    openingFishCount: Math.max(0, Math.round(aggregates.openingFishCount)),
    shipmentFishCount: Math.max(0, Math.round(aggregates.shipmentFishCount)),
    mortalityFishCount: Math.max(0, Math.round(aggregates.mortalityFishCount)),
    mortalityPct,
    endingFishCount: Math.max(0, Math.round(aggregates.endingFishCount)),
    endingAverageGram,
    openingBiomassKg: round(openingBiomassKg),
    endingBiomassKg: round(endingBiomassKg),
    shippedBiomassKg: round(shippedBiomassKg),
    mortalityBiomassKg: round(mortalityBiomassKg),
    totalFeedKg: round(totalFeedKg),
    producedBiomassKg: round(producedBiomassKg),
    fcr,
  };
}

export const devirFcrApi = {
  getProjects: async (): Promise<DevirFcrProjectOption[]> => projectDetailReportApi.getProjects(),

  getReport: async (projectIds: number[], fromDate: string, toDate: string): Promise<DevirFcrReport> => {
    const safeFromDate = clampDate(fromDate);
    const safeToDate = clampDate(toDate);
    const details = await projectDetailReportApi.getProjectDetailReports(projectIds);
    const rows = details
      .map((detail) => buildRow(detail, safeFromDate, safeToDate))
      .sort((a, b) => a.projectCode.localeCompare(b.projectCode, 'tr'));

    const totalsBase = rows.reduce(
      (acc, row) => {
        acc.openingFishCount += row.openingFishCount;
        acc.shipmentFishCount += row.shipmentFishCount;
        acc.mortalityFishCount += row.mortalityFishCount;
        acc.endingFishCount += row.endingFishCount;
        acc.openingBiomassKg += row.openingBiomassKg;
        acc.endingBiomassKg += row.endingBiomassKg;
        acc.shippedBiomassKg += row.shippedBiomassKg;
        acc.mortalityBiomassKg += row.mortalityBiomassKg;
        acc.totalFeedKg += row.totalFeedKg;
        acc.producedBiomassKg += row.producedBiomassKg;
        return acc;
      },
      {
        openingFishCount: 0,
        shipmentFishCount: 0,
        mortalityFishCount: 0,
        endingFishCount: 0,
        openingBiomassKg: 0,
        endingBiomassKg: 0,
        shippedBiomassKg: 0,
        mortalityBiomassKg: 0,
        totalFeedKg: 0,
        producedBiomassKg: 0,
      }
    );

    const totalsMortalityPct =
      totalsBase.openingFishCount > 0 ? round((totalsBase.mortalityFishCount / totalsBase.openingFishCount) * 100) : null;
    const totalsEndingAverageGram =
      totalsBase.endingFishCount > 0 ? round((totalsBase.endingBiomassKg * 1000) / totalsBase.endingFishCount) : 0;
    const totalsFcr = totalsBase.producedBiomassKg > 0 ? round(totalsBase.totalFeedKg / totalsBase.producedBiomassKg) : null;

    return {
      fromDate: safeFromDate,
      toDate: safeToDate,
      rows,
      totals: {
        projectCode: 'TOPLAM',
        projectName: '',
        openingFishCount: Math.round(totalsBase.openingFishCount),
        shipmentFishCount: Math.round(totalsBase.shipmentFishCount),
        mortalityFishCount: Math.round(totalsBase.mortalityFishCount),
        mortalityPct: totalsMortalityPct,
        endingFishCount: Math.round(totalsBase.endingFishCount),
        endingAverageGram: totalsEndingAverageGram,
        openingBiomassKg: round(totalsBase.openingBiomassKg),
        endingBiomassKg: round(totalsBase.endingBiomassKg),
        shippedBiomassKg: round(totalsBase.shippedBiomassKg),
        mortalityBiomassKg: round(totalsBase.mortalityBiomassKg),
        totalFeedKg: round(totalsBase.totalFeedKg),
        producedBiomassKg: round(totalsBase.producedBiomassKg),
        fcr: totalsFcr,
      },
    };
  },
};
