"use client";

import { useEffect, useState } from "react";
import { GroupStandings, ApiResponse } from "@/lib/types";

export function StandingsTable() {
  const [standings, setStandings] = useState<GroupStandings[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch("/api/standings", {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("API 返回了非预期状态");
        const data = (await res.json()) as ApiResponse<GroupStandings[]>;
        setStandings(data.data);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-48 animate-pulse rounded-xl bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
        <p className="font-semibold">暂时无法加载积分榜。</p>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
        <p className="text-lg font-semibold text-slate-500">暂无积分数据</p>
        <p className="mt-2 text-sm text-slate-400">比赛结束后将更新积分榜</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {standings.map((group) => (
        <div key={group.groupName}>
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            {group.groupName} 组
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 font-semibold text-slate-600">#</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">
                    球队
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">
                    赛
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">
                    胜
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">
                    平
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">
                    负
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">
                    进/失
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">
                    净胜
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">
                    分
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.teams.map((team, index) => (
                  <tr
                    key={team.teamId}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-900">
                        {team.teamName}
                      </span>
                      <span className="ml-2 text-xs text-slate-400">
                        {team.shortName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {team.played}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {team.won}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {team.drawn}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {team.lost}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {team.goalsFor}/{team.goalsAgainst}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={
                          team.goalDifference > 0
                            ? "text-emerald-600"
                            : team.goalDifference < 0
                              ? "text-rose-600"
                              : "text-slate-500"
                        }
                      >
                        {team.goalDifference > 0 ? "+" : ""}
                        {team.goalDifference}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900">
                      {team.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
