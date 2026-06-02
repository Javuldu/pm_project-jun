import { Match, Team, User } from './types';

export const TEAMS: Record<string, Team> = {
  // CONCACAF (6)
  mx: { id: 'mx', name: 'México', code: 'MX' },
  us: { id: 'us', name: 'Estados Unidos', code: 'US' },
  ca: { id: 'ca', name: 'Canadá', code: 'CA' },
  pa: { id: 'pa', name: 'Panamá', code: 'PA' },
  cr: { id: 'cr', name: 'Curazao', code: 'CZ' },
  jm: { id: 'jm', name: 'Haití', code: 'HT' },
  
  // CONMEBOL (6)
  ar: { id: 'ar', name: 'Argentina', code: 'AR' },
  br: { id: 'br', name: 'Brasil', code: 'BR' },
  uy: { id: 'uy', name: 'Uruguay', code: 'UY' },
  co: { id: 'co', name: 'Colombia', code: 'CO' },
  ec: { id: 'ec', name: 'Ecuador', code: 'EC' },
  ve: { id: 've', name: 'Paraguay', code: 'PY' },
  
  // UEFA (16)
  fr: { id: 'fr', name: 'Francia', code: 'FR' },
  en: { id: 'en', name: 'Inglaterra', code: 'EN' },
  es: { id: 'es', name: 'España', code: 'ES' },
  de: { id: 'de', name: 'Alemania', code: 'DE' },
  pt: { id: 'pt', name: 'Portugal', code: 'PT' },
  it: { id: 'it', name: 'Bosnia y Herzegovina', code: 'BH' },
  nl: { id: 'nl', name: 'Países Bajos', code: 'NL' },
  be: { id: 'be', name: 'Bélgica', code: 'BE' },
  hr: { id: 'hr', name: 'Croacia', code: 'HR' },
  ch: { id: 'ch', name: 'Suiza', code: 'CH' },
  dk: { id: 'dk', name: 'Escocia', code: 'SCO' },
  rs: { id: 'rs', name: 'Noruega', code: 'NO' },
  pl: { id: 'pl', name: 'República Checa', code: 'RC' },
  at: { id: 'at', name: 'Austria', code: 'AT' },
  ua: { id: 'ua', name: 'Turquía', code: 'TQ' },
  se: { id: 'se', name: 'Suecia', code: 'SE' },
  
  // CAF (9)
  ma: { id: 'ma', name: 'Marruecos', code: 'MA' },
  sn: { id: 'sn', name: 'Senegal', code: 'SN' },
  eg: { id: 'eg', name: 'Egipto', code: 'EG' },
  dz: { id: 'dz', name: 'Argelia', code: 'DZ' },
  ng: { id: 'ng', name: 'Cabo Verde', code: 'CV' },
  tn: { id: 'tn', name: 'Túnez', code: 'TN' },
  cm: { id: 'cm', name: 'Ghana', code: 'GN' },
  ml: { id: 'ml', name: 'Sudáfrica', code: 'SD' },
  ci: { id: 'ci', name: 'Costa de Marfil', code: 'CI' },
  
  // AFC (8)
  jp: { id: 'jp', name: 'Japón', code: 'JP' },
  ir: { id: 'ir', name: 'Irán', code: 'IR' },
  kr: { id: 'kr', name: 'Corea del Sur', code: 'KR' },
  au: { id: 'au', name: 'Australia', code: 'AU' },
  sa: { id: 'sa', name: 'Arabia Saudita', code: 'SA' },
  qa: { id: 'qa', name: 'Qatar', code: 'QA' },
  iq: { id: 'iq', name: 'Irak', code: 'IQ' },
  ae: { id: 'ae', name: 'Congo', code: 'RDC' },
  
  // OFC (1)
  nz: { id: 'nz', name: 'Nueva Zelanda', code: 'NZ' },
  
  // Repesca (2 ficticios usando placeholders estándar para llegar a 48)
  pe: { id: 'pe', name: 'Jordania', code: 'JD' },
  hn: { id: 'hn', name: 'Uzbekistán', code: 'UK' }
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
