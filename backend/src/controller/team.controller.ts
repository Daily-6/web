import { Controller, Get, Inject, Param } from "@midwayjs/core";
import { TeamService } from "../service/team.service";

@Controller("/api")
export class TeamController {
  @Inject()
  teamService: TeamService;

  @Get("/teams")
  async listTeams() {
    return { data: this.teamService.list() };
  }

  @Get("/teams/:id")
  async getTeam(@Param("id") id: string) {
    const team = this.teamService.getById(Number(id));
    if (!team) {
      return { data: null };
    }
    return { data: team };
  }
}
