import { httpError, Inject, Provide } from "@midwayjs/core";
import { DatabaseService } from "./database.service";
import { Comment, CreateCommentInput } from "../interface";

type CommentRow = {
  id: number;
  user_id: number;
  match_id: number;
  content: string;
  created_at: string;
  username: string;
};

@Provide()
export class CommentService {
  @Inject()
  databaseService: DatabaseService;

  create(input: CreateCommentInput): Comment {
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

    if (!input.content || input.content.trim().length === 0) {
      throw new httpError.BadRequestError("评论内容不能为空");
    }
    if (input.content.trim().length > 500) {
      throw new httpError.BadRequestError("评论内容不能超过500个字符");
    }

    const result = db
      .prepare(
        "INSERT INTO comments (user_id, match_id, content) VALUES (?, ?, ?)",
      )
      .run(input.userId, input.matchId, input.content.trim());

    const row = db
      .prepare(
        "SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?",
      )
      .get(result.lastInsertRowid) as CommentRow;
    return mapComment(row);
  }

  listByMatch(matchId: number): Comment[] {
    const db = this.databaseService.getDatabase();
    const rows = db
      .prepare(
        "SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.match_id = ? ORDER BY c.created_at DESC",
      )
      .all(matchId) as CommentRow[];
    return rows.map(mapComment);
  }
}

function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    userId: row.user_id,
    matchId: row.match_id,
    content: row.content,
    createdAt: new Date(`${row.created_at.replace(" ", "T")}Z`).toISOString(),
    username: row.username,
  };
}
