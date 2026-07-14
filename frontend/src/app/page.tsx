import { CourseDashboard } from "@/components/course-dashboard";
import { MatchOverview } from "@/components/match-overview";
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10 sm:px-10 sm:py-16">
      <header className="mb-14 grid gap-8 border-b border-slate-200 pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="mb-4 font-mono text-sm font-semibold tracking-[0.2em] text-blue-700 uppercase">
            世界杯赛事平台
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">
            赛事信息与互动预测
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            浏览赛程、查看积分榜、预测比分、参与讨论
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            href="/matches"
          >
            查看赛程
          </Link>
          <Link
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            href="/api/health"
          >
            检查 API
          </Link>
        </div>
      </header>

      <MatchOverview />

      <section className="mt-16">
        <CourseDashboard />
      </section>

      <footer className="mt-auto pt-16 text-sm text-slate-500">
        Next.js · Midway.js · SQLite · OpenAPI
      </footer>
    </main>
  );
}
