export interface CreativeRow {
  id: string;
  name: string;
  campaign: string;
  type: 'IMAGEM' | 'VIDEO' | 'CARROSSEL';
  thumbnail: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

// Thumbnails = abstract gradient placeholders (no external deps)
const palette = ['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#22d3ee', '#fb923c'];

function gradient(i: number): string {
  const a = palette[i % palette.length];
  const b = palette[(i + 3) % palette.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export const mockCreatives: CreativeRow[] = [
  { id: 'cr1', name: 'Coleção Primavera · Modelo 1', campaign: 'Performance · Coleção', type: 'IMAGEM', thumbnail: gradient(0), impressions: 142380, clicks: 8210, conversions: 412, spend: 8240.0 },
  { id: 'cr2', name: 'Dia das Mães · Vídeo 30s', campaign: 'Datas Comemorativas', type: 'VIDEO', thumbnail: gradient(1), impressions: 98120, clicks: 5842, conversions: 298, spend: 6120.4 },
  { id: 'cr3', name: 'Carrossel Anéis Noivado', campaign: 'Performance · Noivado', type: 'CARROSSEL', thumbnail: gradient(2), impressions: 64280, clicks: 4210, conversions: 218, spend: 4890.2 },
  { id: 'cr4', name: 'Lookbook · Prata 925', campaign: 'Prospecção · Prata', type: 'IMAGEM', thumbnail: gradient(3), impressions: 54210, clicks: 3180, conversions: 142, spend: 3420.8 },
  { id: 'cr5', name: 'Unboxing · Reels', campaign: 'Prospecção · Geral', type: 'VIDEO', thumbnail: gradient(4), impressions: 112340, clicks: 6820, conversions: 324, spend: 5280.0 },
  { id: 'cr6', name: 'Black Friday Hero', campaign: 'Black Friday', type: 'IMAGEM', thumbnail: gradient(5), impressions: 198420, clicks: 12400, conversions: 680, spend: 11240.5 },
  { id: 'cr7', name: 'Dia dos Namorados Story', campaign: 'Datas Comemorativas', type: 'VIDEO', thumbnail: gradient(6), impressions: 82140, clicks: 4920, conversions: 241, spend: 4920.0 },
  { id: 'cr8', name: 'Depoimento · Cliente real', campaign: 'Prospecção · Social proof', type: 'VIDEO', thumbnail: gradient(7), impressions: 34210, clicks: 1980, conversions: 118, spend: 2140.0 },
];
