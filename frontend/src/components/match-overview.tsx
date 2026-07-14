"use client";

import { useEffect, useState } from "react";
import { Match, ApiResponse } from "@/lib/types";
import Link from "next/link";

export function MatchOverview() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch("/api/matches", {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("API 返回了非预期状态");
        const data = (await res.json()) as ApiResponse<Match[]>;
        setMatches(data.data.slice(0, 4));
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
      <section>
        <h2 className="mb-6 text-2xl font-bold text-slate-900">最新比赛</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl bg-slate-200"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2 className="mb-6 text-2xl font-bold text-slate-900">最新比赛</h2>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
          <p className="font-semibold">暂时无法加载比赛数据。</p>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      </section>
    );
  }

  if (matches.length === 0) {
    return (
      <section>
        <h2 className="mb-6 text-2xl font-bold text-slate-900">最新比赛</h2>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          <p className="text-lg font-semibold">暂无最新比赛</p>
          <p className="mt-2 text-sm">请稍后再来查看</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold text-slate-900">最新比赛</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {matches.map((match) => (
          <Link
            key={match.id}
            href={`/matches/${match.id}`}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="text-center">
                {match.homeTeam?.logoUrl && (
                  <img
                    src={match.homeTeam.logoUrl}
                    alt=""
                    className="mx-auto mb-1 h-8 w-8 rounded-sm object-cover"
                  />
                )}
                <p className="font-bold text-slate-900">
                  {match.homeTeam?.name ?? "主队"}
                </p>
                <p className="text-xs text-slate-500">
                  {match.homeTeam?.shortName ?? ""}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-500">VS</p>
                <p className="text-xs text-slate-400">
                  {new Date(match.matchDate).toLocaleDateString("zh-CN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="text-center">
                {match.awayTeam?.logoUrl && (
                  <img
                    src={match.awayTeam.logoUrl}
                    alt=""
                    className="mx-auto mb-1 h-8 w-8 rounded-sm object-cover"
                  />
                )}
                <p className="font-bold text-slate-900">
                  {match.awayTeam?.name ?? "客队"}
                </p>
                <p className="text-xs text-slate-500">
                  {match.awayTeam?.shortName ?? ""}
                </p>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              {match.venue}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
