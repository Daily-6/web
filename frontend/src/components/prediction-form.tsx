"use client";

import { useEffect, useState } from "react";
import { Prediction, ApiResponse } from "@/lib/types";

export function PredictionForm({
  matchId,
  userId,
}: {
  matchId: number;
  userId: number;
}) {
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [existing, setExisting] = useState<Prediction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch(
          `/api/predictions?userId=${userId}&matchId=${matchId}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("加载预测失败");
        const data = (await res.json()) as ApiResponse<Prediction | null>;
        if (data.data) {
          setExisting(data.data);
          setHomeScore(data.data.homeScore);
          setAwayScore(data.data.awayScore);
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [matchId, userId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, matchId, homeScore, awayScore }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.message ?? "预测提交失败",
        });
        return;
      }
      setExisting(data.data);
      setMessage({ type: "success", text: "预测提交成功！" });
    } catch {
      setMessage({ type: "error", text: "网络错误，请重试" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-16 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-bold text-slate-900">
        {existing ? "修改比分预测" : "比分预测"}
      </h3>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
            disabled={submitting}
          >
            -
          </button>
          <span className="w-10 text-center text-2xl font-bold text-slate-900">
            {homeScore}
          </span>
          <button
            onClick={() => setHomeScore(homeScore + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
            disabled={submitting}
          >
            +
          </button>
        </div>

        <span className="text-xl font-bold text-slate-400">-</span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
            disabled={submitting}
          >
            -
          </button>
          <span className="w-10 text-center text-2xl font-bold text-slate-900">
            {awayScore}
          </span>
          <button
            onClick={() => setAwayScore(awayScore + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
            disabled={submitting}
          >
            +
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
        >
          {submitting ? "提交中..." : existing ? "更新预测" : "提交预测"}
        </button>
      </div>

      {message && (
        <p
          className={`mt-3 text-sm font-medium ${
            message.type === "success" ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
