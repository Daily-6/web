import { Suspense } from "react";
import { BracketView } from "@/components/bracket-view";

export default function BracketPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10 sm:px-10 sm:py-16">
      <h1 className="mb-10 text-3xl font-bold text-slate-900">淘汰赛对阵图</h1>
      <Suspense
        fallback={
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-slate-200"
              />
            ))}
          </div>
        }
      >
        <BracketView />
      </Suspense>
    </main>
  );
}
