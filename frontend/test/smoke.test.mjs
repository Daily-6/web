import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { exec } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { rmSync } from "node:fs";

const BASE_URL = "http://localhost:7001";
const BACKEND_DIR = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "..",
  "backend",
);
const TEST_DB = join(BACKEND_DIR, "data", "test.sqlite");

let serverProcess;

async function waitForServer(url, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Server at ${url} did not start within ${timeout}ms`);
}

before(async () => {
  rmSync(TEST_DB, { force: true });
  rmSync(TEST_DB + "-wal", { force: true });
  rmSync(TEST_DB + "-shm", { force: true });
  serverProcess = exec(
    "npm run dev",
    {
      cwd: BACKEND_DIR,
      env: { ...process.env, NODE_ENV: "local", DATABASE_PATH: "./data/test.sqlite" },
    },
    (error) => {
      if (error && !error.killed) {
        console.error("Server process error:", error);
      }
    },
  );
  await waitForServer(`${BASE_URL}/api/health`);
});

after(async () => {
  if (serverProcess) {
    const pid = serverProcess.pid;
    if (process.platform === "win32") {
      exec(`taskkill /PID ${pid} /T /F`);
    } else {
      serverProcess.kill("SIGTERM");
    }
  }
});

test("frontend test runner is configured", () => {
  assert.equal(typeof fetch, "function");
});

test("API contract validation - frontend consumption", async (t) => {
  await t.test("AC-01: Health endpoint returns valid schema", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get("content-type")?.includes("application/json"));
    const body = await res.json();
    assert.equal(body.status, "ok");
    assert.equal(typeof body.service, "string");
    assert.ok(new Date(body.timestamp).getTime() > 0);
  });

  await t.test("AC-T01: Teams list returns valid data", async () => {
    const res = await fetch(`${BASE_URL}/api/teams`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 16);
    const team = body.data[0];
    assert.equal(typeof team.id, "number");
    assert.equal(typeof team.name, "string");
    assert.ok(team.name.length > 0);
    assert.equal(typeof team.shortName, "string");
    assert.equal(typeof team.groupName, "string");
    assert.equal(typeof team.logoUrl, "string");
    assert.ok(team.logoUrl.startsWith("https://"));
  });

  await t.test("AC-M01: Matches list returns valid data", async () => {
    const res = await fetch(`${BASE_URL}/api/matches`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 10);
    const match = body.data[0];
    assert.equal(typeof match.id, "number");
    assert.ok(["scheduled", "live", "finished"].includes(match.status));
    assert.ok(match.homeTeam);
    assert.ok(match.awayTeam);
    assert.equal(typeof match.venue, "string");
  });

  await t.test("AC-S01: Standings returns valid data", async () => {
    const res = await fetch(`${BASE_URL}/api/standings`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.data));
    if (body.data.length > 0) {
      const group = body.data[0];
      assert.equal(typeof group.groupName, "string");
      assert.ok(Array.isArray(group.teams));
      if (group.teams.length > 0) {
        const team = group.teams[0];
        assert.equal(typeof team.teamId, "number");
        ["played", "won", "drawn", "lost", "points"].forEach((k) => {
          assert.equal(typeof team[k], "number", `${k} should be number`);
        });
      }
    }
  });

  await t.test("AC-P02: Prediction create and read flow", async () => {
    const createRes = await fetch(`${BASE_URL}/api/predictions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: 3,
        matchId: 67,
        homeScore: 2,
        awayScore: 2,
      }),
    });
    assert.equal(createRes.status, 200);
    const createBody = await createRes.json();
    assert.ok(createBody.data);
    assert.equal(createBody.data.userId, 3);
    assert.equal(createBody.data.matchId, 67);

    const getRes = await fetch(
      `${BASE_URL}/api/predictions?userId=3&matchId=67`,
    );
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.ok(getBody.data);
    assert.equal(getBody.data.homeScore, 2);
  });

  await t.test("AC-P02: Prediction rejected for finished match", async () => {
    const res = await fetch(`${BASE_URL}/api/predictions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: 3,
        matchId: 5,
        homeScore: 1,
        awayScore: 0,
      }),
    });
    assert.equal(res.status, 400);
  });

  await t.test("AC-C02: Comment create and read flow", async () => {
    const createRes = await fetch(`${BASE_URL}/api/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: 1,
        matchId: 1,
        content: "测试评论",
      }),
    });
    assert.equal(createRes.status, 200);
    const createBody = await createRes.json();
    assert.equal(createBody.data.content, "测试评论");

    const getRes = await fetch(`${BASE_URL}/api/comments?matchId=1`);
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.ok(Array.isArray(getBody.data));
  });

  await t.test("AC-F02: Favorite add and remove flow", async () => {
    const addRes = await fetch(`${BASE_URL}/api/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 2, matchId: 6 }),
    });
    assert.equal(addRes.status, 200);

    const checkRes = await fetch(
      `${BASE_URL}/api/favorites?userId=2&matchId=6`,
    );
    assert.equal(checkRes.status, 200);
    const checkBody = await checkRes.json();
    assert.equal(checkBody.data.favorited, true);

    const delRes = await fetch(`${BASE_URL}/api/favorites?userId=2&matchId=6`, {
      method: "DELETE",
    });
    assert.equal(delRes.status, 200);
  });

  await t.test("AC-M02: Match result update", async () => {
    const res = await fetch(`${BASE_URL}/api/matches/68/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeScore: 2, awayScore: 0 }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.status, "finished");
  });
});
