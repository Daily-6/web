import { readFileSync, writeFileSync } from "node:fs";

const d = JSON.parse(readFileSync("backend/data/games.json", "utf-8"));

// 把最后8场小组赛改为未结束（模拟即将开始的比赛）
// 小组赛共72场（id 1-72），把65-72改为scheduled
for (const g of d.games) {
  const id = Number(g.id);
  if (id >= 65 && id <= 72) {
    g.finished = "FALSE";
    g.home_score = "";
    g.away_score = "";
  }
}

writeFileSync("backend/data/games.json", JSON.stringify(d));
console.log("Done: matches 65-72 set to scheduled");
