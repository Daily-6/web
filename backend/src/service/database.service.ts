import { Config, Destroy, Init, Provide } from "@midwayjs/core";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getTeamNameZh } from "../utils/team-names";

interface SeedTeam {
  id: string;
  name_en: string;
  flag: string;
  fifa_code: string;
  groups: string;
}

interface SeedGame {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  group: string;
  local_date: string;
  stadium_id: string;
  finished: string;
  type: string;
}

interface SeedStadium {
  id: string;
  name_en: string;
  city_en: string;
  country_en: string;
  capacity: number;
}

@Provide()
export class DatabaseService {
  @Config("courseDatabase.path")
  databasePath: string;

  private database: DatabaseSync;

  @Init()
  async initialize() {
    const absolutePath = resolve(process.cwd(), this.databasePath);
    mkdirSync(dirname(absolutePath), { recursive: true });
    this.database = new DatabaseSync(absolutePath);
    this.database.exec("PRAGMA journal_mode=WAL");
    this.database.exec("PRAGMA foreign_keys=ON");
    this.createTables();

    const teamRow = this.database
      .prepare("SELECT COUNT(*) AS total FROM teams")
      .get() as { total: number };
    if (teamRow.total === 0) {
      this.seedFromJson();
    }
  }

  getDatabase(): DatabaseSync {
    return this.database;
  }

  private createTables() {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        short_name TEXT NOT NULL,
        country TEXT NOT NULL,
        group_name TEXT NOT NULL,
        logo_url TEXT DEFAULT ''
      )
    `);

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS stadiums (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        country TEXT NOT NULL,
        capacity INTEGER DEFAULT 0
      )
    `);

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY,
        home_team_id INTEGER NOT NULL REFERENCES teams(id),
        away_team_id INTEGER NOT NULL REFERENCES teams(id),
        home_score INTEGER,
        away_score INTEGER,
        match_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','live','finished')),
        stage TEXT NOT NULL DEFAULT 'group' CHECK(stage IN ('group','round16','quarter','semi','third','final')),
        venue TEXT DEFAULT '',
        group_name TEXT DEFAULT ''
      )
    `);

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        match_id INTEGER NOT NULL REFERENCES matches(id),
        home_score INTEGER NOT NULL,
        away_score INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, match_id)
      )
    `);

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        match_id INTEGER NOT NULL REFERENCES matches(id),
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        match_id INTEGER NOT NULL REFERENCES matches(id),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, match_id)
      )
    `);
  }

  private seedFromJson() {
    const dataDir = resolve(process.cwd(), "backend", "data");
    const dataDirAlt = resolve(process.cwd(), "data");

    this.database.exec(`
      INSERT OR IGNORE INTO courses (id, title, description) VALUES
        (1, 'HTML 与 CSS', '构建语义清晰、响应式且可访问的页面。'),
        (2, 'React 与 Next.js', '理解组件、状态、路由和服务端渲染。'),
        (3, 'API 与数据持久化', '使用 Midway.js、OpenAPI 和 SQLite 完成全栈闭环。')
    `);

    this.database.exec(`
      INSERT OR IGNORE INTO users (id, username) VALUES
        (1, 'demo_user'),
        (2, 'football_fan'),
        (3, 'soccer_lover')
    `);

    const dir = existsSync(dataDir) ? dataDir : dataDirAlt;
    this.seedTeams(dir);
    this.seedStadiums(dir);
    this.seedMatches(dir);
  }

  private seedTeams(dataDir: string) {
    const filePath = join(dataDir, "teams.json");
    if (!existsSync(filePath)) return;
    const data = JSON.parse(readFileSync(filePath, "utf-8")) as {
      teams: SeedTeam[];
    };
    const insert = this.database.prepare(
      "INSERT OR IGNORE INTO teams (id, name, short_name, country, group_name, logo_url) VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (const t of data.teams) {
      const nameZh = getTeamNameZh(t.id);
      insert.run(Number(t.id), nameZh, t.fifa_code, nameZh, t.groups, t.flag);
    }
  }

  private seedStadiums(dataDir: string) {
    const filePath = join(dataDir, "stadiums.json");
    if (!existsSync(filePath)) return;
    const data = JSON.parse(readFileSync(filePath, "utf-8")) as {
      stadiums: SeedStadium[];
    };
    const insert = this.database.prepare(
      "INSERT OR IGNORE INTO stadiums (id, name, city, country, capacity) VALUES (?, ?, ?, ?, ?)",
    );
    for (const s of data.stadiums) {
      insert.run(Number(s.id), s.name_en, s.city_en, s.country_en, s.capacity);
    }
  }

  private seedMatches(dataDir: string) {
    const filePath = join(dataDir, "games.json");
    if (!existsSync(filePath)) return;
    const data = JSON.parse(readFileSync(filePath, "utf-8")) as {
      games: SeedGame[];
    };
    this.database.exec("PRAGMA foreign_keys=OFF");
    const insert = this.database.prepare(
      "INSERT OR IGNORE INTO matches (id, home_team_id, away_team_id, home_score, away_score, match_date, status, stage, venue, group_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    for (const g of data.games) {
      const finished = g.finished === "TRUE";
      const matchDate = this.parseDate(g.local_date);
      insert.run(
        Number(g.id),
        Number(g.home_team_id),
        Number(g.away_team_id),
        g.home_score ? Number(g.home_score) : null,
        g.away_score ? Number(g.away_score) : null,
        matchDate,
        finished ? "finished" : "scheduled",
        g.type,
        g.stadium_id,
        g.group,
      );
    }
    this.database.exec("PRAGMA foreign_keys=ON");
  }

  private parseDate(localDate: string): string {
    const parts = localDate.split(" ");
    const datePart = parts[0];
    const timePart = parts[1] ?? "00:00";
    const [month, day, year] = datePart.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${timePart}:00`;
  }

  @Destroy()
  async close() {
    this.database?.close();
  }
}
