import { Suspense } from "react";
import { MatchList } from "@/components/match-list";

export default function MatchesPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10 sm:px-10 sm:py-16">
      <h1 className="mb-10 text-3xl font-bold text-slate-900">赛程浏览</h1>
      <Suspense
        fallback={
          <div className="grid gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-slate-200"
              />
            ))}
          </div>
        }
      >
        <MatchList />
      </Suspense>
    </main>
  );
}
