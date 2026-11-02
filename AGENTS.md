# Deployment policy
- Work on `codex/uat` (or a feature branch based on it). Never push directly to `main` for routine changes.
- UAT: https://okitell-uat-20261102.web.app/night/ ; Firebase project `okitell-uat-20261102`.
- Production: https://ambermimi.github.io/oneope/night/ ; Firebase project `tomori-oneope-20261102`.
- Default development/deployment target is UAT. Run `node scripts/deploy-uat.mjs`; the project is pinned and its built config is checked. Never omit project flags for administrative commands.
- Do not copy production chat data, visitor identities, reports or credentials into UAT. Use synthetic fixtures only.
- UAT has five labeled fixture bots at any hour. `docs/environment.js` remains false in source; the UAT build overrides it in `.uat-dist`. Production keeps its single scheduled bot and one displayed reply.
- Keep root static files and docs mirrors synchronized when editing shared frontend code.
- Only promote to production when the user explicitly requests release after UAT review. Review the production Firebase configuration and verify `IS_UAT=false` before promotion. Do not merge UAT-specific hosting/default-project settings blindly.
- Real production database writes/deployments are outside routine UAT work.
