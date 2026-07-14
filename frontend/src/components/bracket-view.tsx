"use client";

import { useEffect, useState } from "react";
import { Match, ApiResponse } from "@/lib/types";
import Link from "next/link";

const ROUND_LABELS: Record<string, string> = {
  round32: "1/16决赛",
  round16: "1/8决赛",
  quarter: "1/4决赛",
  semi: "半决赛",
  third: "三四名决赛",
  final: "决赛",
};

const ROUND_ORDER = ["round32", "round16", "quarter", "semi", "third", "final"];

export function BracketView() {
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
        const knockout = data.data.filter((m) => m.stage !== "group");
        setMatches(knockout);
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
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
        <p className="font-semibold">暂时无法加载淘汰赛数据。</p>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  const grouped = new Map<string, Match[]>();
  for (const m of matches) {
    const list = grouped.get(m.stage) || [];
    list.push(m);
    grouped.set(m.stage, list);
  }

  const stages = ROUND_ORDER.filter((s) => grouped.has(s));

  if (stages.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
        <p className="text-lg font-semibold text-slate-500">暂无淘汰赛数据</p>
        <p className="mt-2 text-sm text-slate-400">
          淘汰赛将在小组赛结束后更新
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {stages.map((stage) => {
        const stageMatches = grouped.get(stage)!;
        return (
          <div key={stage}>
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              {ROUND_LABELS[stage] ?? stage}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {stageMatches.map((match) => (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {match.homeTeam?.logoUrl && (
                        <img
                          src={match.homeTeam.logoUrl}
                          alt=""
                          className="h-6 w-6 rounded-sm object-cover"
                        />
                      )}
                      <span className="font-bold text-slate-900">
                        {match.homeTeam?.name ?? "待定"}
                      </span>
                    </div>
                    <div className="text-center">
                      {match.status === "scheduled" ? (
                        <span className="text-lg font-bold text-slate-400">
                          VS
                        </span>
                      ) : (
                        <span className="text-lg font-bold text-slate-900">
                          {match.homeScore} - {match.awayScore}
                        </span>
                      )}
                      <p className="text-xs text-slate-400">
                        {new Date(match.matchDate).toLocaleDateString("zh-CN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {match.awayTeam?.name ?? "待定"}
                      </span>
                      {match.awayTeam?.logoUrl && (
                        <img
                          src={match.awayTeam.logoUrl}
                          alt=""
                          className="h-6 w-6 rounded-sm object-cover"
                        />
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-center text-xs text-slate-400">
                    {match.venue}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
