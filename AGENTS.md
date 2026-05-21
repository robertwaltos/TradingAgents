<!-- RW-GLOBAL-EXECUTION-PROTOCOL-START v1 -->
## Global Execution Protocol

- Prompt improvement is required before every non-trivial user request: rewrite the request into a clearer prompt, show it briefly, then execute from the improved version.
- Every non-trivial workspace task must run through the execution discipline in `/Users/robertwaltos/Koydo/coo.md`: clarify the objective, select the right specialist lenses, execute directly, verify against real files/runtime evidence, and finish the task instead of stopping at advice.
- For Koydo, Cantavis, or Koydo-adjacent work, consult Koydo Maven experts from `/Users/robertwaltos/koydo-maven` (`COO.md`, `content/personas/`, and `packages/maven-experts`) and use as many expert perspectives as the task actually needs.
- End every completed task in a simple human-to-human style: say what changed, what was verified, what remains if anything, and the next best actions. Keep it direct and conversational.

<!-- RW-GLOBAL-EXECUTION-PROTOCOL-END v1 -->

CLAUDE.md

<!-- KOYDO_VERCEL_NO_REMOTE_BUILD_RULE -->

## Vercel Deployment Rule

Never use Vercel remote builds for this repository. Do not run: vercel deploy --prod. Do not run any equivalent command that lets Vercel build remotely.

Required workflow:
- Build locally and deploy only prebuilt output with: vercel deploy --prebuilt --prod.
- If local prebuilt deployment is blocked on Windows or WSL/ext4 is unavailable, stop and tell the user to build/deploy from macOS.
- Do not fall back to Vercel remote build under any circumstance.


<!-- KOYDO_CENTRAL_HANDOFF_RULE -->

## Central Handoff System (MERIDIAN, in Obsidian)

All durable handoff, prompt, assignment, launch-runbook, next-agent, and
continuation documents must be copied to the central private repository:

- Location: `C:\Users\rober\Obsidian Vault\MERIDIAN\` (Obsidian vault — syncs across machines)
- GitHub: `github.com/robertwaltos/koydo-handoffs (ARCHIVED read-only 2026-06-11; live system = vault MERIDIAN)`

Keep project-local copies only when the project also needs the document. Do not
publish internal handoff details, source paths, provider IDs, raw manifest links,
or secrets to public Koydo pages.


<!-- KOYDO_FREQUENT_WORK_COMMIT_RULE -->

## Frequent Work Commit Rule

In addition to any background or running git sync, agents must make frequent, intentional work commits while executing non-trivial tasks. Do not rely on scheduled sync as the only safety net.

Commit coherent, reversible slices after meaningful progress and validation: before machine restarts, before long-running risky operations, before switching task lanes, and after updating durable handoffs. Stage only files for the current slice, preserve unrelated dirty work, use clear commit messages, and push the branch/repo when the user asks to ship or when the task instructions require shipping.

If a commit cannot be made, record the reason in the handoff or nextsteps file and continue with the safest executable work.
<!-- KOYDO_TASKS_SSOT v1 -->
## 📋 Task Board — SSOT for open work (all agents)

Open work items live on the cross-machine task board in the Obsidian vault:
`C:\Users\rober\Obsidian Vault\TASKS\` — READ `TASKS-SYSTEM.md` there before adding/claiming.
Rules in one line: one task = one file; folders = 1-USER (owner-only) / 2-AGENTS (claimable) /
3-BLOCKED (named unblock condition); claim via frontmatter `owner:`; on completion append to
DONE-LOG.md and delete the task file (only the completer may do this). Do NOT append work items
to per-repo NEXT-STEPS/TODO files — they are frozen. Durable handoffs go to the vault
`MERIDIAN\` folder (see its README).
<!-- /KOYDO_TASKS_SSOT v1 -->
