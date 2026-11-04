'use client';
import { createContext, useCallback, useEffect, useRef } from 'react';

export const RevealAll = createContext(false);

const AUTOSCROLL_CLASS = 'is-invitation-autoscrolling';
const FRAME_MS = 1000 / 60;
const DEFAULT_SPEED = 0.9; // px per 60fps frame (~54px/s)
const MAX_DT = 40;
const REMEASURE_INTERVAL = 1000;
const BOTTOM_EPSILON = 1.5;
const USER_SCROLL_DRIFT = 8;
const TOUCH_SLOP = 12;
const TAP_MAX_MS = 800;

/**
 * Scroll Reveal giống hệt `useInvitationMusic` (Ha) của TN13 gốc:
 * - Quan sát `.reveal` và `.reveal-piece` trong container
 * - Thêm `.is-visible` và `data-reveal-visible="true"` khi cuộn tới
 */
export function useScrollReveal(containerRef: React.RefObject<HTMLElement | null>, enabled: boolean, revealAll = false) {
  const refresh = useCallback(() => {
    const root = containerRef.current;
    if (!root) return () => {};

    const show = (el: Element) => {
      if (el instanceof HTMLElement) el.dataset.revealVisible = 'true';
      el.classList.add('is-visible');
    };

    const reveals = Array.from(root.querySelectorAll('.reveal'));
    const pieces = Array.from(root.querySelectorAll('.reveal-piece'));

    if (revealAll) {
      reveals.forEach(show);
      pieces.forEach(show);
      return () => {};
    }

    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window) || reduced) {
      reveals.forEach(show);
      pieces.forEach(show);
      return () => {};
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            show(entry.target);
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.04 },
    );

    let batchRaf = 0;
    let batchQueue: Element[] = [];
    const flushBatch = () => {
      batchQueue.forEach((el, idx) => {
        window.setTimeout(() => {
          show(el);
          pieceObserver.unobserve(el);
        }, idx * 60);
      });
      batchQueue = [];
      batchRaf = 0;
    };

    const pieceObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) batchQueue.push(entry.target);
        });
        if (batchQueue.length && !batchRaf) {
          batchRaf = window.requestAnimationFrame(flushBatch);
        }
      },
      { rootMargin: '0px 280px -30% 280px', threshold: 0.01 },
    );

    const vh = window.innerHeight;
    reveals.forEach((el) => {
      if (el.classList.contains('is-visible')) return;
      const { top, bottom } = el.getBoundingClientRect();
      if (bottom <= 0 || (top < vh * 0.95 && bottom > 0)) show(el);
      else revealObserver.observe(el);
    });

    pieces.forEach((el) => {
      if (el.classList.contains('is-visible')) return;
      const { top, bottom } = el.getBoundingClientRect();
      if (bottom <= 0 || (top >= 0 && top < vh * 0.7)) show(el);
      else pieceObserver.observe(el);
    });

    const onScrollBottom = () => {
      const scrolled = window.scrollY + window.innerHeight;
      if (document.documentElement.scrollHeight - scrolled <= 120) {
        let delay = 0;
        for (const el of pieces) {
          if (!el.classList.contains('is-visible')) {
            window.setTimeout(() => {
              show(el);
              pieceObserver.unobserve(el);
            }, delay);
            delay += 40;
          }
        }
        window.removeEventListener('scroll', onScrollBottom);
      }
    };
    window.addEventListener('scroll', onScrollBottom, { passive: true });

    return () => {
      revealObserver.disconnect();
      pieceObserver.disconnect();
      if (batchRaf) window.cancelAnimationFrame(batchRaf);
      window.removeEventListener('scroll', onScrollBottom);
    };
  }, [containerRef, revealAll]);

  useEffect(() => {
    if (!enabled) return;
    return refresh();
  }, [enabled, refresh]);

  return { refreshScrollReveal: refresh };
}

/**
 * Auto-Scroll giống hệt `useInvitationMusic` (Pa) của TN13 gốc:
 * - Bắt đầu cuộn mượt sau khi mở thiệp (`startAutoScroll(900)`)
 * - Dừng khi khách lăn chuột (`wheel`), vuốt (`touchmove`), bấm phím (`keydown`), hoặc chạm đến cuối trang
 * - Click/tap vào vùng trống trên trang sẽ bật/tắt auto-scroll (trừ khi click vào `button, a, input, textarea, select, [data-no-autoscroll-toggle]`)
 * - Gắn class `html.is-invitation-autoscrolling` khi đang cuộn
 */
export function useAutoScroll({ disabled }: { disabled: () => boolean }) {
  const activeRef = useRef(false);
  const rafRef = useRef(0);
  const timerRef = useRef(0);
  const measureRafRef = useRef(0);
  const roRef = useRef<ResizeObserver | null>(null);
  const maxScrollRef = useRef(0);
  const lastMeasureRef = useRef(0);
  const lastFrameRef = useRef(0);
  const expectedPosRef = useRef(0);
  const ignoreClickUntilRef = useRef(0);
  const touchStateRef = useRef<{ x: number; y: number; target: EventTarget | null; time: number; moved: boolean } | null>(null);
  const disabledFnRef = useRef(disabled);
  disabledFnRef.current = disabled;

  const setHtmlClass = useCallback((on: boolean) => {
    if (typeof document === 'undefined' || !document.documentElement) return;
    if (on) document.documentElement.classList.add(AUTOSCROLL_CLASS);
    else document.documentElement.classList.remove(AUTOSCROLL_CLASS);
  }, []);

  const getScroller = () => (typeof document === 'undefined' ? null : document.scrollingElement || document.documentElement);

  const getScrollY = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return 0;
    const s = getScroller();
    return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || (s ? s.scrollTop : 0) || 0;
  };

  const setScrollY = (y: number) => {
    const s = getScroller();
    if (s) s.scrollTop = y;
    window.scrollTo(0, y);
  };

  const measure = useCallback((now = performance.now()) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const s = getScroller();
    if (s) {
      maxScrollRef.current = Math.max(0, s.scrollHeight - window.innerHeight);
      lastMeasureRef.current = now;
    }
  }, []);

  const pauseAutoScroll = useCallback(() => {
    activeRef.current = false;
    setHtmlClass(false);
    if (typeof window !== 'undefined') {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = 0;
      }
      if (measureRafRef.current) {
        window.cancelAnimationFrame(measureRafRef.current);
        measureRafRef.current = 0;
      }
    }
    lastFrameRef.current = 0;
    expectedPosRef.current = 0;
  }, [setHtmlClass]);

  const step = useCallback(
    function tick(now: number) {
      if (typeof window === 'undefined' || !activeRef.current || disabledFnRef.current()) {
        pauseAutoScroll();
        return;
      }
      const cur = getScrollY();
      if (lastFrameRef.current && Math.abs(cur - expectedPosRef.current) > USER_SCROLL_DRIFT) {
        pauseAutoScroll();
        return;
      }
      if (cur >= maxScrollRef.current - BOTTOM_EPSILON) {
        measure(now);
        if (cur >= maxScrollRef.current - BOTTOM_EPSILON) {
          pauseAutoScroll();
          return;
        }
      }
      if (!lastMeasureRef.current || now - lastMeasureRef.current > REMEASURE_INTERVAL) {
        measure(now);
      }
      if (!lastFrameRef.current) {
        lastFrameRef.current = now;
        expectedPosRef.current = cur;
      }
      const dt = Math.min(Math.max(now - lastFrameRef.current, 0), MAX_DT);
      lastFrameRef.current = now;
      const pxPerSec = DEFAULT_SPEED * (1000 / FRAME_MS);
      const delta = pxPerSec * (dt / 1000);
      if (delta > 0) {
        expectedPosRef.current = Math.max(expectedPosRef.current, cur);
        expectedPosRef.current = Math.min(expectedPosRef.current + delta, maxScrollRef.current);
        setScrollY(expectedPosRef.current);
      }
      rafRef.current = window.requestAnimationFrame(tick);
    },
    [measure, pauseAutoScroll],
  );

  const startAutoScroll = useCallback(
    (delayMs = 0) => {
      if (typeof window === 'undefined' || disabledFnRef.current()) return;
      pauseAutoScroll();
      const begin = () => {
        if (disabledFnRef.current()) return;
        measure();
        lastFrameRef.current = 0;
        expectedPosRef.current = getScrollY();
        activeRef.current = true;
        setHtmlClass(true);
        rafRef.current = window.requestAnimationFrame(step);
      };
      if (delayMs > 0) {
        timerRef.current = window.setTimeout(begin, delayMs);
      } else {
        begin();
      }
    },
    [measure, pauseAutoScroll, setHtmlClass, step],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isInteractiveTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return Boolean(target.closest('button,a,input,textarea,select,[data-no-autoscroll-toggle]'));
    };

    const toggle = () => {
      if (activeRef.current) pauseAutoScroll();
      else startAutoScroll(0);
    };

    const onClick = (e: MouseEvent) => {
      if (Date.now() < ignoreClickUntilRef.current || disabledFnRef.current() || isInteractiveTarget(e.target)) return;
      toggle();
    };

    const onStop = () => {
      if (activeRef.current) pauseAutoScroll();
    };

    const getTouchPoint = (e: TouchEvent) => {
      const t = e.changedTouches?.[0] || e.touches?.[0];
      return t ? { x: t.clientX, y: t.clientY } : null;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (disabledFnRef.current() || isInteractiveTarget(e.target)) {
        touchStateRef.current = null;
        return;
      }
      const pt = getTouchPoint(e);
      touchStateRef.current = pt ? { ...pt, target: e.target, time: Date.now(), moved: false } : null;
    };

    const onTouchMove = (e: TouchEvent) => {
      onStop();
      const st = touchStateRef.current;
      if (!st) return;
      const pt = getTouchPoint(e);
      if (!pt) return;
      if (Math.abs(pt.x - st.x) > TOUCH_SLOP || Math.abs(pt.y - st.y) > TOUCH_SLOP) {
        st.moved = true;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const st = touchStateRef.current;
      touchStateRef.current = null;
      if (disabledFnRef.current() || !st) return;
      if (isInteractiveTarget(e.target) || isInteractiveTarget(st.target)) return;
      const pt = getTouchPoint(e) || st;
      const dx = Math.abs(pt.x - st.x);
      const dy = Math.abs(pt.y - st.y);
      if (!st.moved && dx <= TOUCH_SLOP && dy <= TOUCH_SLOP && Date.now() - st.time <= TAP_MAX_MS) {
        ignoreClickUntilRef.current = Date.now() + 700;
        toggle();
      } else {
        ignoreClickUntilRef.current = Date.now() + 500;
      }
    };

    const onTouchCancel = () => {
      touchStateRef.current = null;
    };

    const scheduleMeasure = () => {
      if (!measureRafRef.current) {
        measureRafRef.current = window.requestAnimationFrame((now) => {
          measureRafRef.current = 0;
          measure(now);
        });
      }
    };

    window.addEventListener('click', onClick);
    window.addEventListener('wheel', onStop, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchCancel, { passive: true });
    window.addEventListener('keydown', onStop);
    window.addEventListener('resize', scheduleMeasure, { passive: true });
    window.addEventListener('orientationchange', scheduleMeasure, { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(scheduleMeasure);
      roRef.current = ro;
      const observed = new Set<Element>();
      [document.documentElement, document.body, getScroller()].forEach((el) => {
        if (el && !observed.has(el)) {
          observed.add(el);
          ro.observe(el);
        }
      });
    }

    return () => {
      window.removeEventListener('click', onClick);
      window.removeEventListener('wheel', onStop);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
      window.removeEventListener('keydown', onStop);
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('orientationchange', scheduleMeasure);
      roRef.current?.disconnect();
      roRef.current = null;
      pauseAutoScroll();
    };
  }, [measure, pauseAutoScroll, startAutoScroll]);

  return { startAutoScroll, pauseAutoScroll };
}
