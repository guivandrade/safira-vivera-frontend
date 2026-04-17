import { humanizeApiErrors } from '@/lib/humanize-api-errors';

interface ApiErrorsBannerProps {
  errors: string[] | undefined;
  className?: string;
}

/**
 * Banner amarelo renderizado quando o backend retorna `errors[]` em uma
 * resposta de sucesso parcial. Usa `humanizeApiErrors` pra traduzir
 * mensagens técnicas (axios, Meta, Google) em textos acionáveis.
 */
export function ApiErrorsBanner({ errors, className }: ApiErrorsBannerProps) {
  const humanized = humanizeApiErrors(errors);
  if (humanized.length === 0) return null;

  return (
    <div className={`rounded-md border border-warning/30 bg-warning/5 px-4 py-2.5 text-sm ${className ?? ''}`}>
      <p className="font-medium text-warning">
        {humanized.length === 1 ? humanized[0].message : 'Alguns dados podem estar incompletos'}
      </p>
      {humanized.length === 1 && humanized[0].hint ? (
        <p className="mt-1 text-xs text-ink-muted">{humanized[0].hint}</p>
      ) : humanized.length > 1 ? (
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-ink-muted">
          {humanized.map((h, idx) => (
            <li key={idx}>
              {h.message}
              {h.hint && <span className="block text-ink-subtle">{h.hint}</span>}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
