import { Suspense } from "react";
import { TeamList } from "@/components/team-list";

export default function TeamsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10 sm:px-10 sm:py-16">
      <h1 className="mb-10 text-3xl font-bold text-slate-900">球队信息</h1>
      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl bg-slate-200"
              />
            ))}
          </div>
        }
      >
        <TeamList />
      </Suspense>
    </main>
  );
}
