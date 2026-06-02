export type Stage = 'Grupos' | 'Octavos' | 'Cuartos' | 'Semifinal' | 'Final';

export interface Team {
  id: string;
  name: string;
  code: string; // e.g., AR, BR, FR
}

export interface Match {
  id: string;
  teamA: Team;
  teamB: Team;
  date: string;
  stage: Stage;
  // Real results
  realScoreA?: number;
  realScoreB?: number;
  realPenaltiesWinner?: string; // teamId
  isFinished: boolean;
  isLocked?: boolean;
}

export interface Prediction {
  matchId: string;
  scoreA?: number | '';
  scoreB?: number | '';
  penaltiesWinner?: string; // teamId if draw in knockout
}

export interface User {
  id: string;
  name: string;
  avatarUrl?: string; // Can be uploaded
  championPrediction?: string; // teamId
  points: number;
}

export type ViewState = 'welcome' | 'predictions' | 'ranking' | 'adminLogin' | 'adminPanel' | 'profile';
