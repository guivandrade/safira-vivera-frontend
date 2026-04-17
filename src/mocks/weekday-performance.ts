export interface WeekdaySlot {
  weekday: number; // 0=Dom, 6=Sáb
  timeOfDay: 0 | 1 | 2 | 3; // Madrugada / Manhã / Tarde / Noite
  conversions: number;
  spend: number;
  clicks: number;
}

export const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const timeOfDayLabels = ['Madrugada', 'Manhã', 'Tarde', 'Noite'];

// Mock realista: conversões concentram-se em sábado à noite, sexta à tarde,
// domingo à tarde. Baixas na madrugada e segunda pela manhã.
export const mockWeekdayPerformance: WeekdaySlot[] = [
  // Domingo
  { weekday: 0, timeOfDay: 0, conversions: 2, spend: 80, clicks: 42 },
  { weekday: 0, timeOfDay: 1, conversions: 14, spend: 420, clicks: 210 },
  { weekday: 0, timeOfDay: 2, conversions: 28, spend: 710, clicks: 412 },
  { weekday: 0, timeOfDay: 3, conversions: 21, spend: 580, clicks: 310 },

  // Segunda
  { weekday: 1, timeOfDay: 0, conversions: 1, spend: 40, clicks: 18 },
  { weekday: 1, timeOfDay: 1, conversions: 8, spend: 310, clicks: 184 },
  { weekday: 1, timeOfDay: 2, conversions: 16, spend: 520, clicks: 298 },
  { weekday: 1, timeOfDay: 3, conversions: 19, spend: 610, clicks: 344 },

  // Terça
  { weekday: 2, timeOfDay: 0, conversions: 2, spend: 60, clicks: 22 },
  { weekday: 2, timeOfDay: 1, conversions: 11, spend: 380, clicks: 210 },
  { weekday: 2, timeOfDay: 2, conversions: 18, spend: 580, clicks: 318 },
  { weekday: 2, timeOfDay: 3, conversions: 22, spend: 690, clicks: 380 },

  // Quarta
  { weekday: 3, timeOfDay: 0, conversions: 3, spend: 90, clicks: 40 },
  { weekday: 3, timeOfDay: 1, conversions: 13, spend: 420, clicks: 238 },
  { weekday: 3, timeOfDay: 2, conversions: 19, spend: 610, clicks: 342 },
  { weekday: 3, timeOfDay: 3, conversions: 25, spend: 740, clicks: 418 },

  // Quinta
  { weekday: 4, timeOfDay: 0, conversions: 4, spend: 120, clicks: 60 },
  { weekday: 4, timeOfDay: 1, conversions: 15, spend: 480, clicks: 268 },
  { weekday: 4, timeOfDay: 2, conversions: 24, spend: 720, clicks: 410 },
  { weekday: 4, timeOfDay: 3, conversions: 32, spend: 920, clicks: 510 },

  // Sexta
  { weekday: 5, timeOfDay: 0, conversions: 5, spend: 140, clicks: 78 },
  { weekday: 5, timeOfDay: 1, conversions: 18, spend: 560, clicks: 310 },
  { weekday: 5, timeOfDay: 2, conversions: 34, spend: 980, clicks: 548 },
  { weekday: 5, timeOfDay: 3, conversions: 42, spend: 1180, clicks: 640 },

  // Sábado
  { weekday: 6, timeOfDay: 0, conversions: 6, spend: 210, clicks: 98 },
  { weekday: 6, timeOfDay: 1, conversions: 22, spend: 640, clicks: 362 },
  { weekday: 6, timeOfDay: 2, conversions: 38, spend: 1080, clicks: 612 },
  { weekday: 6, timeOfDay: 3, conversions: 54, spend: 1420, clicks: 780 },
];
