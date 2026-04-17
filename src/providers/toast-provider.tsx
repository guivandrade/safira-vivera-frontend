'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/cn';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration: number;
}

interface ToastApi {
  success: (message: string, opts?: { title?: string; duration?: number }) => void;
  error: (message: string, opts?: { title?: string; duration?: number }) => void;
  info: (message: string, opts?: { title?: string; duration?: number }) => void;
  warning: (message: string, opts?: { title?: string; duration?: number }) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

const DEFAULT_DURATION = 4200;
const MAX_STACK = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string, opts?: { title?: string; duration?: number }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const duration = opts?.duration ?? DEFAULT_DURATION;
      const item: ToastItem = { id, variant, title: opts?.title, message, duration };
      setItems((prev) => [...prev.slice(-MAX_STACK + 1), item]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const timersMap = timers.current;
    return () => {
      timersMap.forEach((t) => clearTimeout(t));
      timersMap.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (msg, opts) => push('success', msg, opts),
      error: (msg, opts) => push('error', msg, opts),
      info: (msg, opts) => push('info', msg, opts),
      warning: (msg, opts) => push('warning', msg, opts),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

function ToastContainer({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2 sm:max-w-sm"
    >
      {items.map((item) => (
        <Toast key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
      ))}
    </div>
  );
}

const variantStyles: Record<ToastVariant, { dot: string; icon: ReactNode }> = {
  success: {
    dot: 'bg-success',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-success" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
  error: {
    dot: 'bg-danger',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-danger" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6M9 9l6 6" />
      </svg>
    ),
  },
  warning: {
    dot: 'bg-warning',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-warning" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  info: {
    dot: 'bg-accent',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-accent" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
};

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const style = variantStyles[item.variant];
  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-lg border border-line bg-surface px-3.5 py-3 shadow-lg',
        'animate-[slide-in_180ms_ease-out]',
      )}
      style={{
        animation: 'toast-in 180ms ease-out',
      }}
    >
      <span className="mt-0.5 shrink-0">{style.icon}</span>
      <div className="min-w-0 flex-1">
        {item.title && <p className="text-sm font-semibold text-ink">{item.title}</p>}
        <p className={cn('text-sm text-ink', item.title && 'mt-0.5 text-ink-muted')}>
          {item.message}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar"
        className="shrink-0 text-ink-subtle hover:text-ink"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
