import { useEffect } from 'react';

const INTERACTIVE_SELECTOR =
  'a,button,input,select,textarea,label,[role="button"],[role="link"],[contenteditable="true"],[data-no-drag-scroll="true"]';
const SCROLLABLE_SELECTOR = '[class*="overflow-x-"], [data-hdrag-scroll="true"]';

function isHorizontalScrollable(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  const overflowX = style.overflowX;
  const isOverflowScrollable = overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'overlay';
  return isOverflowScrollable && element.scrollWidth > element.clientWidth + 1;
}

function findDragContainer(start: EventTarget | null): HTMLElement | null {
  if (!(start instanceof HTMLElement)) return null;
  if (start.closest(INTERACTIVE_SELECTOR)) return null;

  let node: HTMLElement | null = start;
  while (node && node !== document.body) {
    if (node.dataset.hdragScroll === 'true') {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

export function useGlobalHorizontalDragScroll(): void {
  useEffect(() => {
    let animationFrameId: number | null = null;
    let activeContainer: HTMLElement | null = null;
    let startX = 0;
    let startScrollLeft = 0;
    let moved = false;
    let suppressClick = false;

    const refreshContainers = (): void => {
      const nodes = document.querySelectorAll<HTMLElement>(SCROLLABLE_SELECTOR);
      nodes.forEach((node) => {
        if (isHorizontalScrollable(node)) {
          node.dataset.hdragScroll = 'true';
        } else if (!node.hasAttribute('data-hdrag-scroll-force')) {
          delete node.dataset.hdragScroll;
          node.classList.remove('hdrag-scroll-dragging');
        }
      });
    };

    const scheduleRefresh = (): void => {
      if (animationFrameId != null) return;
      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null;
        refreshContainers();
      });
    };

    const handleMouseDown = (event: MouseEvent): void => {
      if (event.button !== 0) return;
      const container = findDragContainer(event.target);
      if (!container) return;

      activeContainer = container;
      startX = event.clientX;
      startScrollLeft = container.scrollLeft;
      moved = false;
      container.classList.add('hdrag-scroll-dragging');
    };

    const handleMouseMove = (event: MouseEvent): void => {
      if (!activeContainer) return;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 3) {
        moved = true;
        suppressClick = true;
      }
      activeContainer.scrollLeft = startScrollLeft - delta;
      event.preventDefault();
    };

    const clearDragState = (): void => {
      if (activeContainer) {
        activeContainer.classList.remove('hdrag-scroll-dragging');
      }
      activeContainer = null;
      moved = false;
    };

    const handleMouseUp = (): void => {
      clearDragState();
      if (suppressClick) {
        window.setTimeout(() => {
          suppressClick = false;
        }, 0);
      }
    };

    const handleClickCapture = (event: MouseEvent): void => {
      if (!suppressClick || !moved) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    };

    const observer = new MutationObserver(scheduleRefresh);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    window.addEventListener('resize', scheduleRefresh, { passive: true });
    document.addEventListener('mousedown', handleMouseDown, { capture: true });
    document.addEventListener('mousemove', handleMouseMove, { capture: true });
    document.addEventListener('mouseup', handleMouseUp, { capture: true });
    document.addEventListener('mouseleave', handleMouseUp, { capture: true });
    document.addEventListener('click', handleClickCapture, { capture: true });

    refreshContainers();

    return () => {
      observer.disconnect();
      if (animationFrameId != null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('resize', scheduleRefresh);
      document.removeEventListener('mousedown', handleMouseDown, { capture: true });
      document.removeEventListener('mousemove', handleMouseMove, { capture: true });
      document.removeEventListener('mouseup', handleMouseUp, { capture: true });
      document.removeEventListener('mouseleave', handleMouseUp, { capture: true });
      document.removeEventListener('click', handleClickCapture, { capture: true });
    };
  }, []);
}
