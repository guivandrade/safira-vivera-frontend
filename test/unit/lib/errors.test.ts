import { describe, expect, it } from 'vitest';
import { AxiosError } from 'axios';
import {
  classifyError,
  getErrorCode,
  getErrorMessage,
  getUserFacingMessage,
} from '@/lib/errors';

function makeAxiosError({
  code,
  status,
  data,
}: {
  code?: string;
  status?: number;
  data?: unknown;
}) {
  const err = new AxiosError('mock', code);
  if (status !== undefined) {
    err.response = {
      data,
      status,
      statusText: '',
      headers: {},
      config: {} as never,
    };
  }
  return err;
}

describe('classifyError', () => {
  it('detecta timeout via ECONNABORTED', () => {
    expect(classifyError(makeAxiosError({ code: 'ECONNABORTED' }))).toBe('timeout');
  });

  it('detecta timeout via ETIMEDOUT', () => {
    expect(classifyError(makeAxiosError({ code: 'ETIMEDOUT' }))).toBe('timeout');
  });

  it('detecta DNS via ENOTFOUND', () => {
    expect(classifyError(makeAxiosError({ code: 'ENOTFOUND' }))).toBe('dns');
  });

  it('detecta DNS via EAI_AGAIN', () => {
    expect(classifyError(makeAxiosError({ code: 'EAI_AGAIN' }))).toBe('dns');
  });

  it('classifica como network quando não há response e não há code conhecido', () => {
    expect(classifyError(makeAxiosError({ code: 'ERR_NETWORK' }))).toBe('network');
    expect(classifyError(makeAxiosError({}))).toBe('network');
  });

  it('classifica 401 como unauthorized', () => {
    expect(classifyError(makeAxiosError({ status: 401 }))).toBe('unauthorized');
  });

  it('classifica 403 como unauthorized', () => {
    expect(classifyError(makeAxiosError({ status: 403 }))).toBe('unauthorized');
  });

  it('classifica 404 como client', () => {
    expect(classifyError(makeAxiosError({ status: 404 }))).toBe('client');
  });

  it('classifica 500 como server', () => {
    expect(classifyError(makeAxiosError({ status: 500 }))).toBe('server');
  });

  it('classifica 503 como server', () => {
    expect(classifyError(makeAxiosError({ status: 503 }))).toBe('server');
  });

  it('classifica erro não-axios como unknown', () => {
    expect(classifyError(new Error('boom'))).toBe('unknown');
    expect(classifyError('string error')).toBe('unknown');
    expect(classifyError(null)).toBe('unknown');
  });
});

describe('getErrorCode', () => {
  it('retorna code de AxiosError', () => {
    expect(getErrorCode(makeAxiosError({ code: 'ECONNABORTED' }))).toBe('ECONNABORTED');
  });

  it('retorna undefined para erro não-axios', () => {
    expect(getErrorCode(new Error('boom'))).toBeUndefined();
    expect(getErrorCode(null)).toBeUndefined();
  });
});

describe('getUserFacingMessage', () => {
  it('mensagem específica para timeout', () => {
    expect(getUserFacingMessage(makeAxiosError({ code: 'ECONNABORTED' }), 'fallback')).toMatch(
      /demorou demais/i,
    );
  });

  it('mensagem específica para DNS', () => {
    expect(getUserFacingMessage(makeAxiosError({ code: 'ENOTFOUND' }), 'fallback')).toMatch(
      /localizar o servidor/i,
    );
  });

  it('mensagem específica para network genérico', () => {
    expect(getUserFacingMessage(makeAxiosError({}), 'fallback')).toMatch(/sem conexão/i);
  });

  it('usa mensagem do backend quando disponível e não é ruído técnico', () => {
    const err = makeAxiosError({
      status: 400,
      data: { message: 'Email já cadastrado' },
    });
    expect(getUserFacingMessage(err, 'fallback')).toBe('Email já cadastrado');
  });

  it('ignora mensagem técnica do backend e cai na classificação', () => {
    const err = makeAxiosError({
      status: 500,
      data: { message: 'Request failed with status code 500' },
    });
    expect(getUserFacingMessage(err, 'fallback')).toMatch(/temporariamente indisponível/i);
  });

  it('usa fallback quando não há classificação aplicável', () => {
    expect(getUserFacingMessage(new Error('boom'), 'meu fallback')).toBe('meu fallback');
  });

  it('mensagem para 401 fala de sessão expirada (default — login override esse caso)', () => {
    expect(getUserFacingMessage(makeAxiosError({ status: 401 }), 'fb')).toMatch(/sessão expirou/i);
  });

  it('mensagem para 5xx é amigável', () => {
    expect(getUserFacingMessage(makeAxiosError({ status: 503 }), 'fb')).toMatch(
      /temporariamente indisponível/i,
    );
  });
});

describe('getErrorMessage', () => {
  it('extrai message do response.data quando AxiosError', () => {
    expect(
      getErrorMessage(makeAxiosError({ status: 400, data: { message: 'Email inválido' } }), 'fb'),
    ).toBe('Email inválido');
  });

  it('usa fallback quando AxiosError sem message no body', () => {
    expect(getErrorMessage(makeAxiosError({ status: 500 }), 'fb')).toBe('fb');
  });

  it('usa Error.message para erros nativos', () => {
    expect(getErrorMessage(new Error('boom'), 'fb')).toBe('boom');
  });

  it('usa fallback para tipos desconhecidos', () => {
    expect(getErrorMessage('string error', 'fb')).toBe('fb');
    expect(getErrorMessage(null, 'fb')).toBe('fb');
  });
});
