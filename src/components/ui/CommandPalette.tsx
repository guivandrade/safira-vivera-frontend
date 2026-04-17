'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useFiltersStore } from '@/stores/filters-store';
import { useTheme } from '@/providers/theme-provider';

interface Command {
  id: string;
  label: string;
  hint?: string;
  keywords?: string[];
  group: 'Navegar' | 'Filtro' | 'Ação';
  run: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const setPeriod = useFiltersStore((s) => s.setPeriod);
  const setPlatform = useFiltersStore((s) => s.setPlatform);
  const { toggleTheme } = useTheme();

  const commands = useMemo<Command[]>(
    () => [
      // Navegar
      { id: 'nav-dashboard', label: 'Ir para Dashboard', group: 'Navegar', keywords: ['home', 'vis\u00e3o geral'], run: () => router.push('/dashboard') },
      { id: 'nav-campanhas', label: 'Ir para Campanhas', group: 'Navegar', run: () => router.push('/campanhas') },
      { id: 'nav-keywords', label: 'Ir para Palavras-chave', group: 'Navegar', keywords: ['keywords'], run: () => router.push('/palavras-chave') },
      { id: 'nav-criativos', label: 'Ir para Criativos', group: 'Navegar', keywords: ['ads', 'ad'], run: () => router.push('/criativos') },
      { id: 'nav-geografia', label: 'Ir para Geografia', group: 'Navegar', keywords: ['mapa', 'bairro'], run: () => router.push('/geografia') },
      { id: 'nav-funil', label: 'Ir para Funil', group: 'Navegar', keywords: ['convers\u00e3o'], run: () => router.push('/funil') },
      { id: 'nav-comparar', label: 'Comparar períodos', group: 'Navegar', keywords: ['compare', 'diff'], run: () => router.push('/comparar') },
      { id: 'nav-clinica', label: 'Configurar clínica', group: 'Navegar', keywords: ['endere\u00e7o', 'raio'], run: () => router.push('/configuracoes/clinica') },
      { id: 'nav-integracoes', label: 'Ir para Integrações', group: 'Navegar', keywords: ['google', 'meta', 'conectar'], run: () => router.push('/integracoes') },
      { id: 'nav-config', label: 'Ir para Configurações', group: 'Navegar', run: () => router.push('/configuracoes') },
      // Filtro
      { id: 'period-7d', label: 'Período: Últimos 7 dias', group: 'Filtro', keywords: ['semana', 'recente'], run: () => setPeriod({ preset: 'last-7d' }) },
      { id: 'period-this-month', label: 'Período: Este mês', group: 'Filtro', run: () => setPeriod({ preset: 'this-month' }) },
      { id: 'period-90d', label: 'Período: Últimos 90 dias', group: 'Filtro', run: () => setPeriod({ preset: 'last-90d' }) },
      { id: 'period-180d', label: 'Período: Últimos 180 dias', group: 'Filtro', run: () => setPeriod({ preset: 'last-180d' }) },
      { id: 'period-year', label: 'Período: Este ano', group: 'Filtro', run: () => setPeriod({ preset: 'this-year' }) },
      { id: 'platform-all', label: 'Plataforma: Todas', group: 'Filtro', run: () => setPlatform('all') },
      { id: 'platform-meta', label: 'Plataforma: Meta', group: 'Filtro', keywords: ['facebook', 'instagram'], run: () => setPlatform('meta') },
      { id: 'platform-google', label: 'Plataforma: Google', group: 'Filtro', run: () => setPlatform('google') },
      // Ação
      { id: 'theme-toggle', label: 'Alternar tema (claro/escuro)', group: 'Ação', keywords: ['dark', 'light', 'modo'], run: () => toggleTheme() },
      { id: 'print', label: 'Imprimir / salvar como PDF', group: 'Ação', keywords: ['pdf', 'imprimir'], run: () => window.print() },
    ],
    [router, setPeriod, setPlatform, toggleTheme],
  );

  // Atalho Cmd+K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      const haystack = [c.label, c.hint ?? '', ...(c.keywords ?? []), c.group].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [commands, query]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  const runAt = (idx: number) => {
    const cmd = filtered[idx];
    if (!cmd) return;
    cmd.run();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" role="dialog" aria-modal="true" aria-label="Paleta de comandos">
      <button
        type="button"
        aria-label="Fechar"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-ink-subtle" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setCursor((c) => Math.min(filtered.length - 1, c + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setCursor((c) => Math.max(0, c - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                runAt(cursor);
              }
            }}
            placeholder="Buscar ações, páginas, filtros..."
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
          />
          <kbd className="rounded border border-line bg-surface-muted px-1.5 py-0.5 text-[10px] text-ink-muted">
            ESC
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-1.5">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-muted">
              Nenhum comando encontrado.
            </p>
          ) : (
            groupCommands(filtered).map(([group, cmds]) => (
              <div key={group} className="py-1">
                <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                  {group}
                </p>
                {cmds.map((cmd) => {
                  const absIdx = filtered.indexOf(cmd);
                  const active = absIdx === cursor;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      onMouseEnter={() => setCursor(absIdx)}
                      onClick={() => runAt(absIdx)}
                      className={cn(
                        'flex w-full items-center justify-between px-4 py-2 text-left text-sm',
                        active ? 'bg-surface-subtle text-ink' : 'text-ink-muted',
                      )}
                    >
                      <span>{cmd.label}</span>
                      {cmd.hint && <span className="text-xs text-ink-subtle">{cmd.hint}</span>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line bg-surface-muted px-4 py-2 text-[11px] text-ink-subtle">
          <span className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-line bg-surface px-1 py-0.5 text-[10px]">↑↓</kbd>
              navegar
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-line bg-surface px-1 py-0.5 text-[10px]">↵</kbd>
              executar
            </span>
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-line bg-surface px-1 py-0.5 text-[10px]">⌘</kbd>
            <kbd className="rounded border border-line bg-surface px-1 py-0.5 text-[10px]">K</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}

function groupCommands(cmds: Command[]): [Command['group'], Command[]][] {
  const groups = new Map<Command['group'], Command[]>();
  cmds.forEach((c) => {
    const arr = groups.get(c.group) ?? [];
    arr.push(c);
    groups.set(c.group, arr);
  });
  return Array.from(groups.entries());
}
