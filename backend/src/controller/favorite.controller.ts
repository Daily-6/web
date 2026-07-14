import {
  Body,
  Controller,
  Del,
  Get,
  httpError,
  Inject,
  Post,
  Query,
} from "@midwayjs/core";
import { FavoriteService } from "../service/favorite.service";
import { CreateFavoriteInput } from "../interface";

@Controller("/api")
export class FavoriteController {
  @Inject()
  favoriteService: FavoriteService;

  @Post("/favorites")
  async addFavorite(@Body() body: unknown) {
    const input = body as Record<string, unknown>;
    const userId = Number(input.userId);
    const matchId = Number(input.matchId);

    if (!userId || !matchId) {
      throw new httpError.BadRequestError("userId 和 matchId 为必填项");
    }

    const favInput: CreateFavoriteInput = { userId, matchId };
    return { data: this.favoriteService.add(favInput) };
  }

  @Del("/favorites")
  async removeFavorite(
    @Query("userId") userId?: string,
    @Query("matchId") matchId?: string,
  ) {
    if (!userId || !matchId) {
      throw new httpError.BadRequestError("userId 和 matchId 为必填项");
    }
    const removed = this.favoriteService.remove(
      Number(userId),
      Number(matchId),
    );
    if (!removed) {
      throw new httpError.NotFoundError("收藏记录不存在");
    }
    return { data: { removed: true } };
  }

  @Get("/favorites")
  async listFavorites(
    @Query("userId") userId?: string,
    @Query("matchId") matchId?: string,
  ) {
    if (userId && matchId) {
      const favorited = this.favoriteService.isFavorited(
        Number(userId),
        Number(matchId),
      );
      return { data: { favorited } };
    }
    if (userId) {
      return { data: this.favoriteService.listByUser(Number(userId)) };
    }
    throw new httpError.BadRequestError("请提供 userId 参数");
  }
}
