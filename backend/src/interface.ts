export interface Course {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

export interface CreateCourseInput {
  title: string;
  description: string;
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  country: string;
  groupName: string;
  logoUrl: string;
}

export interface Stadium {
  id: number;
  name: string;
  city: string;
  country: string;
  capacity: number;
}

export interface Match {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string;
  status: "scheduled" | "live" | "finished";
  stage: "group" | "round32" | "round16" | "quarter" | "semi" | "third" | "final";
  venue: string;
  groupName: string;
  homeTeam?: Team;
  awayTeam?: Team;
}

export interface User {
  id: number;
  username: string;
  createdAt: string;
}

export interface Prediction {
  id: number;
  userId: number;
  matchId: number;
  homeScore: number;
  awayScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePredictionInput {
  userId: number;
  matchId: number;
  homeScore: number;
  awayScore: number;
}

export interface Comment {
  id: number;
  userId: number;
  matchId: number;
  content: string;
  createdAt: string;
  username?: string;
}

export interface CreateCommentInput {
  userId: number;
  matchId: number;
  content: string;
}

export interface Favorite {
  id: number;
  userId: number;
  matchId: number;
  createdAt: string;
}

export interface CreateFavoriteInput {
  userId: number;
  matchId: number;
}

export interface MatchResultInput {
  homeScore: number;
  awayScore: number;
}

export interface StandingEntry {
  teamId: number;
  teamName: string;
  shortName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface GroupStandings {
  groupName: string;
  teams: StandingEntry[];
}
