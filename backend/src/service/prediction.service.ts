import { httpError, Inject, Provide } from "@midwayjs/core";
import { DatabaseService } from "./database.service";
import { CreatePredictionInput, Prediction } from "../interface";

type PredictionRow = {
  id: number;
  user_id: number;
  match_id: number;
  home_score: number;
  away_score: number;
  created_at: string;
  updated_at: string;
};

type MatchRow = {
  id: number;
  match_date: string;
  status: string;
};

@Provide()
export class PredictionService {
  @Inject()
  databaseService: DatabaseService;

  create(input: CreatePredictionInput): Prediction {
    const db = this.databaseService.getDatabase();

    const match = db
      .prepare("SELECT id, match_date, status FROM matches WHERE id = ?")
      .get(input.matchId) as MatchRow | undefined;
    if (!match) {
      throw new httpError.NotFoundError("比赛不存在");
    }

    const matchDate = new Date(match.match_date.replace(" ", "T") + "Z");
    if (match.status !== "scheduled" || matchDate <= new Date()) {
      throw new httpError.BadRequestError("比赛已开始或已结束，无法预测");
    }

    const user = db
      .prepare("SELECT id FROM users WHERE id = ?")
      .get(input.userId) as { id: number } | undefined;
    if (!user) {
      throw new httpError.NotFoundError("用户不存在");
    }

    const existing = db
      .prepare("SELECT id FROM predictions WHERE user_id = ? AND match_id = ?")
      .get(input.userId, input.matchId) as { id: number } | undefined;

    if (existing) {
      const result = db
        .prepare(
          "UPDATE predictions SET home_score = ?, away_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        )
        .run(input.homeScore, input.awayScore, existing.id);
      const row = db
        .prepare("SELECT * FROM predictions WHERE id = ?")
        .get(existing.id) as PredictionRow;
      return mapPrediction(row);
    }

    const result = db
      .prepare(
        "INSERT INTO predictions (user_id, match_id, home_score, away_score) VALUES (?, ?, ?, ?)",
      )
      .run(input.userId, input.matchId, input.homeScore, input.awayScore);

    const row = db
      .prepare("SELECT * FROM predictions WHERE id = ?")
      .get(result.lastInsertRowid) as PredictionRow;
    return mapPrediction(row);
  }

  getByUserAndMatch(userId: number, matchId: number): Prediction | undefined {
    const db = this.databaseService.getDatabase();
    const row = db
      .prepare("SELECT * FROM predictions WHERE user_id = ? AND match_id = ?")
      .get(userId, matchId) as PredictionRow | undefined;
    return row ? mapPrediction(row) : undefined;
  }

  listByUser(userId: number): Prediction[] {
    const db = this.databaseService.getDatabase();
    const rows = db
      .prepare(
        "SELECT * FROM predictions WHERE user_id = ? ORDER BY created_at DESC",
      )
      .all(userId) as PredictionRow[];
    return rows.map(mapPrediction);
  }

  listByMatch(matchId: number): Prediction[] {
    const db = this.databaseService.getDatabase();
    const rows = db
      .prepare(
        "SELECT * FROM predictions WHERE match_id = ? ORDER BY created_at DESC",
      )
      .all(matchId) as PredictionRow[];
    return rows.map(mapPrediction);
  }
}

function mapPrediction(row: PredictionRow): Prediction {
  return {
    id: row.id,
    userId: row.user_id,
    matchId: row.match_id,
    homeScore: row.home_score,
    awayScore: row.away_score,
    createdAt: new Date(`${row.created_at.replace(" ", "T")}Z`).toISOString(),
    updatedAt: new Date(`${row.updated_at.replace(" ", "T")}Z`).toISOString(),
  };
}
