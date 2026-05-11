CLAUDE.md

<!-- KOYDO_VERCEL_NO_REMOTE_BUILD_RULE -->

## Vercel Deployment Rule

Never use Vercel remote builds for this repository. Do not run: vercel deploy --prod. Do not run any equivalent command that lets Vercel build remotely.

Required workflow:
- Build locally and deploy only prebuilt output with: vercel deploy --prebuilt --prod.
- If local prebuilt deployment is blocked on Windows or WSL/ext4 is unavailable, stop and tell the user to build/deploy from macOS.
- Do not fall back to Vercel remote build under any circumstance.

