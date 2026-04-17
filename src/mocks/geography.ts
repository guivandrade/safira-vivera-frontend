export interface NeighborhoodRow {
  id: string;
  name: string;
  city: string;
  state: string;
  distanceKm: number; // distância até a clínica
  angleDeg: number; // ângulo relativo (0° = norte, 90° = leste)
  searches: number; // buscas no Google
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export interface ClinicLocation {
  name: string;
  address: string;
  city: string;
  state: string;
  radiusKm: number;
}

export const mockClinic: ClinicLocation = {
  name: 'Clínica Vivera',
  address: 'Rua dos Pinheiros, 500',
  city: 'São Paulo',
  state: 'SP',
  radiusKm: 4,
};

// Bairros num raio de ~4km, com distância e ângulo aproximados
export const mockNeighborhoods: NeighborhoodRow[] = [
  { id: 'b1', name: 'Pinheiros', city: 'São Paulo', state: 'SP', distanceKm: 0.3, angleDeg: 45, searches: 4820, impressions: 18420, clicks: 1240, conversions: 94, spend: 2410 },
  { id: 'b2', name: 'Vila Madalena', city: 'São Paulo', state: 'SP', distanceKm: 1.2, angleDeg: 340, searches: 3210, impressions: 12100, clicks: 892, conversions: 78, spend: 1890 },
  { id: 'b3', name: 'Alto de Pinheiros', city: 'São Paulo', state: 'SP', distanceKm: 1.8, angleDeg: 300, searches: 2140, impressions: 8420, clicks: 612, conversions: 54, spend: 1320 },
  { id: 'b4', name: 'Jardim Paulistano', city: 'São Paulo', state: 'SP', distanceKm: 2.1, angleDeg: 110, searches: 2890, impressions: 10240, clicks: 728, conversions: 62, spend: 1620 },
  { id: 'b5', name: 'Itaim Bibi', city: 'São Paulo', state: 'SP', distanceKm: 3.4, angleDeg: 135, searches: 2420, impressions: 9120, clicks: 548, conversions: 48, spend: 1420 },
  { id: 'b6', name: 'Vila Olímpia', city: 'São Paulo', state: 'SP', distanceKm: 3.8, angleDeg: 150, searches: 1980, impressions: 7240, clicks: 412, conversions: 38, spend: 1110 },
  { id: 'b7', name: 'Perdizes', city: 'São Paulo', state: 'SP', distanceKm: 2.6, angleDeg: 20, searches: 1820, impressions: 6810, clicks: 384, conversions: 32, spend: 980 },
  { id: 'b8', name: 'Higienópolis', city: 'São Paulo', state: 'SP', distanceKm: 3.2, angleDeg: 60, searches: 1510, impressions: 5920, clicks: 312, conversions: 28, spend: 820 },
  { id: 'b9', name: 'Sumaré', city: 'São Paulo', state: 'SP', distanceKm: 2.4, angleDeg: 0, searches: 1340, impressions: 4820, clicks: 268, conversions: 22, spend: 620 },
  { id: 'b10', name: 'Jardins', city: 'São Paulo', state: 'SP', distanceKm: 3.6, angleDeg: 95, searches: 2680, impressions: 9820, clicks: 584, conversions: 52, spend: 1520 },
  { id: 'b11', name: 'Vila Leopoldina', city: 'São Paulo', state: 'SP', distanceKm: 3.9, angleDeg: 280, searches: 1120, impressions: 4210, clicks: 198, conversions: 14, spend: 480 },
  { id: 'b12', name: 'Butantã', city: 'São Paulo', state: 'SP', distanceKm: 3.7, angleDeg: 240, searches: 980, impressions: 3620, clicks: 178, conversions: 12, spend: 410 },
];

// Top queries by neighborhood — quais buscas mais convertem em cada bairro
export interface NeighborhoodQuery {
  neighborhoodId: string;
  query: string;
  searches: number;
  conversions: number;
}

export const mockNeighborhoodQueries: NeighborhoodQuery[] = [
  { neighborhoodId: 'b1', query: 'clínica estética pinheiros', searches: 820, conversions: 28 },
  { neighborhoodId: 'b1', query: 'harmonização facial perto de mim', searches: 612, conversions: 22 },
  { neighborhoodId: 'b1', query: 'botox pinheiros', searches: 440, conversions: 18 },
  { neighborhoodId: 'b2', query: 'clínica estética vila madalena', searches: 510, conversions: 24 },
  { neighborhoodId: 'b2', query: 'preenchimento labial', searches: 380, conversions: 18 },
  { neighborhoodId: 'b4', query: 'dermatologista jardins', searches: 480, conversions: 20 },
  { neighborhoodId: 'b5', query: 'estética itaim bibi', searches: 420, conversions: 16 },
  { neighborhoodId: 'b10', query: 'clínica dermatologica jardins', searches: 680, conversions: 26 },
];
