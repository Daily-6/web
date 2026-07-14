import { Provide } from "@midwayjs/core";
import { DatabaseSync } from "node:sqlite";
import { getTeamNameZh } from "../utils/team-names";

const API_BASE = "https://worldcup26.ir";

interface ApiTeam {
  id: string;
  name_en: string;
  flag: string;
  fifa_code: string;
  iso2: string;
  groups: string;
}

interface ApiGame {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  group: string;
  matchday: string;
  local_date: string;
  stadium_id: string;
  finished: string;
  time_elapsed: string;
  type: string;
  home_team_name_en: string;
  away_team_name_en: string;
}

interface ApiStadium {
  id: string;
  name_en: string;
  fifa_name: string;
  city_en: string;
  country_en: string;
  capacity: number;
}

@Provide()
export class SyncService {
  async syncFromApi(database: DatabaseSync): Promise<boolean> {
    try {
      const teamsRes = await fetch(`${API_BASE}/get/teams`);
      const gamesRes = await fetch(`${API_BASE}/get/games`);
      const stadiumsRes = await fetch(`${API_BASE}/get/stadiums`);

      if (!teamsRes.ok || !gamesRes.ok || !stadiumsRes.ok) {
        return false;
      }

      const teamsData = (await teamsRes.json()) as { teams: ApiTeam[] };
      const gamesData = (await gamesRes.json()) as { games: ApiGame[] };
      const stadiumsData = (await stadiumsRes.json()) as {
        stadiums: ApiStadium[];
      };

      this.syncTeams(database, teamsData.teams);
      this.syncStadiums(database, stadiumsData.stadiums);
      this.syncMatches(database, gamesData.games);

      return true;
    } catch {
      return false;
    }
  }

  private syncTeams(database: DatabaseSync, teams: ApiTeam[]) {
    database.exec("DELETE FROM teams");
    const insert = database.prepare(
      "INSERT INTO teams (id, name, short_name, country, group_name, logo_url) VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (const t of teams) {
      const nameZh = getTeamNameZh(t.id);
      insert.run(Number(t.id), nameZh, t.fifa_code, nameZh, t.groups, t.flag);
    }
  }

  private syncStadiums(database: DatabaseSync, stadiums: ApiStadium[]) {
    database.exec("DELETE FROM stadiums");
    const insert = database.prepare(
      "INSERT INTO stadiums (id, name, city, country, capacity) VALUES (?, ?, ?, ?, ?)",
    );
    for (const s of stadiums) {
      insert.run(Number(s.id), s.name_en, s.city_en, s.country_en, s.capacity);
    }
  }

  private syncMatches(database: DatabaseSync, games: ApiGame[]) {
    database.exec("DELETE FROM matches");
    const insert = database.prepare(
      "INSERT INTO matches (id, home_team_id, away_team_id, home_score, away_score, match_date, status, stage, venue, group_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    for (const g of games) {
      const finished = g.finished === "TRUE";
      const status = finished ? "finished" : "scheduled";
      const matchDate = this.parseDate(g.local_date);
      insert.run(
        Number(g.id),
        Number(g.home_team_id),
        Number(g.away_team_id),
        g.home_score ? Number(g.home_score) : null,
        g.away_score ? Number(g.away_score) : null,
        matchDate,
        status,
        g.type,
        g.stadium_id,
        g.group,
      );
    }
  }

  private parseDate(localDate: string): string {
    const parts = localDate.split(" ");
    const datePart = parts[0];
    const timePart = parts[1] ?? "00:00";
    const [month, day, year] = datePart.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${timePart}:00`;
  }
}
