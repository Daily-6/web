import { Inject, Provide } from "@midwayjs/core";
import { DatabaseService } from "./database.service";
import { Team } from "../interface";

type TeamRow = {
  id: number;
  name: string;
  short_name: string;
  country: string;
  group_name: string;
  logo_url: string;
};

@Provide()
export class TeamService {
  @Inject()
  databaseService: DatabaseService;

  list(): Team[] {
    const db = this.databaseService.getDatabase();
    const rows = db
      .prepare("SELECT * FROM teams ORDER BY group_name, id")
      .all() as TeamRow[];
    return rows.map(mapTeam);
  }

  getById(id: number): Team | undefined {
    const db = this.databaseService.getDatabase();
    const row = db.prepare("SELECT * FROM teams WHERE id = ?").get(id) as
      TeamRow | undefined;
    return row ? mapTeam(row) : undefined;
  }

  listByGroup(groupName: string): Team[] {
    const db = this.databaseService.getDatabase();
    const rows = db
      .prepare("SELECT * FROM teams WHERE group_name = ? ORDER BY id")
      .all(groupName) as TeamRow[];
    return rows.map(mapTeam);
  }
}

function mapTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    country: row.country,
    groupName: row.group_name,
    logoUrl: row.logo_url,
  };
}
