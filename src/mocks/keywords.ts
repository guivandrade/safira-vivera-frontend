export interface KeywordRow {
  id: string;
  keyword: string;
  campaign: string;
  matchType: 'EXATA' | 'FRASE' | 'AMPLA';
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export const mockKeywords: KeywordRow[] = [
  { id: 'kw1', keyword: 'vivera joias anel', campaign: 'Search Brand', matchType: 'EXATA', impressions: 12450, clicks: 1834, conversions: 94, spend: 2410.5 },
  { id: 'kw2', keyword: 'anel de ouro feminino', campaign: 'Search Genérica', matchType: 'FRASE', impressions: 9820, clicks: 712, conversions: 41, spend: 1890.3 },
  { id: 'kw3', keyword: 'aliança casamento', campaign: 'Search Nupcial', matchType: 'FRASE', impressions: 7340, clicks: 651, conversions: 38, spend: 1650.8 },
  { id: 'kw4', keyword: 'joia presente dia das mães', campaign: 'Datas Comemorativas', matchType: 'AMPLA', impressions: 21440, clicks: 1102, conversions: 67, spend: 2780.0 },
  { id: 'kw5', keyword: 'brinco ouro 18k', campaign: 'Search Genérica', matchType: 'FRASE', impressions: 4980, clicks: 418, conversions: 22, spend: 920.15 },
  { id: 'kw6', keyword: 'colar feminino prata', campaign: 'Search Genérica', matchType: 'FRASE', impressions: 3640, clicks: 268, conversions: 11, spend: 680.9 },
  { id: 'kw7', keyword: 'vivera anel noivado', campaign: 'Search Brand', matchType: 'EXATA', impressions: 5210, clicks: 764, conversions: 52, spend: 1120.0 },
  { id: 'kw8', keyword: 'pulseira masculina', campaign: 'Search Masculino', matchType: 'AMPLA', impressions: 2980, clicks: 142, conversions: 6, spend: 310.2 },
  { id: 'kw9', keyword: 'presente namorada joia', campaign: 'Datas Comemorativas', matchType: 'AMPLA', impressions: 14220, clicks: 892, conversions: 48, spend: 2010.5 },
  { id: 'kw10', keyword: 'onde comprar joias online', campaign: 'Search Genérica', matchType: 'FRASE', impressions: 6450, clicks: 511, conversions: 29, spend: 1220.6 },
  { id: 'kw11', keyword: 'vivera loja', campaign: 'Search Brand', matchType: 'EXATA', impressions: 4120, clicks: 618, conversions: 44, spend: 760.0 },
  { id: 'kw12', keyword: 'aliança ouro 750', campaign: 'Search Nupcial', matchType: 'EXATA', impressions: 2890, clicks: 322, conversions: 19, spend: 890.4 },
  { id: 'kw13', keyword: 'corrente ouro masculina', campaign: 'Search Masculino', matchType: 'FRASE', impressions: 3820, clicks: 256, conversions: 14, spend: 610.3 },
  { id: 'kw14', keyword: 'bracelete feminino', campaign: 'Search Genérica', matchType: 'AMPLA', impressions: 2180, clicks: 98, conversions: 4, spend: 210.75 },
  { id: 'kw15', keyword: 'joia personalizada', campaign: 'Premium', matchType: 'FRASE', impressions: 5640, clicks: 412, conversions: 31, spend: 1420.5 },
  { id: 'kw16', keyword: 'relogio feminino dourado', campaign: 'Search Genérica', matchType: 'FRASE', impressions: 3280, clicks: 178, conversions: 7, spend: 420.0 },
  { id: 'kw17', keyword: 'presente aniversario esposa', campaign: 'Datas Comemorativas', matchType: 'AMPLA', impressions: 9820, clicks: 612, conversions: 38, spend: 1680.2 },
  { id: 'kw18', keyword: 'vivera site oficial', campaign: 'Search Brand', matchType: 'EXATA', impressions: 2140, clicks: 389, conversions: 28, spend: 450.0 },
  { id: 'kw19', keyword: 'joias finas luxo', campaign: 'Premium', matchType: 'AMPLA', impressions: 7120, clicks: 384, conversions: 24, spend: 1380.9 },
  { id: 'kw20', keyword: 'cordao masculino ouro', campaign: 'Search Masculino', matchType: 'FRASE', impressions: 1980, clicks: 102, conversions: 5, spend: 290.5 },
  { id: 'kw21', keyword: 'colar ponto de luz', campaign: 'Search Genérica', matchType: 'EXATA', impressions: 4320, clicks: 298, conversions: 21, spend: 720.4 },
  { id: 'kw22', keyword: 'aliança moeda antiga', campaign: 'Search Nupcial', matchType: 'FRASE', impressions: 3180, clicks: 212, conversions: 13, spend: 580.6 },
  { id: 'kw23', keyword: 'joia 15 anos', campaign: 'Datas Comemorativas', matchType: 'AMPLA', impressions: 2810, clicks: 142, conversions: 9, spend: 320.5 },
  { id: 'kw24', keyword: 'anel solitário diamante', campaign: 'Premium', matchType: 'FRASE', impressions: 4920, clicks: 318, conversions: 26, spend: 1580.0 },
  { id: 'kw25', keyword: 'conjunto de joias', campaign: 'Search Genérica', matchType: 'FRASE', impressions: 3420, clicks: 198, conversions: 12, spend: 560.2 },
  { id: 'kw26', keyword: 'vivera joalheria', campaign: 'Search Brand', matchType: 'EXATA', impressions: 1840, clicks: 302, conversions: 22, spend: 410.0 },
  { id: 'kw27', keyword: 'brinco argola grande', campaign: 'Search Genérica', matchType: 'AMPLA', impressions: 2940, clicks: 164, conversions: 7, spend: 330.9 },
  { id: 'kw28', keyword: 'joia cravejada brilhante', campaign: 'Premium', matchType: 'FRASE', impressions: 3120, clicks: 212, conversions: 15, spend: 890.4 },
  { id: 'kw29', keyword: 'pingente coracao ouro', campaign: 'Datas Comemorativas', matchType: 'FRASE', impressions: 5210, clicks: 412, conversions: 28, spend: 920.0 },
  { id: 'kw30', keyword: 'comprar alianca online', campaign: 'Search Nupcial', matchType: 'AMPLA', impressions: 4120, clicks: 271, conversions: 18, spend: 780.3 },
];
