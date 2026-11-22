/**
 * Answer verification for the demo problems shown on the landing page.
 *
 * Every question rendered in the Practice card, the Mock Test demo and the
 * adaptive Diagnostic is recomputed here from first principles and checked
 * against the answer the page claims. A mismatch exits non-zero.
 *
 * This exists because three demo answers shipped wrong at once:
 *   - the mod-7 count was marked 14 when the answer is 28 (the explanation
 *     computed "14 each" and then forgot to add the two residue classes);
 *   - the |x|+|y|+|x+y| <= 2 area was marked 4 when the answer is 3, and 3
 *     was not even among the options;
 *   - the tangent-line k was marked 2+2*sqrt(2) when the answer is 2*sqrt(2).
 * Additionally the Practice card and the Mock Test showed the same question
 * with different options, and Practice's set contained no correct answer.
 *
 * Run: npm run verify:problems   (also runs as part of `npm run build`)
 */

import { readFileSync } from "node:fs";

const SRC = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

let failures = 0;
const check = (name, expected, actual) => {
  const ok = String(expected) === String(actual);
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${name}${ok ? "" : `\n          expected ${expected}, page says ${actual}`}`);
};

/** Pull the letter marked correct for a question matched by a substring. */
function correctFor(snippet) {
  const i = SRC.indexOf(snippet);
  if (i === -1) throw new Error(`question not found in app/page.tsx: ${snippet}`);
  const m = /correct:\s*"([A-E])"/.exec(SRC.slice(i, i + 1400));
  if (!m) throw new Error(`no 'correct' field near: ${snippet}`);
  return m[1];
}

/** Pull the choices array for a question matched by a substring. */
function choicesFor(snippet) {
  const i = SRC.indexOf(snippet);
  const m = /choices:\s*\[([^\]]+)\]/.exec(SRC.slice(i, i + 1400));
  if (!m) throw new Error(`no 'choices' near: ${snippet}`);
  return m[1].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
}

/** Map a computed value to the option letter that carries it. */
function letterOf(choices, predicate) {
  const hit = choices.find((c) => predicate(c.replace(/^[A-E]\)\s*/, "")));
  return hit ? hit[0] : `<no option matches>`;
}

console.log("\nMock Test demo");

// Q1 — count n in 1..100 with n^2 - n + 1 = 0 (mod 7)
{
  const ns = [];
  for (let n = 1; n <= 100; n++) if (((n * n - n + 1) % 7 + 7) % 7 === 0) ns.push(n);
  const choices = choicesFor("n² − n + 1 ≡ 0 (mod 7)");
  check(
    `n² − n + 1 ≡ 0 (mod 7), n ≤ 100  →  ${ns.length}`,
    letterOf(choices, (v) => Number(v) === ns.length),
    correctFor("n² − n + 1 ≡ 0 (mod 7)"),
  );
}

// Q2 — area of |x| + |y| + |x+y| <= 2.
// Identity: |x|+|y|+|x+y| = 2*max(|x|,|y|,|x+y|), so the region is the square
// [-1,1]^2 intersected with |x+y| <= 1. Verified numerically below as well.
{
  const exact = 4 - 0.5 - 0.5;
  let hit = 0;
  const N = 2_000_000;
  // deterministic low-discrepancy-ish sweep so CI output is stable
  const side = Math.round(Math.sqrt(N));
  for (let i = 0; i < side; i++) {
    for (let j = 0; j < side; j++) {
      const x = -2 + (4 * (i + 0.5)) / side;
      const y = -2 + (4 * (j + 0.5)) / side;
      if (Math.abs(x) + Math.abs(y) + Math.abs(x + y) <= 2) hit++;
    }
  }
  const numeric = (16 * hit) / (side * side);
  if (Math.abs(numeric - exact) > 0.01) {
    console.log(`  FAIL  area cross-check disagrees: closed form ${exact}, grid ${numeric.toFixed(4)}`);
    failures++;
  }
  const choices = choicesFor("|x| + |y| + |x + y| ≤ 2");
  check(
    `area of |x|+|y|+|x+y| ≤ 2  →  ${exact} (grid ${numeric.toFixed(3)})`,
    letterOf(choices, (v) => Number(v) === exact),
    correctFor("|x| + |y| + |x + y| ≤ 2"),
  );
}

// Q3 — log2(x) + log4(x) = 6
{
  const x = Math.pow(2, 6 / 1.5);
  const choices = choicesFor("log₂(x) + log₄(x) = 6");
  check(`log₂x + log₄x = 6  →  x = ${x}`, letterOf(choices, (v) => Number(v) === x), correctFor("log₂(x) + log₄(x) = 6"));
}

// Q4 — ordered pairs (a,b) of positive integers with a^2 + b^2 = 2024
{
  let count = 0;
  for (let a = 1; a * a < 2024; a++) {
    const r = 2024 - a * a;
    const b = Math.round(Math.sqrt(r));
    if (b > 0 && b * b === r) count++;
  }
  const choices = choicesFor("a² + b² = 2024");
  check(`ordered pairs a²+b² = 2024  →  ${count}`, letterOf(choices, (v) => Number(v) === count), correctFor("a² + b² = 2024"));
}

console.log("\nAdaptive Diagnostic demo");

// D1 — 3x + 7 = 22, find 2x
{
  const v = 2 * ((22 - 7) / 3);
  const choices = choicesFor("If 3x + 7 = 22, what is 2x?");
  check(`3x+7=22 → 2x = ${v}`, letterOf(choices, (c) => Number(c) === v), correctFor("If 3x + 7 = 22, what is 2x?"));
}

// D2 — 7^100 mod 8
{
  let r = 1n;
  for (let i = 0; i < 100; i++) r = (r * 7n) % 8n;
  const choices = choicesFor("7¹⁰⁰ is divided by 8");
  check(`7¹⁰⁰ mod 8 = ${r}`, letterOf(choices, (c) => BigInt(c) === r), correctFor("7¹⁰⁰ is divided by 8"));
}

// D3 — 5 people round table, two specific people not adjacent.
// Fix one person to quotient out rotations, then brute force.
{
  const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
  let count = 0;
  for (const rest of perms([1, 2, 3, 4])) {
    const seats = [0, ...rest];
    const d = Math.abs(seats.indexOf(3) - seats.indexOf(4));
    if (d !== 1 && d !== seats.length - 1) count++;
  }
  const choices = choicesFor("5 people be seated at a round table");
  check(`5 round, 2 not adjacent → ${count}`, letterOf(choices, (c) => Number(c) === count), correctFor("5 people be seated at a round table"));
}

// D4 — circle radius 2 tangent to both axes, tangent to y = x + k.
// Centre is (±2, ±2); distance to x − y + k = 0 is |cy − cx + k|/√2 = 2.
{
  const ks = new Set();
  for (const [cx, cy] of [[2, 2], [-2, 2], [2, -2], [-2, -2]]) {
    ks.add(+(cy - cx + 2 * Math.SQRT2).toFixed(6));
    ks.add(+(cy - cx - 2 * Math.SQRT2).toFixed(6));
  }
  const target = +(2 * Math.SQRT2).toFixed(6);
  if (!ks.has(target)) { console.log("  FAIL  2√2 is not a valid k"); failures++; }
  const choices = choicesFor("tangent to both axes and to a line y = x + k");
  const value = { "2√2 − 2": 2 * Math.SQRT2 - 2, "2 − 2√2": 2 - 2 * Math.SQRT2, "2√2": 2 * Math.SQRT2, "2 + 2√2": 2 + 2 * Math.SQRT2 };
  check(
    `circle tangent to axes + y=x+k → k = 2√2 (${target})`,
    letterOf(choices, (c) => Math.abs((value[c] ?? NaN) - target) < 1e-6),
    correctFor("tangent to both axes and to a line y = x + k"),
  );
}

console.log("\nCross-surface consistency");

// The Practice card and the Mock Test must render the SAME question object.
{
  const usesShared = /\{\s*\.\.\.MOD7_PROBLEM,/.test(SRC) && /MOD7_PROBLEM\.choices\.map/.test(SRC);
  check("Practice card and Mock Test share one problem definition", true, usesShared);
}

// Every multiple-choice question must actually contain its correct answer.
{
  const orphans = [];
  for (const m of SRC.matchAll(/choices:\s*\[([^\]]+)\][^}]*?correct:\s*"([A-E])"/g)) {
    const letters = m[1].split(",").map((c) => c.trim().replace(/^"|"$/g, "")[0]);
    if (!letters.includes(m[2])) orphans.push(m[2]);
  }
  check("every 'correct' letter exists among its own choices", 0, orphans.length);
}

console.log(
  failures === 0
    ? "\n✓ all demo problems verified\n"
    : `\n✗ ${failures} problem${failures === 1 ? "" : "s"} failed verification\n`,
);
process.exit(failures === 0 ? 0 : 1);
