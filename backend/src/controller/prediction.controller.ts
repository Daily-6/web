import {
  Body,
  Controller,
  Get,
  httpError,
  Inject,
  Post,
  Query,
} from "@midwayjs/core";
import { PredictionService } from "../service/prediction.service";
import { CreatePredictionInput } from "../interface";

@Controller("/api")
export class PredictionController {
  @Inject()
  predictionService: PredictionService;

  @Post("/predictions")
  async createPrediction(@Body() body: unknown) {
    const input = body as Record<string, unknown>;
    const userId = Number(input.userId);
    const matchId = Number(input.matchId);
    const homeScore = Number(input.homeScore);
    const awayScore = Number(input.awayScore);

    if (!userId || !matchId) {
      throw new httpError.BadRequestError("userId 和 matchId 为必填项");
    }
    if (
      !Number.isInteger(homeScore) ||
      !Number.isInteger(awayScore) ||
      homeScore < 0 ||
      awayScore < 0
    ) {
      throw new httpError.BadRequestError("比分必须是有效的非负整数");
    }

    const predictionInput: CreatePredictionInput = {
      userId,
      matchId,
      homeScore,
      awayScore,
    };
    return { data: this.predictionService.create(predictionInput) };
  }

  @Get("/predictions")
  async getPredictions(
    @Query("userId") userId?: string,
    @Query("matchId") matchId?: string,
  ) {
    if (userId && matchId) {
      const prediction = this.predictionService.getByUserAndMatch(
        Number(userId),
        Number(matchId),
      );
      return { data: prediction || null };
    }
    if (userId) {
      return {
        data: this.predictionService.listByUser(Number(userId)),
      };
    }
    if (matchId) {
      return {
        data: this.predictionService.listByMatch(Number(matchId)),
      };
    }
    throw new httpError.BadRequestError("请提供 userId 或 matchId 参数");
  }
}
