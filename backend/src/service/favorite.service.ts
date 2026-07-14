import { httpError, Inject, Provide } from "@midwayjs/core";
import { DatabaseService } from "./database.service";
import { Favorite, CreateFavoriteInput } from "../interface";

type FavoriteRow = {
  id: number;
  user_id: number;
  match_id: number;
  created_at: string;
};

@Provide()
export class FavoriteService {
  @Inject()
  databaseService: DatabaseService;

  add(input: CreateFavoriteInput): Favorite {
    const db = this.databaseService.getDatabase();

    const match = db
      .prepare("SELECT id FROM matches WHERE id = ?")
      .get(input.matchId) as { id: number } | undefined;
    if (!match) {
      throw new httpError.NotFoundError("比赛不存在");
    }

    const user = db
      .prepare("SELECT id FROM users WHERE id = ?")
      .get(input.userId) as { id: number } | undefined;
    if (!user) {
      throw new httpError.NotFoundError("用户不存在");
    }

    const existing = db
      .prepare("SELECT id FROM favorites WHERE user_id = ? AND match_id = ?")
      .get(input.userId, input.matchId) as { id: number } | undefined;
    if (existing) {
      throw new httpError.BadRequestError("已收藏该比赛");
    }

    const result = db
      .prepare("INSERT INTO favorites (user_id, match_id) VALUES (?, ?)")
      .run(input.userId, input.matchId);

    const row = db
      .prepare("SELECT * FROM favorites WHERE id = ?")
      .get(result.lastInsertRowid) as FavoriteRow;
    return mapFavorite(row);
  }

  remove(userId: number, matchId: number): boolean {
    const db = this.databaseService.getDatabase();
    const result = db
      .prepare("DELETE FROM favorites WHERE user_id = ? AND match_id = ?")
      .run(userId, matchId);
    return result.changes > 0;
  }

  listByUser(userId: number): Favorite[] {
    const db = this.databaseService.getDatabase();
    const rows = db
      .prepare(
        "SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC",
      )
      .all(userId) as FavoriteRow[];
    return rows.map(mapFavorite);
  }

  isFavorited(userId: number, matchId: number): boolean {
    const db = this.databaseService.getDatabase();
    const row = db
      .prepare("SELECT id FROM favorites WHERE user_id = ? AND match_id = ?")
      .get(userId, matchId);
    return row !== undefined;
  }
}

function mapFavorite(row: FavoriteRow): Favorite {
  return {
    id: row.id,
    userId: row.user_id,
    matchId: row.match_id,
    createdAt: new Date(`${row.created_at.replace(" ", "T")}Z`).toISOString(),
  };
}
