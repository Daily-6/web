"use client";

import { useEffect, useState } from "react";
import { Team, ApiResponse } from "@/lib/types";

export function TeamList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch("/api/teams", { signal: controller.signal });
        if (!res.ok) throw new Error("API 返回了非预期状态");
        const data = (await res.json()) as ApiResponse<Team[]>;
        setTeams(data.data);
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
        <p className="font-semibold">暂时无法加载球队数据。</p>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
        <p className="text-lg font-semibold text-slate-500">暂无球队数据</p>
      </div>
    );
  }

  const groups = new Map<string, Team[]>();
  for (const team of teams) {
    const list = groups.get(team.groupName) || [];
    list.push(team);
    groups.set(team.groupName, list);
  }

  return (
    <div className="space-y-10">
      {Array.from(groups.entries()).map(([groupName, groupTeams]) => (
        <div key={groupName}>
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            {groupName} 组
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {groupTeams.map((team) => (
              <div
                key={team.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-3 flex items-center gap-3">
                  <img
                    src={team.logoUrl}
                    alt={team.name}
                    className="h-10 w-10 rounded object-cover"
                    loading="lazy"
                  />
                  <span className="text-sm font-semibold text-slate-400">
                    {team.shortName}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {team.name}
                </h3>
                <p className="mt-1 text-xs text-slate-400">{team.country}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
