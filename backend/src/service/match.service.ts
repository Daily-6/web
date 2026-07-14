import { Inject, Provide } from "@midwayjs/core";
import { DatabaseService } from "./database.service";
import {
  Match,
  MatchResultInput,
  StandingEntry,
  GroupStandings,
  Stadium,
} from "../interface";

type MatchRow = {
  id: number;
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
  match_date: string;
  status: string;
  stage: string;
  venue: string;
  group_name: string;
};

type TeamRow = {
  id: number;
  name: string;
  short_name: string;
  country: string;
  group_name: string;
  logo_url: string;
};

type StadiumRow = {
  id: number;
  name: string;
  city: string;
  country: string;
  capacity: number;
};

@Provide()
export class MatchService {
  @Inject()
  databaseService: DatabaseService;

  list(params?: {
    status?: string;
    stage?: string;
    groupName?: string;
  }): Match[] {
    const db = this.databaseService.getDatabase();
    let sql = "SELECT m.* FROM matches m";
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (params?.groupName) {
      conditions.push("m.group_name = ?");
      values.push(params.groupName);
    }
    if (params?.status) {
      conditions.push("m.status = ?");
      values.push(params.status);
    }
    if (params?.stage) {
      conditions.push("m.stage = ?");
      values.push(params.stage);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY m.match_date, m.id ASC";

    const rows = (db.prepare(sql).all as (...args: unknown[]) => MatchRow[])(
      ...values,
    );
    return rows.map((row) => this.enrichMatch(row));
  }

  getById(id: number): Match | undefined {
    const db = this.databaseService.getDatabase();
    const row = db.prepare("SELECT * FROM matches WHERE id = ?").get(id) as
      MatchRow | undefined;
    return row ? this.enrichMatch(row) : undefined;
  }

  updateResult(id: number, input: MatchResultInput): Match | undefined {
    const db = this.databaseService.getDatabase();
    const result = db
      .prepare(
        "UPDATE matches SET home_score = ?, away_score = ?, status = 'finished' WHERE id = ?",
      )
      .run(input.homeScore, input.awayScore, id);
    if (result.changes === 0) return undefined;
    const row = db
      .prepare("SELECT * FROM matches WHERE id = ?")
      .get(id) as MatchRow;
    return this.enrichMatch(row);
  }

  getStandings(): GroupStandings[] {
    const db = this.databaseService.getDatabase();
    const matchRows = db
      .prepare("SELECT * FROM matches WHERE status = 'finished'")
      .all() as MatchRow[];
    const teamRows = db
      .prepare("SELECT * FROM teams ORDER BY group_name, id")
      .all() as TeamRow[];

    const groups = new Map<string, TeamRow[]>();
    for (const t of teamRows) {
      const list = groups.get(t.group_name) || [];
      list.push(t);
      groups.set(t.group_name, list);
    }

    const result: GroupStandings[] = [];
    for (const [groupName, teams] of groups) {
      const standings = this.calculateGroupStandings(teams, matchRows);
      result.push({ groupName, teams: standings });
    }
    return result;
  }

  getStadiums(): Stadium[] {
    const db = this.databaseService.getDatabase();
    const rows = db
      .prepare("SELECT * FROM stadiums ORDER BY id")
      .all() as StadiumRow[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      city: r.city,
      country: r.country,
      capacity: r.capacity,
    }));
  }

  private calculateGroupStandings(
    teams: TeamRow[],
    matches: MatchRow[],
  ): StandingEntry[] {
    const stats = new Map<number, StandingEntry>();

    for (const team of teams) {
      stats.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        shortName: team.short_name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      });
    }

    for (const m of matches) {
      if (m.home_score === null || m.away_score === null) continue;
      const home = stats.get(m.home_team_id);
      const away = stats.get(m.away_team_id);
      if (!home || !away) continue;

      home.played++;
      away.played++;
      home.goalsFor += m.home_score;
      home.goalsAgainst += m.away_score;
      away.goalsFor += m.away_score;
      away.goalsAgainst += m.home_score;

      if (m.home_score > m.away_score) {
        home.won++;
        home.points += 3;
        away.lost++;
      } else if (m.home_score < m.away_score) {
        away.won++;
        away.points += 3;
        home.lost++;
      } else {
        home.drawn++;
        away.drawn++;
        home.points += 1;
        away.points += 1;
      }
    }

    const standings = Array.from(stats.values());
    for (const s of standings) {
      s.goalDifference = s.goalsFor - s.goalsAgainst;
    }
    standings.sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor,
    );
    return standings;
  }

  private enrichMatch(row: MatchRow): Match {
    const db = this.databaseService.getDatabase();
    const homeTeam = db
      .prepare("SELECT * FROM teams WHERE id = ?")
      .get(row.home_team_id) as TeamRow | undefined;
    const awayTeam = db
      .prepare("SELECT * FROM teams WHERE id = ?")
      .get(row.away_team_id) as TeamRow | undefined;

    let venueName = "";
    if (row.venue) {
      const stadium = db
        .prepare("SELECT name FROM stadiums WHERE id = ?")
        .get(Number(row.venue)) as { name: string } | undefined;
      venueName = stadium?.name ?? "";
    }

    return {
      id: row.id,
      homeTeamId: row.home_team_id,
      awayTeamId: row.away_team_id,
      homeScore: row.home_score,
      awayScore: row.away_score,
      matchDate: this.parseMatchDate(row.match_date),
      status: row.status as Match["status"],
      stage: row.stage as Match["stage"],
      venue: venueName,
      groupName: row.group_name,
      homeTeam: homeTeam
        ? {
            id: homeTeam.id,
            name: homeTeam.name,
            shortName: homeTeam.short_name,
            country: homeTeam.country,
            groupName: homeTeam.group_name,
            logoUrl: homeTeam.logo_url,
          }
        : undefined,
      awayTeam: awayTeam
        ? {
            id: awayTeam.id,
            name: awayTeam.name,
            shortName: awayTeam.short_name,
            country: awayTeam.country,
            groupName: awayTeam.group_name,
            logoUrl: awayTeam.logo_url,
          }
        : undefined,
    };
  }

  private parseMatchDate(dateStr: string): string {
    try {
      const d = new Date(`${dateStr.replace(" ", "T")}Z`);
      if (isNaN(d.getTime())) return dateStr;
      return d.toISOString();
    } catch {
      return dateStr;
    }
  }
}
