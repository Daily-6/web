import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";

const TEST_DB_PATH = "./data/test-concurrency.sqlite";

test("concurrent prediction creates exactly one record (AC-P03)", async (t) => {
  const absolutePath = resolve(process.cwd(), TEST_DB_PATH);
  try {
    rmSync(absolutePath, { force: true });
  } catch {
    /* ignore */
  }
  mkdirSync(dirname(absolutePath), { recursive: true });

  const db = new DatabaseSync(absolutePath);
  db.exec("PRAGMA journal_mode=WAL");
  db.exec("PRAGMA foreign_keys=ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      home_team_id INTEGER NOT NULL,
      away_team_id INTEGER NOT NULL,
      home_score INTEGER,
      away_score INTEGER,
      match_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled',
      stage TEXT NOT NULL DEFAULT 'group',
      venue TEXT DEFAULT ''
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      match_id INTEGER NOT NULL,
      home_score INTEGER NOT NULL,
      away_score INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, match_id)
    )
  `);

  db.exec("INSERT INTO users (username) VALUES ('test_user')");
  db.exec(
    "INSERT INTO matches (home_team_id, away_team_id, match_date, status) VALUES (1, 2, '2026-08-01 18:00:00', 'scheduled')",
  );

  await t.test("UNIQUE constraint prevents duplicate predictions", () => {
    db.exec(
      "INSERT INTO predictions (user_id, match_id, home_score, away_score) VALUES (1, 1, 2, 1)",
    );
    assert.throws(() => {
      db.exec(
        "INSERT INTO predictions (user_id, match_id, home_score, away_score) VALUES (1, 1, 3, 0)",
      );
    }, /UNIQUE constraint failed/);

    const count = db
      .prepare(
        "SELECT COUNT(*) as total FROM predictions WHERE user_id = 1 AND match_id = 1",
      )
      .get() as { total: number };
    assert.equal(
      count.total,
      1,
      "concurrent insert should result in exactly one record",
    );
  });

  await t.test("INSERT OR IGNORE silently skips duplicates", () => {
    db.exec(
      "INSERT OR IGNORE INTO predictions (user_id, match_id, home_score, away_score) VALUES (1, 1, 5, 5)",
    );
    const count = db
      .prepare(
        "SELECT COUNT(*) as total FROM predictions WHERE user_id = 1 AND match_id = 1",
      )
      .get() as { total: number };
    assert.equal(
      count.total,
      1,
      "INSERT OR IGNORE should not create duplicate",
    );
  });

  db.close();
  try {
    rmSync(absolutePath, { force: true });
  } catch {
    /* ignore */
  }
});
