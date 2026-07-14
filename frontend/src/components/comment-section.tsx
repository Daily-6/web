"use client";

import { useEffect, useState } from "react";
import { Comment, ApiResponse } from "@/lib/types";

export function CommentSection({
  matchId,
  userId,
}: {
  matchId: number;
  userId: number;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const fetchComments = () => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch(`/api/comments?matchId=${matchId}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("加载评论失败");
        const data = (await res.json()) as ApiResponse<Comment[]>;
        setComments(data.data);
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
    const cleanup = fetchComments();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setMessage("评论内容不能为空");
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, matchId, content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message ?? "评论发表失败");
        return;
      }
      setContent("");
      setComments([data.data, ...comments]);
      setMessage("评论发表成功！");
    } catch {
      setMessage("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="mb-4 text-lg font-bold text-slate-900">评论互动</h3>

      <div className="mb-6 flex gap-3">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的评论..."
          maxLength={500}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !submitting) {
              void handleSubmit();
            }
          }}
        />
        <button
          onClick={() => {
            void handleSubmit();
          }}
          disabled={submitting}
          className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
        >
          {submitting ? "发送中..." : "发送"}
        </button>
      </div>

      {message && (
        <p className="mb-4 text-sm font-medium text-emerald-700">{message}</p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-slate-200"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-500">暂无评论，来发表第一条评论吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  {comment.username ?? `用户${comment.userId}`}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(comment.createdAt).toLocaleDateString("zh-CN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-slate-700">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
