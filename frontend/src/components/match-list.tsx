"use client";

import { useEffect, useState } from "react";
import { Match, ApiResponse } from "@/lib/types";
import Link from "next/link";

const STAGE_LABELS: Record<string, string> = {
  group: "小组赛",
  round16: "1/8决赛",
  quarter: "1/4决赛",
  semi: "半决赛",
  third: "三四名决赛",
  final: "决赛",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "未开始",
  live: "进行中",
  finished: "已结束",
};

const GROUP_FILTERS = [
  { value: "all", label: "全部" },
  { value: "A", label: "A组" },
  { value: "B", label: "B组" },
  { value: "C", label: "C组" },
  { value: "D", label: "D组" },
  { value: "E", label: "E组" },
  { value: "F", label: "F组" },
  { value: "G", label: "G组" },
  { value: "H", label: "H组" },
  { value: "I", label: "I组" },
  { value: "J", label: "J组" },
  { value: "K", label: "K组" },
  { value: "L", label: "L组" },
];

export function MatchList() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        let url = "/api/matches";
        const params = new URLSearchParams();
        if (filter !== "all" && filter.length === 1) {
          params.set("groupName", filter);
        }
        const qs = params.toString();
        if (qs) url += `?${qs}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("API 返回了非预期状态");
        const data = (await res.json()) as ApiResponse<Match[]>;
        setMatches(data.data);
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
  }, [filter]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {GROUP_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setLoading(true);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === f.value
                ? "bg-blue-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl bg-slate-200"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
          <p className="font-semibold">暂时无法加载比赛数据。</p>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
          <p className="text-lg font-semibold text-slate-500">
            {filter === "all" ? "暂无比赛数据" : `暂无${filter}组的比赛`}
          </p>
          <p className="mt-2 text-sm text-slate-400">请稍后再来查看</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <Link
              key={match.id}
              href={`/matches/${match.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-700">
                  {match.groupName
                    ? `${match.groupName}组`
                    : (STAGE_LABELS[match.stage] ?? match.stage)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    match.status === "live"
                      ? "bg-red-100 text-red-700"
                      : match.status === "finished"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {STATUS_LABELS[match.status] ?? match.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center justify-center gap-2">
                  {match.homeTeam?.logoUrl && (
                    <img
                      src={match.homeTeam.logoUrl}
                      alt=""
                      className="h-6 w-6 rounded-sm object-cover"
                    />
                  )}
                  <div>
                    <p className="text-lg font-bold text-slate-900">
                      {match.homeTeam?.name ?? "主队"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {match.homeTeam?.shortName ?? ""}
                    </p>
                  </div>
                </div>
                <div className="px-4 text-center">
                  {match.status === "scheduled" ? (
                    <p className="text-xl font-bold text-slate-400">VS</p>
                  ) : (
                    <p className="text-2xl font-bold text-slate-900">
                      {match.homeScore} - {match.awayScore}
                    </p>
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
                <div className="flex flex-1 items-center justify-center gap-2">
                  <div>
                    <p className="text-lg font-bold text-slate-900">
                      {match.awayTeam?.name ?? "客队"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {match.awayTeam?.shortName ?? ""}
                    </p>
                  </div>
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
                {match.venue || match.matchDate}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
