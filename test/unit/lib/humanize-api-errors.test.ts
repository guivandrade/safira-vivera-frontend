import { describe, it, expect } from 'vitest';
import { humanizeApiError, humanizeApiErrors } from '@/lib/humanize-api-errors';

describe('humanizeApiError', () => {
  it('traduz 400 para mensagem de consulta rejeitada pelo Meta', () => {
    const result = humanizeApiError('Request failed with status code 400');
    expect(result.message).toBe('Meta rejeitou parte da consulta');
    expect(result.hint).toContain('indisponíveis temporariamente');
  });

  it('traduz 401 para autenticação expirada', () => {
    const result = humanizeApiError('Request failed with status code 401');
    expect(result.message).toBe('Autenticação com a plataforma expirou');
    expect(result.hint).toMatch(/Integrações/);
  });

  it('detecta erro por palavra-chave "unauthorized" mesmo sem status 401', () => {
    const result = humanizeApiError('Token unauthorized at provider');
    expect(result.message).toBe('Autenticação com a plataforma expirou');
  });

  it('traduz 429 para limite de requisições', () => {
    const result = humanizeApiError('Request failed with status code 429');
    expect(result.message).toBe('Limite de requisições atingido');
  });

  it('detecta rate limit sem status code', () => {
    const result = humanizeApiError('rate limit exceeded');
    expect(result.message).toBe('Limite de requisições atingido');
  });

  it('traduz 5xx para plataforma indisponível', () => {
    const result = humanizeApiError('Request failed with status code 503');
    expect(result.message).toBe('Plataforma indisponível no momento');
  });

  it('trata ECONNREFUSED como plataforma indisponível', () => {
    const result = humanizeApiError('ECONNREFUSED tcp connect failed');
    expect(result.message).toBe('Plataforma indisponível no momento');
  });

  it('trata timeout como plataforma indisponível', () => {
    const result = humanizeApiError('request timeout after 30s');
    expect(result.message).toBe('Plataforma indisponível no momento');
  });

  it('detecta delay de geographic_view', () => {
    const result = humanizeApiError('geographic_view not yet processed');
    expect(result.message).toBe('Google ainda está processando os dados deste período');
    expect(result.hint).toMatch(/24h/);
  });

  it('detecta delay de keyword_view', () => {
    const result = humanizeApiError('keyword_view: data pending');
    expect(result.message).toBe('Google ainda está processando os dados deste período');
  });

  it('remove prefixo "Provider: " de erros desconhecidos curtos', () => {
    const result = humanizeApiError('Meta creatives: timeout ignorado');
    // Contém "timeout" → cai em 5xx bucket
    expect(result.message).toBe('Plataforma indisponível no momento');
  });

  it('remove prefixo em erro genérico curto', () => {
    const result = humanizeApiError('Meta keywords: custom error');
    expect(result.message).toBe('custom error');
  });

  it('retorna fallback genérico para erros longos não reconhecidos', () => {
    const longErr = 'A'.repeat(200);
    const result = humanizeApiError(longErr);
    expect(result.message).toBe('Alguns dados podem estar incompletos');
  });

  it('retorna mensagem original quando curta e não reconhecida', () => {
    const result = humanizeApiError('something small');
    expect(result.message).toBe('something small');
  });
});

describe('humanizeApiErrors', () => {
  it('retorna array vazio para undefined', () => {
    expect(humanizeApiErrors(undefined)).toEqual([]);
  });

  it('retorna array vazio para array vazio', () => {
    expect(humanizeApiErrors([])).toEqual([]);
  });

  it('deduplica mensagens humanizadas iguais', () => {
    const errors = [
      'Request failed with status code 400',
      'Meta keywords: request failed with status code 400',
      'Request failed with status code 400',
    ];
    const result = humanizeApiErrors(errors);
    expect(result).toHaveLength(1);
    expect(result[0].message).toBe('Meta rejeitou parte da consulta');
  });

  it('mantém mensagens humanizadas diferentes', () => {
    const errors = [
      'Request failed with status code 400',
      'Request failed with status code 429',
      'Request failed with status code 503',
    ];
    const result = humanizeApiErrors(errors);
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.message)).toEqual([
      'Meta rejeitou parte da consulta',
      'Limite de requisições atingido',
      'Plataforma indisponível no momento',
    ]);
  });

  it('preserva ordem original das primeiras ocorrências', () => {
    const errors = [
      'Request failed with status code 429',
      'Request failed with status code 400',
      'Request failed with status code 400',
    ];
    const result = humanizeApiErrors(errors);
    expect(result[0].message).toBe('Limite de requisições atingido');
    expect(result[1].message).toBe('Meta rejeitou parte da consulta');
  });
});
