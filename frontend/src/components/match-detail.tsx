"use client";

import { useEffect, useState } from "react";
import { Match, ApiResponse } from "@/lib/types";
import { PredictionForm } from "./prediction-form";
import { CommentSection } from "./comment-section";
import { FavoriteButton } from "./favorite-button";
import { useUser } from "./user-provider";
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

export function MatchDetail({ matchId }: { matchId: number }) {
  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { userId } = useUser();

  const fetchMatch = () => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch(`/api/matches/${matchId}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          if (res.status === 404) {
            setError("比赛不存在");
            return;
          }
          throw new Error("API 返回了非预期状态");
        }
        const data = (await res.json()) as ApiResponse<Match>;
        setMatch(data.data);
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
  };

  useEffect(() => {
    const cleanup = fetchMatch();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  if (loading) {
    return (
      <div>
        <div className="mb-4 h-8 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
        <p className="text-lg font-semibold text-rose-900">{error}</p>
        <Link
          href="/matches"
          className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline"
        >
          返回赛程列表
        </Link>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-lg font-semibold text-slate-500">比赛不存在</p>
        <Link
          href="/matches"
          className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline"
        >
          返回赛程列表
        </Link>
      </div>
    );
  }

  const matchDate = new Date(match.matchDate);
  const isPast = matchDate <= new Date();
  const canPredict = !isPast && match.status === "scheduled";

  return (
    <div>
      <Link
        href="/matches"
        className="mb-6 inline-block text-sm font-medium text-blue-700 hover:underline"
      >
        &larr; 返回赛程列表
      </Link>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {match.groupName
              ? `${match.groupName}组`
              : (STAGE_LABELS[match.stage] ?? match.stage)}
          </span>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                match.status === "live"
                  ? "bg-red-100 text-red-700"
                  : match.status === "finished"
                    ? "bg-slate-100 text-slate-600"
                    : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {STATUS_LABELS[match.status] ?? match.status}
            </span>
            <FavoriteButton matchId={matchId} userId={userId} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            {match.homeTeam?.logoUrl && (
              <img
                src={match.homeTeam.logoUrl}
                alt=""
                className="mx-auto mb-2 h-12 w-12 rounded-sm object-cover"
              />
            )}
            <p className="text-3xl font-bold text-slate-900">
              {match.homeTeam?.name ?? match.homeTeamId}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {match.homeTeam?.shortName ?? ""}
            </p>
          </div>
          <div className="px-8 text-center">
            {match.status === "scheduled" ? (
              <p className="text-3xl font-bold text-slate-300">VS</p>
            ) : (
              <p className="text-4xl font-bold text-slate-900">
                {match.homeScore} - {match.awayScore}
              </p>
            )}
            <p className="mt-2 text-sm text-slate-500">
              {matchDate.toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-xs text-slate-400">{match.venue}</p>
          </div>
          <div className="flex-1 text-center">
            {match.awayTeam?.logoUrl && (
              <img
                src={match.awayTeam.logoUrl}
                alt=""
                className="mx-auto mb-2 h-12 w-12 rounded-sm object-cover"
              />
            )}
            <p className="text-3xl font-bold text-slate-900">
              {match.awayTeam?.name ?? match.awayTeamId}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {match.awayTeam?.shortName ?? ""}
            </p>
          </div>
        </div>
      </div>

      {canPredict && (
        <div className="mb-8">
          <PredictionForm matchId={matchId} userId={userId} />
        </div>
      )}

      <div className="mb-8">
        <CommentSection matchId={matchId} userId={userId} />
      </div>
    </div>
  );
}
