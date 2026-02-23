export function formatFeedingNo(): string {
  return `F-${Date.now()}`;
}

export function formatMortalityNo(): string {
  return `M-${Date.now()}`;
}

export function formatNetOperationNo(): string {
  return `N-${Date.now()}`;
}

export function formatTransferNo(): string {
  return `T-${Date.now()}`;
}

export function formatStockConvertNo(): string {
  return `SC-${Date.now()}`;
}

export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function localDateTimeString(d: Date = new Date()): string {
  const datePart = localDateString(d);
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${datePart}T${h}:${min}:${s}`;
}
