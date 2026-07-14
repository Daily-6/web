export type Team = {
  id: number;
  name: string;
  shortName: string;
  country: string;
  groupName: string;
  logoUrl: string;
};

export type Stadium = {
  id: number;
  name: string;
  city: string;
  country: string;
  capacity: number;
};

export type Match = {
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
};

export type Prediction = {
  id: number;
  userId: number;
  matchId: number;
  homeScore: number;
  awayScore: number;
  createdAt: string;
  updatedAt: string;
};

export type Comment = {
  id: number;
  userId: number;
  matchId: number;
  content: string;
  createdAt: string;
  username?: string;
};

export type Favorite = {
  id: number;
  userId: number;
  matchId: number;
  createdAt: string;
};

export type StandingEntry = {
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
};

export type GroupStandings = {
  groupName: string;
  teams: StandingEntry[];
};

export type ApiResponse<T> = {
  data: T;
};
