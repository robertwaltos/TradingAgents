# TradingAgents

Agent instructions for this repo.

<!-- KCC-COO-BANNER-START v1 — managed; do not hand-edit between sentinels -->

## 🎯 COO Orchestrator (Maven-backed)

This repo participates in the Koydo COO orchestrator pattern. When the user says `COO: {task}` or `execute {task} via COO`, follow the rules in **`COO.md`** at the repo root.

- **Expert library:** **1,009 named experts** in the **Maven** repo at `~/repos/robertwaltos/maven/experts/` (Linux) / `~/Koydo/maven/experts/` (macOS) / `D:\maven\experts\` (Windows). Organized across `experts/` (758), `experts/exam-ui/` (201), `experts/next-stack/` (39), `experts/exam-pkg/` (11). When no role-match exists for a task, the COO authors a new expert rather than forcing a stretch match.
- **Activation:** "COO: ..." or "execute ... via COO" → produce ONE structured report (📋 task / 👥 experts / 🔍 findings / ⚖️ tradeoffs / ✅ recommendations / 🎯 next actions). No preamble, no closer.
- **Selection:** As many experts as the task demands — no fixed cap. 1 for narrow tasks, 5–7 for cross-functional decisions, 15+ for programs/launches/board reviews.
- **Self-check:** Before returning, scan for fluff, hedge, missing owner/timeframe, banned preambles, Koydo-rule violations, expert-set defaulting.
- **Full spec:** see `COO.md` (managed copy in this repo).

<!-- KCC-COO-BANNER-END v1 -->
