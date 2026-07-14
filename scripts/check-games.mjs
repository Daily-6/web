import { readFileSync } from "node:fs";
const d = JSON.parse(readFileSync("backend/data/games.json", "utf-8"));
const f = d.games.filter((g) => g.finished !== "TRUE");
console.log("未结束比赛数:", f.length);
f.slice(0, 10).forEach((g) =>
  console.log(
    g.id,
    g.type,
    g.home_team_name_en,
    "vs",
    g.away_team_name_en,
    g.finished,
  ),
);
