import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

// Execute the exact score predicate embedded in the staged SQL migration
// against an ephemeral PostgreSQL instance, not against production.
const migration = readFileSync(
  new URL("../../db/migrations/20261015_iste_v2_validate_map_scores.sql", import.meta.url),
  "utf8",
);
const found = migration.match(
  /if not \(\s*([\s\S]*?)\s*\) then\s*raise exception 'INVALID_CS2_MAP_SCORE'/,
);
assert.ok(found, "score validation predicate must exist in the migration");
const predicate = found[1];
assert.match(predicate, /greatest\(v_score_a,v_score_b\)/);
assert.match(predicate, /least\(v_score_a,v_score_b\)/);

const cases = [
  [1, 0, false],
  [12, 11, false],
  [12, 12, false],
  [13, 12, false],
  [13, 11, true],
  [0, 13, true],
  [13, 0, true],
  [14, 12, false],
  [15, 12, false],
  [16, 12, true],
  [16, 13, true],
  [16, 14, true],
  [16, 15, false],
  [17, 15, false],
  [19, 15, true],
  [19, 17, true],
  [19, 18, false],
  [22, 20, true],
  [25, 21, true],
  [99, 0, false],
];
const values = cases.map(([a, b]) => `(${a},${b})`).join(", ");
const sql = `SELECT v_score_a, v_score_b, (${predicate}) AS valid
FROM (VALUES ${values}) AS cases(v_score_a,v_score_b);`;
const result = spawnSync("psql", ["-X", "-A", "-t", "-F", "|", "-v", "ON_ERROR_STOP=1"], {
  input: sql,
  encoding: "utf8",
  env: process.env,
});
assert.equal(result.status, 0, result.stderr || "psql failed");
const rows = result.stdout.trim().split("\n");
assert.equal(rows.length, cases.length);
rows.forEach((row, index) => {
  const [a, b, valid] = row.split("|");
  const [expectedA, expectedB, expectedValid] = cases[index];
  assert.equal(Number(a), expectedA);
  assert.equal(Number(b), expectedB);
  assert.equal(valid, expectedValid ? "t" : "f", `unexpected result for ${a}:${b}`);
});
console.log(`Passed ${cases.length} PostgreSQL score predicate cases`);
