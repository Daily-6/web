import {
  Body,
  Controller,
  Get,
  httpError,
  Inject,
  Param,
  Post,
  Query,
} from "@midwayjs/core";
import { MatchService } from "../service/match.service";
import { MatchResultInput } from "../interface";

@Controller("/api")
export class MatchController {
  @Inject()
  matchService: MatchService;

  @Get("/matches")
  async listMatches(
    @Query("status") status?: string,
    @Query("stage") stage?: string,
    @Query("groupName") groupName?: string,
  ) {
    return { data: this.matchService.list({ status, stage, groupName }) };
  }

  @Get("/matches/:id")
  async getMatch(@Param("id") id: string) {
    const match = this.matchService.getById(Number(id));
    if (!match) {
      throw new httpError.NotFoundError("比赛不存在");
    }
    return { data: match };
  }

  @Post("/matches/:id/result")
  async updateResult(@Param("id") id: string, @Body() body: unknown) {
    const input = body as MatchResultInput;
    if (
      typeof input.homeScore !== "number" ||
      typeof input.awayScore !== "number" ||
      input.homeScore < 0 ||
      input.awayScore < 0 ||
      !Number.isInteger(input.homeScore) ||
      !Number.isInteger(input.awayScore)
    ) {
      throw new httpError.BadRequestError("比分必须是有效的非负整数");
    }
    const match = this.matchService.updateResult(Number(id), input);
    if (!match) {
      throw new httpError.NotFoundError("比赛不存在");
    }
    return { data: match };
  }

  @Get("/standings")
  async getStandings() {
    return { data: this.matchService.getStandings() };
  }
}
