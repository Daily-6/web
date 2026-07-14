import { Suspense } from "react";
import { StandingsTable } from "@/components/standings-table";

export default function StandingsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10 sm:px-10 sm:py-16">
      <h1 className="mb-10 text-3xl font-bold text-slate-900">积分榜</h1>
      <Suspense
        fallback={
          <div className="space-y-8">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-48 animate-pulse rounded-xl bg-slate-200" />
              </div>
            ))}
          </div>
        }
      >
        <StandingsTable />
      </Suspense>
    </main>
  );
}
