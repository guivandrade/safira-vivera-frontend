import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Can } from '@/components/ui/Can';

// Mock do provider — não queremos montar o AuthProvider real (que faz fetch).
// Cada teste controla o que `useCan` retorna.
vi.mock('@/providers/auth-provider', () => ({
  useCan: vi.fn(),
}));

import { useCan } from '@/providers/auth-provider';

describe('<Can>', () => {
  it('renderiza children quando permissão concedida', () => {
    vi.mocked(useCan).mockReturnValue((_p: string) => true);
    render(
      <Can permission="view:metrics:spend">
        <span>Gasto: R$ 1.000</span>
      </Can>,
    );
    expect(screen.getByText('Gasto: R$ 1.000')).toBeInTheDocument();
  });

  it('não renderiza children quando permissão negada (sem fallback)', () => {
    vi.mocked(useCan).mockReturnValue((_p: string) => false);
    render(
      <Can permission="view:metrics:spend">
        <span>Gasto: R$ 1.000</span>
      </Can>,
    );
    expect(screen.queryByText('Gasto: R$ 1.000')).not.toBeInTheDocument();
  });

  it('renderiza fallback quando permissão negada e fallback fornecido', () => {
    vi.mocked(useCan).mockReturnValue((_p: string) => false);
    render(
      <Can permission="view:metrics:spend" fallback={<span>Indisponível</span>}>
        <span>Gasto: R$ 1.000</span>
      </Can>,
    );
    expect(screen.queryByText('Gasto: R$ 1.000')).not.toBeInTheDocument();
    expect(screen.getByText('Indisponível')).toBeInTheDocument();
  });

  it('consulta a permissão exata passada em prop', () => {
    const canMock = vi.fn((p: string) => p === 'view:campaigns');
    vi.mocked(useCan).mockReturnValue(canMock);
    render(
      <Can permission="view:campaigns">
        <span>Campanhas</span>
      </Can>,
    );
    expect(canMock).toHaveBeenCalledWith('view:campaigns');
    expect(screen.getByText('Campanhas')).toBeInTheDocument();
  });
});
