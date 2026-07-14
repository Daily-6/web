import {
  Body,
  Controller,
  Get,
  httpError,
  Inject,
  Post,
  Query,
} from "@midwayjs/core";
import { CommentService } from "../service/comment.service";
import { CreateCommentInput } from "../interface";

@Controller("/api")
export class CommentController {
  @Inject()
  commentService: CommentService;

  @Post("/comments")
  async createComment(@Body() body: unknown) {
    const input = body as Record<string, unknown>;
    const userId = Number(input.userId);
    const matchId = Number(input.matchId);
    const content = String(input.content ?? "");

    if (!userId || !matchId) {
      throw new httpError.BadRequestError("userId 和 matchId 为必填项");
    }

    const commentInput: CreateCommentInput = { userId, matchId, content };
    return { data: this.commentService.create(commentInput) };
  }

  @Get("/comments")
  async listComments(@Query("matchId") matchId?: string) {
    if (!matchId) {
      throw new httpError.BadRequestError("请提供 matchId 参数");
    }
    return { data: this.commentService.listByMatch(Number(matchId)) };
  }
}
