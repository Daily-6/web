import { Suspense } from "react";
import { MatchDetail } from "@/components/match-detail";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10 sm:px-10 sm:py-16">
      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
        }
      >
        <MatchDetail matchId={Number(id)} />
      </Suspense>
    </main>
  );
}
