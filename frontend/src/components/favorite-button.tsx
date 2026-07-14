"use client";

import { useEffect, useState } from "react";
import { ApiResponse } from "@/lib/types";

export function FavoriteButton({
  matchId,
  userId,
}: {
  matchId: number;
  userId: number;
}) {
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch(
          `/api/favorites?userId=${userId}&matchId=${matchId}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as ApiResponse<{ favorited: boolean }>;
        setFavorited(data.data.favorited);
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [matchId, userId]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      if (favorited) {
        const res = await fetch(
          `/api/favorites?userId=${userId}&matchId=${matchId}`,
          { method: "DELETE" },
        );
        if (res.ok) setFavorited(false);
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, matchId }),
        });
        if (res.ok) setFavorited(true);
      }
    } catch {
      // Ignore
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />;
  }

  return (
    <button
      onClick={() => {
        void handleToggle();
      }}
      disabled={toggling}
      className={`flex h-8 w-8 items-center justify-center rounded-full text-lg transition ${
        favorited
          ? "bg-rose-100 text-rose-600 hover:bg-rose-200"
          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
      }`}
      aria-label={favorited ? "取消收藏" : "添加收藏"}
    >
      {favorited ? "\u2605" : "\u2606"}
    </button>
  );
}
