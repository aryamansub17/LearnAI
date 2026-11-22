"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from "framer-motion";
import LandingDemo from "@/components/LandingDemo";
import Reveal from "@/components/Reveal";
import Faq from "@/components/Faq";
import ContrastDemo from "@/components/ContrastDemo";
import Logomark from "@/components/Logomark";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { CheckIcon, CellCheckIcon, CellCrossIcon, CellPartialIcon } from "@/components/icons";
import { DURATION, transition } from "@/lib/motion";
import { answerChoiceStyle } from "@/lib/answer-style";
import { TEAM_MIN_SEATS, TEAM_SEAT_PRICE, PRO_PRICE } from "@/lib/billing";

// ── Data ────────────────────────────────────────────────────────────────────

// Figures below are quoted from the primary sources and describe the general
// education-research literature on retrieval practice, tutoring and active
// learning. They are NOT measurements of PolyTeach outcomes, and the copy must
// not imply otherwise. Each was checked against the published paper:
//   - Roediger & Karpicke 2006 is Psychological Science, not Science, and the
//     author order is Roediger first. The effect reverses on immediate tests.
//   - Bloom's 2σ is one-to-one tutoring *with mastery learning*; group mastery
//     learning alone produced ~1σ, and the full 2σ has rarely replicated.
//   - Freeman et al. report failure rates 55% HIGHER under lecturing, which is
//     not the same as a 55% reduction in failures from active learning.
const STATS = [
  {
    stat: "61%",
    desc: "of a prose passage still recalled a week later by students who practised retrieval, against 40% for students who only re-read it. On an immediate test the order reverses — re-reading leads at five minutes.",
    source: "Roediger & Karpicke, Psychological Science 17(3), 249–255 (2006), Exp. 2",
  },
  {
    stat: "2σ",
    desc: "the gap Bloom reported between one-to-one tutoring with mastery learning and conventional class teaching — the average tutored student scored above roughly 98% of conventionally taught peers. Group mastery learning alone produced about 1σ, and later work has rarely reproduced the full effect.",
    source: "Bloom, Educational Researcher 13(6), 4–16 (1984)",
  },
  {
    stat: "55%",
    desc: "higher failure rate under traditional lecturing than under active learning, across 225 studies — 33.8% against 21.8%. Examination scores rose about 6% (0.47 SD).",
    source: "Freeman et al., PNAS 111(23), 8410–8415 (2014)",
  },
];

// The AMC 12 number-theory question is shown in two places — the Practice card
// and the Mock Test demo. It is defined once here so the two can never disagree
// about the options or the answer, which is exactly what went wrong before:
// Practice offered A)13 B)14 C)15 D)16, none of which is the correct answer (28).
const MOD7_PROBLEM = {
  q: "How many positive integers n ≤ 100 satisfy n² − n + 1 ≡ 0 (mod 7)?",
  choices: ["A) 10", "B) 14", "C) 15", "D) 28", "E) 29"],
  correct: "D",
} as const;

const OLYMPIAD_MARQUEE = [
  "AMC 8", "AMC 10", "AMC 12", "AIME", "USAMO", "MATHCOUNTS",
  "USACO", "ACSL", "F=ma", "USNCO", "USABO", "Science Olympiad", "Science Bowl",
];

// ── Sub-components ───────────────────────────────────────────────────────────

function AppWindow({ children, glow = false }: { children: React.ReactNode; glow?: boolean }) {
  return (
    <Card accentGlow={glow} radius="3xl" className="relative">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
        <span className="w-[7px] h-[7px] rounded-full bg-accent shrink-0" />
        <span className="text-[12px] font-medium text-muted tracking-wide">polyteach.app</span>
      </div>
      {children}
    </Card>
  );
}

function ChatPreview() {
  return (
    <div className="space-y-3 p-4 pt-2">
      <div className="flex justify-end">
        <div className="px-3 py-2 rounded-xl rounded-br-sm bg-surface-2 border border-border-2 text-xs text-text max-w-[85%] leading-relaxed">
          How do I count arrangements of AABBCC?
        </div>
      </div>
      <div className="flex gap-2">
        <div className="w-4 h-4 rounded-md bg-accent flex items-center justify-center shrink-0 mt-0.5">
          <CheckIcon />
        </div>
        <div className="text-xs text-text-2 leading-relaxed">If all 6 letters were distinct, how many arrangements would there be?</div>
      </div>
      <div className="flex justify-end">
        <div className="px-3 py-2 rounded-xl rounded-br-sm bg-surface-2 border border-border-2 text-xs text-text max-w-[85%]">6! = 720</div>
      </div>
      <div className="flex gap-2">
        <div className="w-4 h-4 rounded-md bg-accent flex items-center justify-center shrink-0 mt-0.5">
          <CheckIcon />
        </div>
        <div className="text-xs text-text-2 leading-relaxed">Good. Now the two A's are identical — how does that affect the count?</div>
      </div>
    </div>
  );
}

function DiagnosticPreview() {
  const bars = [
    { topic: "Algebra", pct: 82 },
    { topic: "Combinatorics", pct: 64 },
    { topic: "Number Theory", pct: 41 },
    { topic: "Geometry", pct: 28 },
  ];
  return (
    <div className="p-4 pt-2 space-y-2.5">
      <p className="text-xs text-accent font-medium mb-3">Level assessment</p>
      {bars.map(({ topic, pct }) => (
        <div key={topic} className="flex items-center gap-2.5">
          <span className="text-2xs text-text-2 w-[88px] shrink-0">{topic}</span>
          <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%`, opacity: 0.35 + (pct / 100) * 0.65 }} />
          </div>
          <span className="text-2xs text-text-2 w-6 text-right">{pct}%</span>
        </div>
      ))}
    </div>
  );
}

function ProblemPreview() {
  return (
    <div className="p-4 pt-2">
      <p className="text-xs text-accent font-medium mb-3">AMC 12 · Problem 14</p>
      <p className="text-xs text-text leading-relaxed mb-4">
        {MOD7_PROBLEM.q}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {MOD7_PROBLEM.choices.map((c) => (
          <div key={c} className="px-2 py-1.5 rounded-lg border border-border-2 text-2xs text-text-2 text-center">{c}</div>
        ))}
      </div>
    </div>
  );
}

function CalendarPreview() {
  return (
    <div className="p-4 pt-2">
      <p className="text-xs text-accent font-medium mb-3">AMC 12 prep · 44 days left</p>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["M","T","W","T","F","S","S"].map((d, i) => (
          <div key={i} className="text-center text-2xs text-muted">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 28 }).map((_, i) => (
          <div
            key={i}
            className={`h-5 rounded-sm ${
              i < 16 ? "bg-accent/30" :
              i === 16 ? "bg-accent ring-1 ring-accent/60" :
              "bg-surface-2"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Interactive Mock Test demo ───────────────────────────────────────────────

// Every question here is checked by scripts/verify-problems.mjs, which recomputes
// the answer from first principles and fails the build on a mismatch. Do not edit
// a question without re-running `npm run verify:problems`.
const MOCK_QUESTIONS = [
  {
    ...MOD7_PROBLEM,
    explanation:
      "n² − n + 1 ≡ 0 (mod 7). Testing residues 0–6: only n ≡ 3 and n ≡ 5 (mod 7) give 0. Each residue class contributes 14 values in 1–100 (3,10,…,94 and 5,12,…,96), so the total is 14 + 14 = 28.",
  },
  {
    q: "What is the area of the region in the coordinate plane defined by |x| + |y| + |x + y| ≤ 2?",
    choices: ["A) 2", "B) 3", "C) 4", "D) 3√2", "E) 6"],
    correct: "B",
    explanation:
      "For any reals, |x| + |y| + |x + y| = 2·max(|x|, |y|, |x + y|). So the condition is max(|x|, |y|, |x + y|) ≤ 1 — the square [−1,1]² cut by |x + y| ≤ 1. That removes two corner triangles of area ½ each, leaving 4 − ½ − ½ = 3.",
  },
  {
    q: "If log₂(x) + log₄(x) = 6, what is x?",
    choices: ["A) 8", "B) 12", "C) 16", "D) 24", "E) 32"],
    correct: "C",
    explanation: "Convert: log₂x + log₂x/2 = 6 → (3/2)log₂x = 6 → log₂x = 4 → x = 16.",
  },
  {
    q: "How many ordered pairs (a, b) of positive integers satisfy a² + b² = 2024?",
    choices: ["A) 0", "B) 2", "C) 4", "D) 6", "E) 8"],
    correct: "A",
    explanation:
      "2024 = 2³ · 11 · 23. A positive integer is a sum of two squares exactly when every prime ≡ 3 (mod 4) appears to an even power. Here 11 ≡ 3 (mod 4) appears to the first power, so no representation exists — 0 ordered pairs.",
  },
];

const TIMER_START = 75 * 60;

function InteractiveMockTest() {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [time, setTime] = useState(TIMER_START - 7 * 60 - 14); // simulate mid-test
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTime((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const mins = Math.floor(time / 60).toString().padStart(2, "0");
  const secs = (time % 60).toString().padStart(2, "0");
  const q = MOCK_QUESTIONS[qIdx];
  const isCorrect = selected === q.correct;

  const handleSelect = (choice: string) => {
    if (selected) return;
    setSelected(choice);
    setRevealed(true);
    setScore((s) => ({
      correct: s.correct + (choice === q.correct ? 1 : 0),
      total: s.total + 1,
    }));
  };

  const next = () => {
    setQIdx((i) => (i + 1) % MOCK_QUESTIONS.length);
    setSelected(null);
    setRevealed(false);
  };

  return (
    <Card radius="2xl" bg="bg-surface-2">
      {/* Test header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-2 bg-surface">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-muted">AMC 10</span>
          <span className="text-xs text-muted">·</span>
          <span className="text-xs text-text-2">Question {qIdx + 8} of 30</span>
          <div className="flex gap-1 ml-2">
            {MOCK_QUESTIONS.map((_, i) => (
              <div key={i} className={`w-4 h-1 rounded-full transition-colors ${i < score.total ? (score.correct > i ? "bg-accent/60" : "bg-red-500/40") : "bg-border-2"}`} />
            ))}
          </div>
        </div>
        <div className={`flex items-center gap-2 text-sm font-semibold tabular-nums ${time < 300 ? "text-red-600" : "text-text"}`}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="6"/><path d="M7 4v3.5l2 1.5" strokeLinecap="round"/></svg>
          {mins}:{secs}
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Question + choices */}
        <div>
          <p className="text-sm text-text leading-relaxed mb-8 text-base">{q.q}</p>
          <div className="space-y-2.5">
            {q.choices.map((c) => {
              const letter = c[0];
              const isSelected = selected === letter;
              const isRight = letter === q.correct;
              const style = answerChoiceStyle(isSelected, isRight, !!selected);
              return (
                <button
                  key={c}
                  onClick={() => handleSelect(letter)}
                  disabled={!!selected}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all duration-150 ${style}`}
                >
                  <span className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-semibold shrink-0 ${isSelected ? "border-current" : "border-border-2"}`}>{letter}</span>
                  <span>{c.slice(3)}</span>
                  {selected && isRight && <svg className="ml-auto shrink-0 text-green-600" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 7l3.5 3.5L12 3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
              );
            })}
          </div>

          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transition(DURATION.base)}
              className={`mt-5 p-4 rounded-xl border text-sm leading-relaxed ${isCorrect ? "border-green-500/30 bg-green-500/[0.07] text-green-700/80" : "border-red-500/30 bg-red-500/[0.07] text-red-700/80"}`}
            >
              <p className={`text-xs font-medium mb-1.5 ${isCorrect ? "text-green-700" : "text-red-700"}`}>
                {isCorrect ? "Correct" : `Incorrect — Answer is ${q.correct}`}
              </p>
              {q.explanation}
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card elevated={false} radius="xl" className="p-5">
            <p className="text-xs font-medium text-text-2 mb-4">Score</p>
            <div className="text-4xl font-semibold tracking-[-0.04em] mb-1">
              {score.correct}<span className="text-xl text-text-2 font-normal">/{score.total || "–"}</span>
            </div>
            <p className="text-2xs text-text-2">questions correct</p>
            {score.total > 0 && (
              <div className="mt-4 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${(score.correct / score.total) * 100}%` }} />
              </div>
            )}
          </Card>

          <Card elevated={false} radius="xl" className="p-5">
            <p className="text-xs font-medium text-text-2 mb-3">Instructions</p>
            <p className="text-xs text-text-2 leading-relaxed">Select the best answer. No penalty for guessing. Each correct answer is worth 6 points.</p>
          </Card>

          {revealed && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transition(DURATION.fast, 0.15)}
              onClick={next}
              className="w-full py-3 rounded-xl bg-accent text-background text-sm font-semibold hover:bg-accent-hover transition-colors"
            >
              Next question →
            </motion.button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── Interactive Diagnostic demo ───────────────────────────────────────────────

const DIAG_SEQUENCE = [
  { difficulty: "Intermediate", topic: "Algebra", q: "If 3x + 7 = 22, what is 2x?", choices: ["A) 5", "B) 8", "C) 10", "D) 14"], correct: "C", level: 45 },
  { difficulty: "Advanced", topic: "Number Theory", q: "What is the remainder when 7¹⁰⁰ is divided by 8?", choices: ["A) 1", "B) 3", "C) 5", "D) 7"], correct: "A", level: 62 },
  { difficulty: "Olympiad", topic: "Combinatorics", q: "In how many ways can 5 people be seated at a round table if two specific people must not be adjacent?", choices: ["A) 12", "B) 18", "C) 24", "D) 36"], correct: "A", level: 78 },
  { difficulty: "Olympiad", topic: "Geometry", q: "A circle of radius 2 is tangent to both axes and to a line y = x + k. What is k?", choices: ["A) 2√2 − 2", "B) 2 − 2√2", "C) 2√2", "D) 2 + 2√2"], correct: "C", level: 85 },
];

const SKILL_INITIAL = { Algebra: 0, "Number Theory": 0, Geometry: 0, Combinatorics: 0 };

function InteractiveDiagnostic() {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [adapting, setAdapting] = useState(false);
  const [done, setDone] = useState(false);
  const [skills, setSkills] = useState<Record<string, number>>(SKILL_INITIAL);

  const dq = DIAG_SEQUENCE[qIdx];

  const handleSelect = (letter: string) => {
    if (selected || adapting) return;
    const correct = letter === dq.correct;
    setSelected(letter);

    setTimeout(() => {
      setSkills((s) => ({ ...s, [dq.topic]: Math.min(100, s[dq.topic] + (correct ? dq.level : Math.floor(dq.level * 0.4))) }));
      setAdapting(true);
    }, 700);

    setTimeout(() => {
      setAdapting(false);
      if (qIdx + 1 >= DIAG_SEQUENCE.length) {
        setDone(true);
      } else {
        setQIdx((i) => i + 1);
        setSelected(null);
      }
    }, 2200);
  };

  const reset = () => {
    setQIdx(0);
    setSelected(null);
    setAdapting(false);
    setDone(false);
    setSkills(SKILL_INITIAL);
  };

  return (
    <Card radius="2xl" bg="bg-surface-2">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-2 bg-surface">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted">AMC 10 Diagnostic</span>
          <span className="text-xs text-muted">·</span>
          {!done && <span className="text-xs text-text-2">Question {qIdx + 1} of {DIAG_SEQUENCE.length}</span>}
          {done && <span className="text-xs text-green-600">Assessment complete</span>}
        </div>
        {!done && (
          <Badge variant={dq.difficulty === "Olympiad" ? "accent" : "neutral"}>{dq.difficulty}</Badge>
        )}
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        {/* Left: question */}
        <div>
          {!done ? (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={qIdx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={transition(DURATION.base)}
                >
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-2xs font-medium text-text-2 px-2 py-0.5 rounded-md border border-border-2 bg-surface">{dq.topic}</span>
                    <span className="text-2xs text-muted">↑ Difficulty adjusting based on your answers</span>
                  </div>
                  <p className="text-base text-text leading-relaxed mb-7">{dq.q}</p>
                  <div className="space-y-2.5">
                    {dq.choices.map((c) => {
                      const letter = c[0];
                      const isSelected = selected === letter;
                      const isRight = letter === dq.correct;
                      const style = answerChoiceStyle(isSelected, isRight, !!selected);
                      return (
                        <button key={c} onClick={() => handleSelect(letter)} disabled={!!selected}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all duration-150 ${style}`}>
                          <span className="w-6 h-6 rounded-lg border border-current/30 flex items-center justify-center text-xs font-semibold shrink-0">{letter}</span>
                          <span>{c.slice(3)}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Adapting indicator */}
              <AnimatePresence>
                {adapting && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={transition(DURATION.fast)}
                    className="mt-5 flex items-center gap-3 px-4 py-3 rounded-xl border border-accent/30 bg-accent/[0.07]"
                  >
                    <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin shrink-0" />
                    <span className="text-xs text-accent">Adapting difficulty — loading next question…</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={transition(DURATION.slow)}>
              <p className="text-xs font-medium text-accent mb-4">Assessment complete</p>
              <h3 className="text-2xl font-semibold tracking-tight mb-3">Your level: <span className="text-accent">Advanced</span></h3>
              <p className="text-sm text-text-2 leading-relaxed mb-6 max-w-sm">Strong in Algebra and Number Theory. Focus on Geometry proofs and advanced Combinatorics to reach Olympiad level.</p>
              <Button variant="secondary" size="sm" onClick={reset}>
                Restart diagnostic
              </Button>
            </motion.div>
          )}
        </div>

        {/* Right: live skill bars */}
        <Card elevated={false} radius="xl" className="p-5 self-start">
          <p className="text-xs font-medium text-text-2 mb-5">Live assessment</p>
          <div className="space-y-5">
            {Object.entries(skills).map(([topic, pct]) => (
              <div key={topic}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-text-2">{topic}</span>
                  <span className="text-xs font-medium text-text tabular-nums">{pct > 0 ? `${pct}%` : "—"}</span>
                </div>
                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={transition(DURATION.slower)}
                  />
                </div>
              </div>
            ))}
          </div>

          {!done && qIdx > 0 && (
            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-xs font-medium text-text-2 mb-2">Estimated level</p>
              <p className="text-sm font-semibold text-text">{DIAG_SEQUENCE[qIdx - 1]?.difficulty ?? "—"}</p>
            </div>
          )}
        </Card>
      </div>
    </Card>
  );
}

// ── Horizontal sticky-scroll feature section ─────────────────────────────────


// ── Comparison table data ────────────────────────────────────────────────────

const COMPETITORS = [
  { name: "PolyTeach", highlight: true },
  { name: "AoPS", highlight: false },
  { name: "USACO Guide", highlight: false },
  { name: "Brilliant", highlight: false },
  { name: "Private Tutor", highlight: false },
];

type CellValue = true | false | "partial";

interface ComparisonRow {
  feature: string;
  desc: string;
  values: CellValue[];
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "Socratic coaching",
    desc: "Guides you to the answer through questions — never just gives it away",
    values: [true, false, false, false, "partial"],
  },
  {
    feature: "Math olympiads (AMC · AIME · USAMO)",
    desc: "Structured content and coaching for AMC 8/10/12, AIME, USAMO, MATHCOUNTS",
    values: [true, true, false, "partial", "partial"],
  },
  {
    feature: "CS olympiad (USACO · ACSL)",
    desc: "Algorithms, data structures, and contest problem sets for USACO Bronze–Platinum",
    values: [true, false, true, false, "partial"],
  },
  {
    feature: "Physics olympiad (USAPhO · F=ma)",
    desc: "Mechanics, E&M, and olympiad-style derivations for F=ma and USAPhO",
    values: [true, "partial", false, false, "partial"],
  },
  {
    feature: "Chemistry olympiad (USNCO)",
    desc: "Stoichiometry, organic, and lab-theory problems calibrated to USNCO difficulty",
    values: [true, false, false, false, "partial"],
  },
  {
    feature: "Biology olympiad (USABO)",
    desc: "Cell biology, genetics, ecology, and physiology coaching for USABO Open/Semifinals",
    values: [true, false, false, false, "partial"],
  },
  {
    feature: "Adaptive diagnostic",
    desc: "Pinpoints your exact knowledge ceiling concept-by-concept in one session",
    values: [true, false, false, false, false],
  },
  {
    feature: "Competition study plan",
    desc: "Day-by-day prep campaign keyed to your competition date — adjusts after every session",
    values: [true, false, false, false, false],
  },
  {
    feature: "Personalized to your level",
    desc: "Every problem and hint is calibrated to where you actually are right now",
    values: [true, false, false, false, true],
  },
  {
    feature: "Available 24/7",
    desc: "No scheduling, no waiting — start a session any time",
    values: [true, true, true, true, false],
  },
  {
    feature: "Affordable (≤ $25/mo)",
    desc: "Less than a single hour with a private tutor, every month, unlimited sessions",
    values: [true, "partial", true, true, false],
  },
];

// Section vertical rhythm convention: py-32 is the standard section pad; the narrative
// Problem/Why-AI sections use a slightly denser py-28 since they're connective rather
// than primary content; hero uses pt-44 pb-0 (flows straight into the AppWindow demo);
// bottom CTA uses py-36 (largest — deliberate emphasis on the close); Faq keeps its own
// denser py-20.

// ── Section header ───────────────────────────────────────────────────────────
// One quiet, left-aligned treatment used by every section: a hairline rule sets
// the section off, the headline carries it, and an optional standfirst sits on a
// narrower measure. Sections differ by the layout of their content, not by
// decoration bolted onto the header.
function SectionHead({
  title,
  children,
  className = "",
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Reveal className={className}>
      <div className="border-t border-border-2 pt-7">
        <h2 className="text-[clamp(25px,3.3vw,42px)] font-normal tracking-[-0.02em] leading-[1.14] max-w-2xl text-text">
          {title}
        </h2>
        {children && (
          <p className="text-sm text-text-2 leading-relaxed mt-4 max-w-lg">{children}</p>
        )}
      </div>
    </Reveal>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [accountCount, setAccountCount] = useState<number | null>(null);
  const [seats, setSeats] = useState(TEAM_MIN_SEATS);
  const [checkoutLoading, setCheckoutLoading] = useState<"pro" | "team" | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroParallaxY = useTransform(heroScrollProgress, [0, 1], [0, -60]);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setAccountCount(d.totalAccounts))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const subscribe = async (kind: "pro" | "team") => {
    setCheckoutError("");
    setCheckoutLoading(kind);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kind === "team" ? { kind, seats } : { kind }),
      });
      const data: { error?: string; url?: string } = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Server returned ${res.status}`);
      if (!data.url) throw new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Something went wrong");
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text overflow-x-hidden">
      {/* ── Nav ── */}
      <nav
        className={`fixed top-0 inset-x-0 z-[60] transition-colors duration-300 ${
          scrolled ? "border-b border-border-2 bg-background/90 backdrop-blur-sm" : "border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 md:px-8 py-4">
          <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <Logomark size={24} />
            <span><span className="text-text">Poly</span><span className="text-accent">Teach</span></span>
          </span>
          <div className="flex items-center gap-6">
            <Link href="#pricing" className="text-sm text-text-2 hover:text-text transition-colors duration-150">Pricing</Link>
            <Button href="/coach" size="sm">Open app →</Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative z-10 flex flex-col items-center text-center px-6 pt-44 pb-0">
        {/* Layered mesh — several soft light sources rather than one flat glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] overflow-hidden">
          <div className="absolute inset-0 bg-mesh-hero" />
        </div>

        {/* Headline — one continuous serif line, no colour break and no
            superlative. The claim itself is the differentiator. */}
        <motion.h1
          className="text-[clamp(40px,6.2vw,78px)] font-normal tracking-[-0.03em] leading-[1.04] max-w-[16ch] text-text"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition(DURATION.slower, 0.08)}
        >
          Coaching that refuses to give you the answer.
        </motion.h1>

        <motion.p
          className="mt-7 text-base text-text-2 leading-[1.7] max-w-md font-sans"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition(DURATION.slow, 0.18)}
        >
          Socratic AI coaching for competition math — AMC, AIME, USAMO, MATHCOUNTS — extended to the CS and science olympiads. It asks the question that unblocks you, and stops there.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition(DURATION.slow, 0.28)}
        >
          <Button href="/coach">Start training free</Button>
          <Button href="#demo" variant="secondary">See a session</Button>
        </motion.div>

        {/* Social proof — real figure, kept quiet and placed after the ask
            rather than used as a badge above the headline. */}
        {accountCount !== null && (
          <motion.p
            className="mt-6 text-xs text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transition(DURATION.slow, 0.36)}
          >
            {accountCount.toLocaleString()}+ competitors training
          </motion.p>
        )}

        {/* Hero app screenshot — the page's one glowing element, with a subtle scroll parallax */}
        <motion.div
          className="relative mt-16 w-full max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 48, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={transition(DURATION.hero, 0.42)}
          style={prefersReducedMotion ? undefined : { y: heroParallaxY }}
        >
          <AppWindow glow>
            <div className="p-6 bg-surface-2">
              <LandingDemo />
            </div>
          </AppWindow>
        </motion.div>
      </section>

      {/* ── Competitions covered — static, editorial, no ticker ── */}
      <div className="relative z-10 border-y border-border py-5 mt-4">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {OLYMPIAD_MARQUEE.map((s, i) => (
            <span key={s} className="flex items-center gap-3 text-2xs text-text-2 tracking-wide">
              {s}
              {i < OLYMPIAD_MARQUEE.length - 1 && <span className="text-border-3">·</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── Problem ── */}
      <section className="relative z-10 px-8 py-28 border-b border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-x-14 gap-y-5 items-start">
          <Reveal className="md:col-span-7">
            <h2 className="text-[clamp(27px,3.7vw,46px)] font-normal tracking-[-0.022em] leading-[1.12]">
              Most studying plateaus because it&apos;s built around answers, not questions.
            </h2>
          </Reveal>
          <Reveal y={24} delay={0.1} className="md:col-span-5 md:pt-2">
            <p className="text-sm text-text-2 leading-relaxed">
              Watching a worked solution feels like progress. It isn&apos;t. The skill that actually shows up on test day — noticing which idea to reach for, on a problem you&apos;ve never seen — only develops when you&apos;re forced to find it yourself. Most prep resources skip straight to the answer key.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Why AI alone isn't enough ── */}
      <section className="relative z-10 px-8 py-28 bg-surface-2 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-x-14 gap-y-5 items-start mb-16">
            <Reveal className="md:col-span-7">
              <h2 className="text-[clamp(27px,3.7vw,46px)] font-normal tracking-[-0.022em] leading-[1.12]">
                A general chatbot won&apos;t fix that — it&apos;s built to be helpful, which means it just tells you.
              </h2>
            </Reveal>
            <Reveal y={24} delay={0.1} className="md:col-span-5 md:pt-2">
              <p className="text-sm text-text-2 leading-relaxed">
                Ask a generic AI for help and it optimizes for the fastest correct answer. PolyTeach is built around one constraint instead: never tell, always ask.
              </p>
            </Reveal>
          </div>
          <ContrastDemo />
        </div>
      </section>

      {/* ── Feature bento grid ── */}
      <section className="relative z-10 px-8 pt-20 pb-32 bg-surface-2 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <SectionHead className="mb-14" title="Built for students serious about competitive academics">
            Five modes, one model of what you actually know — coaching, practice, timed mocks, diagnostics, and a plan that reshapes itself around your gaps.
          </SectionHead>

          <div className="grid grid-cols-12 gap-6">
            {/* Coaching — large */}
            <Reveal className="col-span-12 md:col-span-7" y={32} delay={0.05}>
              <Card hoverable radius="2xl" className="h-full">
                <div className="p-7 pb-3">
                  <span className="text-xs font-medium text-muted">Coach mode</span>
                  <h3 className="text-lg font-semibold tracking-tight mt-2 mb-1">Socratic coaching</h3>
                  <p className="text-sm text-text-2 leading-relaxed max-w-xs">Never hands you the answer. Asks the exact question that unblocks your thinking — at any hour.</p>
                </div>
                <div className="mx-5 mb-5 mt-5 rounded-xl border border-border-2 bg-surface-2 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="text-2xs text-text-2">AMC 12 · Counting &amp; Probability</span>
                  </div>
                  <ChatPreview />
                </div>
              </Card>
            </Reveal>

            {/* Problems — small */}
            <Reveal className="col-span-12 md:col-span-5" y={32} delay={0.12}>
              <Card hoverable radius="2xl" className="h-full">
                <div className="p-7 pb-3">
                  <span className="text-xs font-medium text-muted">Practice mode</span>
                  <h3 className="text-lg font-semibold tracking-tight mt-2 mb-1">Competition-caliber problems</h3>
                  <p className="text-sm text-text-2 leading-relaxed">Problems matched to real contest difficulty — not generic textbook exercises.</p>
                </div>
                <div className="mx-5 mb-5 mt-5 rounded-xl border border-border-2 bg-surface-2">
                  <ProblemPreview />
                </div>
              </Card>
            </Reveal>

            {/* Interactive Mock Test — full width */}
            <Reveal className="col-span-12" y={32} delay={0.16}>
              <Card radius="2xl">
                <div className="px-7 pt-7 pb-5 border-b border-border">
                  <span className="text-xs font-medium text-muted">Mock test</span>
                  <h3 className="text-lg font-semibold tracking-tight mt-2 mb-1">Full AMC practice, built in.</h3>
                  <p className="text-sm text-text-2 leading-relaxed max-w-xl">Timed, scored, and instantly debriefed — just like the real exam. Try a live question below.</p>
                </div>
                <div className="p-7">
                  <InteractiveMockTest />
                </div>
              </Card>
            </Reveal>

            {/* Interactive Diagnostic — full width */}
            <Reveal className="col-span-12" y={32} delay={0.2}>
              <Card radius="2xl">
                <div className="px-7 pt-7 pb-5 border-b border-border">
                  <span className="text-xs font-medium text-muted">Diagnostic assessment</span>
                  <h3 className="text-lg font-semibold tracking-tight mt-2 mb-1">Knows exactly where you stand.</h3>
                  <p className="text-sm text-text-2 leading-relaxed max-w-xl">Answer a few questions and watch the system pinpoint your strengths and gaps in real time.</p>
                </div>
                <div className="p-7">
                  <InteractiveDiagnostic />
                </div>
              </Card>
            </Reveal>

            {/* Diagnostic — small */}
            <Reveal className="col-span-12 md:col-span-5" y={32} delay={0.24}>
              <Card hoverable radius="2xl" className="h-full">
                <div className="p-7 pb-3">
                  <span className="text-xs font-medium text-muted">Diagnose mode</span>
                  <h3 className="text-lg font-semibold tracking-tight mt-2 mb-1">Adaptive diagnostic</h3>
                  <p className="text-sm text-text-2 leading-relaxed">10 questions that map your knowledge ceiling concept-by-concept and generate a study plan.</p>
                </div>
                <div className="mx-5 mb-5 mt-5 rounded-xl border border-border-2 bg-surface-2">
                  <DiagnosticPreview />
                </div>
              </Card>
            </Reveal>

            {/* Prep campaign — large */}
            <Reveal className="col-span-12 md:col-span-7" y={32} delay={0.3}>
              <Card hoverable radius="2xl" className="h-full">
                <div className="p-7 pb-3">
                  <span className="text-xs font-medium text-muted">Prep campaign</span>
                  <h3 className="text-lg font-semibold tracking-tight mt-2 mb-1">Day-by-day study plan</h3>
                  <p className="text-sm text-text-2 leading-relaxed max-w-xs">Set a competition date. The agent builds a day-by-day plan and adjusts after each session based on what you actually understood.</p>
                </div>
                <div className="mx-5 mb-5 mt-5 rounded-xl border border-border-2 bg-surface-2">
                  <CalendarPreview />
                </div>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Live Demo ── */}
      <section id="demo" className="relative z-10 px-8 py-32 scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <SectionHead className="mb-16" title="What a session looks like">
            The coach never gives you the answer. It asks the question that makes you find it.
          </SectionHead>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              {[
                { title: "Pick your competition", desc: "AMC 12, AIME, USAMO, USACO, USAPhO, USNCO, USABO — select the one you're training for." },
                { title: "Run a session", desc: "Coach mode for open questions, Practice for problems, Diagnose to map your gaps and get a study plan." },
                { title: "Derive, don't memorize", desc: "The coach never gives you the answer. It asks the question that makes you find it — so it actually sticks." },
              ].map((item, i) => (
                <Reveal key={item.title} delay={i * 0.1}>
                  <div className={`py-7 ${i > 0 ? "border-t border-border-2" : "pt-0"}`}>
                    <h3 className="text-base font-sans font-semibold text-text mb-1.5">{item.title}</h3>
                    <p className="text-sm text-text-2 leading-relaxed max-w-sm">{item.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal y={40} delay={0.1} className="order-1 lg:order-2">
              <AppWindow>
                <div className="p-6 bg-surface-2">
                  <LandingDemo />
                </div>
              </AppWindow>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──
          Removed deliberately. The previous three quotes ("Marcus T.", "Priya K.",
          "Daniel R.") were illustrative copy, not statements from real students,
          and were attributed to named people with specific competition outcomes.
          Publishing invented endorsements as genuine is an FTC endorsement-guide
          problem as well as a credibility one. Restore this section only with
          quotes from real students who have given written permission, and do not
          claim PolyTeach caused a qualification without evidence for that link. ── */}

      {/* ── Stats ── */}
      <section className="relative z-10 px-8 py-32">
        <div className="max-w-5xl mx-auto">
          <SectionHead className="mb-14" title="What the research on retrieval practice shows">
            Findings from the education-research literature on retrieval practice, tutoring and active learning — not measurements of PolyTeach. They describe why the method is built this way, not what it has achieved.
          </SectionHead>
          {/* Figures read as evidence, not as cards on a marketing page — a plain
              rule-divided row keeps the source line attached to its number. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-12 gap-y-10">
            {STATS.map((s, i) => (
              <Reveal key={s.stat} y={32} delay={i * 0.12}>
                <div className="border-t border-border-2 pt-6 h-full flex flex-col">
                  <div className="text-[44px] leading-none font-sans font-normal tracking-[-0.04em] mb-4 tabular-nums text-accent">{s.stat}</div>
                  <p className="text-sm text-text-2 leading-relaxed mb-4 flex-1">{s.desc}</p>
                  <p className="text-2xs text-muted">{s.source}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="relative z-10 px-8 py-32 bg-surface-2 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <SectionHead className="mb-14" title="How PolyTeach compares">
            AoPS pioneered math olympiad prep; USACO Guide owns competitive programming. PolyTeach&apos;s focus is competition math, coached Socratically rather than explained — with the same engine extended to the CS and science olympiads.
          </SectionHead>

          <Reveal y={32} delay={0.1}>
            <Card radius="2xl">
              <div className="overflow-x-auto">
                <div className="min-w-[720px]">
                  {/* Table header strip */}
                  <div className="px-8 pt-8 pb-6 border-b border-border">
                    <div className="grid gap-4" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}>
                      <div />
                      {COMPETITORS.map((c) => (
                        <div key={c.name} className={`text-center ${c.highlight ? "" : ""}`}>
                          {c.highlight ? (
                            <span className="text-xs text-accent font-semibold">PolyTeach</span>
                          ) : (
                            <span className="text-xs text-muted font-medium">{c.name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rows */}
                  <div className="px-8 pb-6">
                    {COMPARISON_ROWS.map((row, i) => {
                  const renderCell = (val: CellValue) => {
                    if (val === true) return <CellCheckIcon className="mx-auto" />;
                    if (val === false) return <CellCrossIcon className="mx-auto" />;
                    return <CellPartialIcon className="mx-auto" />;
                  };

                  return (
                    <div
                      key={row.feature}
                      className={`grid gap-4 py-5 ${i < COMPARISON_ROWS.length - 1 ? "border-b border-border" : ""} group`}
                      style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}
                    >
                      <div>
                        <p className="text-sm font-medium text-text group-hover:text-accent transition-colors duration-150">{row.feature}</p>
                        <p className="text-xs text-muted mt-1 leading-relaxed">{row.desc}</p>
                      </div>
                      {row.values.map((val, j) => (
                        <div
                          key={j}
                          className={`flex items-center justify-center ${COMPETITORS[j].highlight ? "relative" : ""}`}
                        >
                          {COMPETITORS[j].highlight && (
                            <div className="absolute inset-0 -mx-px bg-accent/[0.03] rounded-sm pointer-events-none" />
                          )}
                          {renderCell(val)}
                        </div>
                      ))}
                    </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer legend */}
              <div className="px-8 py-5 border-t border-border bg-surface-2 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <CellCheckIcon size={14} />
                  <span className="text-2xs text-muted">Full support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CellPartialIcon size={14} />
                  <span className="text-2xs text-muted">Partial / limited</span>
                </div>
                <div className="flex items-center gap-2">
                  <CellCrossIcon size={14} />
                  <span className="text-2xs text-muted">Not available</span>
                </div>
                <p className="text-2xs text-muted ml-auto">Competitor features based on publicly available information as of 2026.</p>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative z-10 px-8 py-32 scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <SectionHead className="mb-14" title="Simple pricing for serious competitors">
            AIME qualification is worth $0 to a college if you can&apos;t explain how you solved the problem.
          </SectionHead>

          {checkoutError && (
            <p className="text-center text-sm text-red-600 mb-6">{checkoutError}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Free */}
            <Reveal y={32} delay={0.05}>
              <Card hoverable radius="2xl" className="h-full p-7 flex flex-col">
                <p className="text-sm font-medium text-text-2">Free</p>
                <div className="mt-4 mb-1">
                  <span className="text-5xl font-semibold tracking-[-0.04em] tabular-nums">$0</span>
                </div>
                <p className="text-xs text-text-2 mb-7">30 sessions / month</p>
                <ul className="space-y-3 flex-1 mb-8">
                  {["Socratic coaching on all subjects", "Practice problem generation", "One diagnostic per subject"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-text-2">
                      <span className="mt-[5px] w-1 h-1 rounded-full bg-border-3 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button href="/coach" variant="secondary" className="text-center">
                  Start training
                </Button>
              </Card>
            </Reveal>

            {/* Pro */}
            <Reveal y={32} delay={0.12}>
              <Card hoverable radius="2xl" border="border-accent" bg="bg-surface-2" className="relative h-full p-7 flex flex-col">
                <p className="text-sm font-medium text-accent mb-0.5">Pro</p>
                <div className="mt-4 mb-1">
                  <span className="text-5xl font-semibold tracking-[-0.04em] tabular-nums">${PRO_PRICE}</span>
                  <span className="text-sm text-text-2 font-normal ml-1">/mo</span>
                </div>
                <p className="text-xs text-text-2 mb-7">Cancel anytime</p>
                <ul className="space-y-3 flex-1 mb-8">
                  {["Unlimited sessions", "Full adaptive study plan from diagnostic", "Competition prep campaign mode", "Week-by-week progress reports", "Concept-level mastery tracking"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-text-2">
                      <span className="mt-[5px] w-1 h-1 rounded-full bg-accent shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button onClick={() => subscribe("pro")} disabled={checkoutLoading !== null}>
                  {checkoutLoading === "pro" ? "Redirecting…" : "Subscribe"}
                </Button>
              </Card>
            </Reveal>

            {/* Team */}
            <Reveal y={32} delay={0.18}>
              <Card radius="2xl" className="h-full p-7 flex flex-col">
                <p className="text-sm font-medium text-text-2">Team / School</p>
                <div className="mt-4 mb-1">
                  <span className="text-5xl font-semibold tracking-[-0.04em] tabular-nums">${TEAM_SEAT_PRICE}</span>
                  <span className="text-sm text-text-2 font-normal ml-1">/seat/mo</span>
                </div>
                <p className="text-xs text-text-2 mb-7">{TEAM_MIN_SEATS}-seat minimum</p>
                <ul className="space-y-3 flex-1 mb-6">
                  {["Everything in Pro", "Seat-based billing for clubs and schools", "Invite-code team management"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-text-2">
                      <span className="mt-[5px] w-1 h-1 rounded-full bg-border-3 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-2 mb-4">
                  <label htmlFor="lp-seats" className="text-xs text-text-2 shrink-0">Seats</label>
                  <input
                    id="lp-seats"
                    type="number"
                    min={TEAM_MIN_SEATS}
                    value={seats}
                    onChange={(e) => setSeats(Math.max(TEAM_MIN_SEATS, Number(e.target.value) || TEAM_MIN_SEATS))}
                    className="w-16 bg-background border border-border-2 rounded-lg px-2 py-1.5 text-sm text-text outline-none focus:border-accent transition-colors"
                  />
                  <span className="text-xs text-text-2">= ${seats * TEAM_SEAT_PRICE}/mo</span>
                </div>
                <Button onClick={() => subscribe("team")} disabled={checkoutLoading !== null} variant="secondary">
                  {checkoutLoading === "team" ? "Redirecting…" : "Subscribe"}
                </Button>
              </Card>
            </Reveal>
          </div>

          <Reveal delay={0.2}>
            <p className="mt-10 pt-6 border-t border-border-2 text-xs text-muted leading-relaxed max-w-xl">
              At ${PRO_PRICE}/month across a four-month prep window, the cost lands under a single hour with a private math tutor — with unlimited sessions.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <Faq />

      {/* ── Bottom CTA ── */}
      <section className="relative z-10 px-8 py-36 text-center overflow-hidden">
        <Reveal>
          <h2 className="text-[clamp(28px,4vw,54px)] font-normal tracking-[-0.025em] mb-5">
            Train the way competitors train.
          </h2>
          <p className="text-base text-text-2 mb-10 max-w-sm mx-auto leading-relaxed">
            Pick your competition. Map your gaps. Work through problems until the answers come from you.
          </p>
          <Link
            href="/coach"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-medium bg-accent text-background hover:bg-accent-hover transition-all duration-150"
          >
            Start training free
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 2l5 5-5 5M2 7h10" />
            </svg>
          </Link>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border px-8 pt-16 pb-10">
        <div className="max-w-6xl mx-auto">
          {/* Top row */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-10 pb-14 border-b border-border">
            {/* Brand col */}
            <div className="col-span-2 md:col-span-2">
              <span className="flex items-center gap-2 text-sm font-semibold tracking-tight mb-4">
                <Logomark size={22} />
                <span><span className="text-text">Poly</span><span className="text-accent">Teach</span></span>
              </span>
              <p className="text-xs text-muted leading-relaxed max-w-[220px]">
                AI Socratic coaching for every major math, CS, and science olympiad — available 24/7.
              </p>
              <a
                href="mailto:asubramanian2000@gmail.com"
                className="inline-flex items-center gap-2 mt-5 text-xs text-text-2 hover:text-accent transition-colors duration-150"
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1" y="3" width="12" height="8" rx="1.5"/><path d="M1 4l6 4 6-4" strokeLinecap="round"/></svg>
                asubramanian2000@gmail.com
              </a>
            </div>

            {/* Product */}
            <div>
              <p className="text-xs font-medium text-text-2 mb-5">Product</p>
              <ul className="space-y-3">
                {[
                  { label: "AI Coach", href: "/coach" },
                  { label: "Mock Tests", href: "/mock-test" },
                  { label: "Progress", href: "/progress" },
                  { label: "Pricing", href: "#pricing" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-xs text-muted hover:text-text transition-colors duration-150">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Competitions */}
            <div>
              <p className="text-xs font-medium text-text-2 mb-5">Competitions</p>
              <ul className="space-y-3">
                {["AMC · AIME · USAMO", "USACO · ACSL", "USAPhO · F=ma", "USNCO", "USABO", "Science Olympiad"].map((c) => (
                  <li key={c}>
                    <Link href="/coach" className="text-xs text-muted hover:text-text transition-colors duration-150">{c}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Download */}
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs font-medium text-text-2 mb-5">Download</p>
              <div className="space-y-3">
                <Link
                  href="/download"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border-2 bg-surface hover:border-border-3 hover:bg-surface-2 transition-all duration-150 group"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-text-2 group-hover:text-text transition-colors shrink-0">
                    <path d="M11.182 3C9.91 3 9.09 3.674 8 3.674c-1.044 0-2.04-.674-3.182-.674C3.07 3 1 4.948 1 7.98c0 2.01.77 4.133 1.818 5.5.876 1.168 1.636 2.02 2.727 2.02.99 0 1.416-.643 2.455-.643 1.055 0 1.447.643 2.455.643 1.09 0 1.9-.906 2.727-2.02C14.23 12.113 15 9.99 15 7.98 15 4.948 12.93 3 11.182 3ZM8 3.266c.664-.768 1.636-1.266 2.182-1.266.072.874-.19 1.752-.736 2.42C8.937 5.07 7.98 5.62 7.273 5.58 7.18 4.72 7.49 3.862 8 3.266Z"/>
                  </svg>
                  <div>
                    <p className="text-2xs text-muted">Coming soon</p>
                    <p className="text-xs text-text-2 font-medium group-hover:text-text transition-colors">Mac</p>
                  </div>
                </Link>
                <Link
                  href="/download"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border-2 bg-surface hover:border-border-3 hover:bg-surface-2 transition-all duration-150 group"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-text-2 group-hover:text-text transition-colors shrink-0">
                    <path d="M6.555 1.375 0 2.237v5.45h6.555V1.375ZM0 13.795l6.555.933V8.313H0v5.482ZM7.278 1.268v6.42H16V.125L7.278 1.268ZM16 8.313H7.278V14.9L16 16V8.313Z"/>
                  </svg>
                  <div>
                    <p className="text-2xs text-muted">Coming soon</p>
                    <p className="text-xs text-text-2 font-medium group-hover:text-text transition-colors">Windows</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Support + Legal */}
            <div>
              <p className="text-xs font-medium text-text-2 mb-5">Support</p>
              <ul className="space-y-3 mb-8">
                {[
                  { label: "FAQ", href: "#faq" },
                  { label: "Contact us", href: "/contact" },
                  { label: "Getting started", href: "/coach" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-xs text-muted hover:text-text transition-colors duration-150">{label}</Link>
                  </li>
                ))}
              </ul>
              <p className="text-xs font-medium text-text-2 mb-5">Legal</p>
              <ul className="space-y-3">
                {[
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-xs text-muted hover:text-text transition-colors duration-150">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom row */}
          <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs text-subtle">© 2026 PolyTeach. All rights reserved.</p>
            <p className="text-xs text-subtle">Not affiliated with AMC, USACO, ACS, AAPT, or USABO.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
