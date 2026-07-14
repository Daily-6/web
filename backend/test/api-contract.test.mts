import assert from "node:assert/strict";
import { test } from "node:test";

const BASE_URL = "http://localhost:7001";

test("API Contract Tests", async (t) => {
  await t.test(
    "GET /api/health returns 200 with correct schema (AC-01)",
    async () => {
      const res = await fetch(`${BASE_URL}/api/health`);
      assert.equal(res.status, 200);
      assert.equal(
        res.headers.get("content-type")?.includes("application/json"),
        true,
      );
      const body = await res.json();
      assert.equal(body.status, "ok");
      assert.equal(typeof body.service, "string");
      assert.ok(new Date(body.timestamp).getTime() > 0);
    },
  );

  await t.test(
    "GET /api/teams returns 200 with team list (AC-T01)",
    async () => {
      const res = await fetch(`${BASE_URL}/api/teams`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body.data));
      assert.ok(body.data.length > 0);
      const team = body.data[0];
      assert.equal(typeof team.id, "number");
      assert.equal(typeof team.name, "string");
      assert.equal(typeof team.shortName, "string");
      assert.equal(typeof team.groupName, "string");
    },
  );

  await t.test("GET /api/teams/:id returns 200 with team data", async () => {
    const res = await fetch(`${BASE_URL}/api/teams/1`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data);
    assert.equal(body.data.id, 1);
  });

  await t.test("GET /api/teams/:id returns null for non-existent", async () => {
    const res = await fetch(`${BASE_URL}/api/teams/999`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data, null);
  });

  await t.test(
    "GET /api/matches returns 200 with match list (AC-M01)",
    async () => {
      const res = await fetch(`${BASE_URL}/api/matches`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body.data));
      assert.ok(body.data.length > 0);
      const match = body.data[0];
      assert.equal(typeof match.id, "number");
      assert.ok(["scheduled", "live", "finished"].includes(match.status));
      assert.ok(match.homeTeam);
      assert.ok(match.awayTeam);
    },
  );

  await t.test(
    "GET /api/matches?status=scheduled filters correctly",
    async () => {
      const res = await fetch(`${BASE_URL}/api/matches?status=scheduled`);
      assert.equal(res.status, 200);
      const body = await res.json();
      for (const m of body.data) {
        assert.equal(m.status, "scheduled");
      }
    },
  );

  await t.test(
    "GET /api/matches/:id returns 200 with match detail",
    async () => {
      const res = await fetch(`${BASE_URL}/api/matches/1`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.data);
      assert.equal(body.data.id, 1);
    },
  );

  await t.test(
    "GET /api/matches/:id returns 404 for non-existent",
    async () => {
      const res = await fetch(`${BASE_URL}/api/matches/999`);
      assert.equal(res.status, 404);
    },
  );

  await t.test(
    "GET /api/standings returns 200 with group standings (AC-S01)",
    async () => {
      const res = await fetch(`${BASE_URL}/api/standings`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body.data));
      for (const group of body.data) {
        assert.equal(typeof group.groupName, "string");
        assert.ok(Array.isArray(group.teams));
        for (const team of group.teams) {
          assert.equal(typeof team.points, "number");
          assert.equal(typeof team.played, "number");
        }
      }
    },
  );

  await t.test(
    "POST /api/predictions creates prediction (AC-P02)",
    async () => {
      const res = await fetch(`${BASE_URL}/api/predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 2,
          matchId: 5,
          homeScore: 1,
          awayScore: 0,
        }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.data);
      assert.equal(body.data.userId, 2);
      assert.equal(body.data.matchId, 5);
    },
  );

  await t.test(
    "POST /api/predictions returns 400 for finished match",
    async () => {
      const res = await fetch(`${BASE_URL}/api/predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 2,
          matchId: 9,
          homeScore: 1,
          awayScore: 0,
        }),
      });
      assert.equal(res.status, 400);
    },
  );

  await t.test(
    "GET /api/predictions returns prediction for user+match",
    async () => {
      const res = await fetch(`${BASE_URL}/api/predictions?userId=2&matchId=5`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.data);
      assert.equal(body.data.userId, 2);
    },
  );

  await t.test(
    "GET /api/predictions returns null for no prediction",
    async () => {
      const res = await fetch(
        `${BASE_URL}/api/predictions?userId=99&matchId=99`,
      );
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data, null);
    },
  );

  await t.test("POST /api/comments creates comment (AC-C02)", async () => {
    const res = await fetch(`${BASE_URL}/api/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 1, matchId: 1, content: "精彩比赛！" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data);
    assert.equal(body.data.content, "精彩比赛！");
  });

  await t.test(
    "GET /api/comments?matchId= returns comments (AC-C01)",
    async () => {
      const res = await fetch(`${BASE_URL}/api/comments?matchId=1`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body.data));
    },
  );

  await t.test("GET /api/comments returns 400 without matchId", async () => {
    const res = await fetch(`${BASE_URL}/api/comments`);
    assert.equal(res.status, 400);
  });

  await t.test("POST /api/favorites adds favorite (AC-F02)", async () => {
    const res = await fetch(`${BASE_URL}/api/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 1, matchId: 3 }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data);
    assert.equal(body.data.userId, 1);
    assert.equal(body.data.matchId, 3);
  });

  await t.test(
    "GET /api/favorites?userId=&matchId= checks favorited",
    async () => {
      const res = await fetch(`${BASE_URL}/api/favorites?userId=1&matchId=3`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.favorited, true);
    },
  );

  await t.test("DELETE /api/favorites removes favorite", async () => {
    const res = await fetch(`${BASE_URL}/api/favorites?userId=1&matchId=3`, {
      method: "DELETE",
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.removed, true);
  });

  await t.test(
    "POST /api/matches/:id/result records result (AC-M02)",
    async () => {
      const res = await fetch(`${BASE_URL}/api/matches/4/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeScore: 2, awayScore: 0 }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.homeScore, 2);
      assert.equal(body.data.awayScore, 0);
      assert.equal(body.data.status, "finished");
    },
  );
});
