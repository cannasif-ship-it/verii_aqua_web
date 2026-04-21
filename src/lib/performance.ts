const isPerformanceApiAvailable =
  typeof window !== 'undefined' &&
  typeof window.performance !== 'undefined' &&
  typeof window.performance.mark === 'function' &&
  typeof window.performance.measure === 'function';

function clearMeasureArtifacts(startMark: string, endMark: string, measureName: string): void {
  if (!isPerformanceApiAvailable) return;
  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(measureName);
}

export function markPerformanceStart(name: string): string {
  const startMark = `${name}:start`;
  if (isPerformanceApiAvailable) {
    performance.mark(startMark);
  }
  return startMark;
}

export function markPerformanceEnd(name: string, startMark = `${name}:start`): number | null {
  const endMark = `${name}:end`;
  if (!isPerformanceApiAvailable) return null;

  performance.mark(endMark);
  performance.measure(name, startMark, endMark);
  const entries = performance.getEntriesByName(name, 'measure');
  const duration = entries.length > 0 ? entries[entries.length - 1]?.duration ?? null : null;

  if (import.meta.env.DEV && duration != null) {
    console.info(`[perf] ${name}: ${duration.toFixed(2)} ms`);
  }

  clearMeasureArtifacts(startMark, endMark, name);
  return duration;
}

export function measureAsync<T>(name: string, task: () => Promise<T>): Promise<T> {
  const startMark = markPerformanceStart(name);
  return task().finally(() => {
    markPerformanceEnd(name, startMark);
  });
}
