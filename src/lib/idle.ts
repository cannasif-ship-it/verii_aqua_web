type IdleCallbackHandle = number;

type IdleDeadlineLike = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

type IdleCallbackFn = (deadline: IdleDeadlineLike) => void;

const hasRequestIdleCallback =
  typeof window !== 'undefined' &&
  'requestIdleCallback' in window &&
  typeof window.requestIdleCallback === 'function';

export function scheduleIdleCallback(callback: IdleCallbackFn, timeout = 800): IdleCallbackHandle {
  if (hasRequestIdleCallback) {
    return window.requestIdleCallback(callback, { timeout });
  }

  return window.setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 0,
    });
  }, 200);
}

export function cancelIdleCallbackSafe(handle: IdleCallbackHandle): void {
  if (hasRequestIdleCallback && typeof window.cancelIdleCallback === 'function') {
    window.cancelIdleCallback(handle);
    return;
  }

  window.clearTimeout(handle);
}
