/**
 * Radix UI (Popover, Select, Dialog) kapanışında bazen `document.body` üzerinde
 * `pointer-events: none`, `overflow: hidden` veya `data-scroll-locked` kalabiliyor.
 * Bu durumda sidebar / menü linklerine tıklanmaz; uygulama donmuş gibi hissedilir.
 */
export function releaseRadixBodyPointerAndScrollLock(): void {
  if (typeof document === 'undefined') return;
  document.body.style.removeProperty('pointer-events');
  document.body.style.removeProperty('overflow');
  document.body.removeAttribute('data-scroll-locked');
}
