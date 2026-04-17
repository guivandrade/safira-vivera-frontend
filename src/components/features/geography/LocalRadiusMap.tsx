'use client';

import { useMemo } from 'react';
import type { ClinicCenter, NeighborhoodMetrics } from '@/types/api';
import { formatNumber } from '@/lib/formatters';

interface LocalRadiusMapProps {
  clinic: ClinicCenter;
  neighborhoods: NeighborhoodMetrics[];
  highlightedId?: string | null;
  onSelect?: (id: string) => void;
}

/**
 * Mapa schemático radial — clínica no centro, bairros posicionados por
 * (distância, ângulo). Não é um mapa geográfico real, mas dá a Vera uma
 * leitura rápida de onde vêm os clientes em relação à clínica.
 */
export function LocalRadiusMap({
  clinic,
  neighborhoods,
  highlightedId,
  onSelect,
}: LocalRadiusMapProps) {
  const size = 440;
  const center = size / 2;
  // pixels por km — 4km de raio = ~160px (deixa margem)
  const pxPerKm = 40;

  const maxConversions = useMemo(
    () => Math.max(...neighborhoods.map((n) => n.conversions), 1),
    [neighborhoods],
  );

  const toXY = (distance: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180; // 0° = norte
    const x = center + Math.cos(rad) * distance * pxPerKm;
    const y = center + Math.sin(rad) * distance * pxPerKm;
    return { x, y };
  };

  const radiusPx = clinic.radiusKm * pxPerKm;

  return (
    <div className="overflow-hidden">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        style={{ maxWidth: size }}
        role="img"
        aria-label={`Bairros em raio de ${clinic.radiusKm}km ao redor de ${clinic.name}`}
      >
        {/* Grid de referência */}
        {[1, 2, 3, 4].map((km) => (
          <circle
            key={km}
            cx={center}
            cy={center}
            r={km * pxPerKm}
            fill="none"
            stroke="var(--line)"
            strokeWidth={1}
            strokeDasharray={km === clinic.radiusKm ? '0' : '2 3'}
          />
        ))}

        {/* Raio principal (4km) destacado */}
        <circle
          cx={center}
          cy={center}
          r={radiusPx}
          fill="var(--accent)"
          fillOpacity={0.04}
          stroke="var(--accent)"
          strokeWidth={1.5}
          strokeOpacity={0.4}
        />

        {/* Labels de km */}
        {[1, 2, 3, 4].map((km) => (
          <text
            key={`label-${km}`}
            x={center + km * pxPerKm + 4}
            y={center - 2}
            fontSize="9"
            fill="var(--ink-subtle)"
          >
            {km}km
          </text>
        ))}

        {/* Linhas cardeais suaves */}
        <line x1={center} y1={0} x2={center} y2={size} stroke="var(--line-subtle)" strokeWidth={1} />
        <line x1={0} y1={center} x2={size} y2={center} stroke="var(--line-subtle)" strokeWidth={1} />
        <text x={center} y={12} fontSize="10" fill="var(--ink-subtle)" textAnchor="middle">N</text>
        <text x={center} y={size - 2} fontSize="10" fill="var(--ink-subtle)" textAnchor="middle">S</text>
        <text x={4} y={center + 3} fontSize="10" fill="var(--ink-subtle)">O</text>
        <text x={size - 10} y={center + 3} fontSize="10" fill="var(--ink-subtle)">L</text>

        {/* Bairros */}
        {neighborhoods.map((n) => {
          const { x, y } = toXY(n.distanceKm, n.angleDeg);
          const intensity = n.conversions / maxConversions;
          const radius = 6 + intensity * 14;
          const isHighlighted = highlightedId === n.id;
          return (
            <g
              key={n.id}
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
              onClick={() => onSelect?.(n.id)}
            >
              <circle
                cx={x}
                cy={y}
                r={radius}
                fill="var(--accent)"
                fillOpacity={0.15 + intensity * 0.5}
                stroke={isHighlighted ? 'var(--accent)' : 'transparent'}
                strokeWidth={2}
              />
              <text
                x={x}
                y={y - radius - 4}
                fontSize="10"
                fontWeight={isHighlighted ? 600 : 500}
                fill="var(--ink)"
                textAnchor="middle"
              >
                {n.name}
              </text>
              <text
                x={x}
                y={y + 3}
                fontSize="9"
                fontWeight={600}
                fill="var(--accent-fg)"
                textAnchor="middle"
                style={{ pointerEvents: 'none' }}
              >
                {formatNumber(n.conversions)}
              </text>
              <title>
                {n.name} · {n.distanceKm}km · {formatNumber(n.conversions)} conversões
              </title>
            </g>
          );
        })}

        {/* Clínica no centro */}
        <circle cx={center} cy={center} r={8} fill="var(--danger)" />
        <circle cx={center} cy={center} r={14} fill="var(--danger)" fillOpacity={0.2} />
        <text x={center} y={center - 18} fontSize="11" fontWeight={700} fill="var(--ink)" textAnchor="middle">
          {clinic.name}
        </text>
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-danger" /> Clínica
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent/30" /> Bairro · círculo = volume de conversões
        </span>
        <span>Raio destacado: {clinic.radiusKm}km</span>
      </div>
    </div>
  );
}
