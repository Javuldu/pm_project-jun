import { Match, Team, User } from './types';

export const TEAMS: Record<string, Team> = {
  // CONCACAF (6)
  mx: { id: 'mx', name: 'México', code: 'MEX' },
  us: { id: 'us', name: 'Estados Unidos', code: 'USA' },
  ca: { id: 'ca', name: 'Canadá', code: 'CAN' },
  pa: { id: 'pa', name: 'Panamá', code: 'PAN' },
  cr: { id: 'cr', name: 'Curazao', code: 'CUW' },
  jm: { id: 'jm', name: 'Haití', code: 'HAI' },
  
  // CONMEBOL (6)
  ar: { id: 'ar', name: 'Argentina', code: 'ARG' },
  br: { id: 'br', name: 'Brasil', code: 'BRA' },
  uy: { id: 'uy', name: 'Uruguay', code: 'URU' },
  co: { id: 'co', name: 'Colombia', code: 'COL' },
  ec: { id: 'ec', name: 'Ecuador', code: 'ECU' },
  ve: { id: 've', name: 'Paraguay', code: 'PAR' },
  
  // UEFA (16)
  fr: { id: 'fr', name: 'Francia', code: 'FRA' },
  en: { id: 'en', name: 'Inglaterra', code: 'ENG' },
  es: { id: 'es', name: 'España', code: 'ESP' },
  de: { id: 'de', name: 'Alemania', code: 'GER' },
  pt: { id: 'pt', name: 'Portugal', code: 'POR' },
  it: { id: 'it', name: 'Bosnia y Herzegovina', code: 'BIH' },
  nl: { id: 'nl', name: 'Países Bajos', code: 'NED' },
  be: { id: 'be', name: 'Bélgica', code: 'BEL' },
  hr: { id: 'hr', name: 'Croacia', code: 'CRO' },
  ch: { id: 'ch', name: 'Suiza', code: 'SUI' },
  dk: { id: 'dk', name: 'Escocia', code: 'SCO' },
  rs: { id: 'rs', name: 'Noruega', code: 'NOR' },
  pl: { id: 'pl', name: 'República Checa', code: 'CZE' },
  at: { id: 'at', name: 'Austria', code: 'AUT' },
  ua: { id: 'ua', name: 'Turquía', code: 'TUR' },
  se: { id: 'se', name: 'Suecia', code: 'SWE' },
  
  // CAF (9)
  ma: { id: 'ma', name: 'Marruecos', code: 'MAR' },
  sn: { id: 'sn', name: 'Senegal', code: 'SEN' },
  eg: { id: 'eg', name: 'Egipto', code: 'EGY' },
  dz: { id: 'dz', name: 'Argelia', code: 'ALG' },
  ng: { id: 'ng', name: 'Cabo Verde', code: 'CPV' },
  tn: { id: 'tn', name: 'Túnez', code: 'TUN' },
  cm: { id: 'cm', name: 'Ghana', code: 'GHA' },
  ml: { id: 'ml', name: 'Sudáfrica', code: 'RSA' },
  ci: { id: 'ci', name: 'Costa de Marfil', code: 'CIV' },
  
  // AFC (8)
  jp: { id: 'jp', name: 'Japón', code: 'JPN' },
  ir: { id: 'ir', name: 'Irán', code: 'IRN' },
  kr: { id: 'kr', name: 'Corea del Sur', code: 'KOR' },
  au: { id: 'au', name: 'Australia', code: 'AUS' },
  sa: { id: 'sa', name: 'Arabia Saudita', code: 'KSA' },
  qa: { id: 'qa', name: 'Qatar', code: 'QAT' },
  iq: { id: 'iq', name: 'Irak', code: 'IRQ' },
  ae: { id: 'ae', name: 'Congo', code: 'COD' },
  
  // OFC (1)
  nz: { id: 'nz', name: 'Nueva Zelanda', code: 'NZL' },
  
  // Repesca (2)
  pe: { id: 'pe', name: 'Jordania', code: 'JOR' },
  hn: { id: 'hn', name: 'Uzbekistán', code: 'UZB' }
};

export const INITIAL_MATCHES: Match[] = [
  { id: 'm1', teamA: TEAMS.mx, teamB: TEAMS.cr, date: '2026-06-11T14:00', stage: 'Grupos', isFinished: false },
  { id: 'm2', teamA: TEAMS.us, teamB: TEAMS.au, date: '2026-06-11T18:00', stage: 'Grupos', isFinished: false },
  { id: 'm3', teamA: TEAMS.ca, teamB: TEAMS.jp, date: '2026-06-12T11:00', stage: 'Grupos', isFinished: false },
  { id: 'm4', teamA: TEAMS.ec, teamB: TEAMS.sn, date: '2026-06-12T16:00', stage: 'Grupos', isFinished: false },
  { id: 'm5', teamA: TEAMS.br, teamB: TEAMS.fr, date: '2026-06-13T10:00', stage: 'Grupos', isFinished: false },
  { id: 'm6', teamA: TEAMS.ar, teamB: TEAMS.co, date: '2026-06-13T13:00', stage: 'Grupos', isFinished: false },
  { id: 'm7', teamA: TEAMS.es, teamB: TEAMS.en, date: '2026-06-13T16:00', stage: 'Grupos', isFinished: false },
  { id: 'm8', teamA: TEAMS.de, teamB: TEAMS.it, date: '2026-06-13T19:00', stage: 'Grupos', isFinished: false }
];

export const INITIAL_USERS: User[] = [];
