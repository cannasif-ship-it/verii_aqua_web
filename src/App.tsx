import { lazy, Suspense, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { initializeGlobalHorizontalDragScroll } from './hooks/useGlobalHorizontalDragScroll';
import './App.css';

const Toaster = lazy(async () => {
  const module = await import('./components/ui/sonner');
  return { default: module.Toaster };
});

function App() {
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | null = null;
    let idleCallbackId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const start = () => {
      if (disposed) return;
      cleanup = initializeGlobalHorizontalDragScroll();
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleCallbackId = window.requestIdleCallback(start, { timeout: 1200 });
    } else {
      timeoutId = globalThis.setTimeout(start, 350);
    }

    return () => {
      disposed = true;
      if (idleCallbackId != null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
      if (timeoutId != null) {
        globalThis.clearTimeout(timeoutId);
      }
      cleanup?.();
    };
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Suspense fallback={null}>
        <Toaster />
      </Suspense>
    </>
  );
}

export default App;
