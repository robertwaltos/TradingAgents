## 🔁 Prompt-Improvement Protocol (applies to every user message)

Before doing anything else, silently rewrite the user's request into a clearer, more specific, more complete prompt — resolving ambiguity, naming concrete files/paths/constraints, and stating the success criterion. Then execute from the improved prompt, not the original. Show the improved prompt to the user in one short block before you start work, so they can correct it if you misread their intent. Skip the rewrite only for trivial one-liners (e.g., "what time is it", "ls").

---

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

<!-- KOYDO_CENTRAL_HANDOFF_RULE -->

## Central Handoff Repository

All durable handoff, prompt, assignment, launch-runbook, next-agent, and
continuation documents must be copied to the central private repository:

- Local path: `D:\koydo-handoffs`
- GitHub: `https://github.com/robertwaltos/koydo-handoffs`

Keep project-local copies only when the project also needs the document. Do not
publish internal handoff details, source paths, provider IDs, raw manifest links,
or secrets to public Koydo pages.

