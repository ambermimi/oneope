# UAT
Test site: https://okitell-uat-20261102.web.app/night/
Operator page: https://okitell-uat-20261102.web.app/admin.html

This environment uses a separate Firebase project, Authentication tenant data, Realtime Database and Hosting origin. No production messages or visitor data are copied. It is publicly reachable for link-based review, not password-protected; robots indexing is discouraged. Do not enter sensitive real information during tests.

Five explicitly labeled test bots show five sample messages and five lit star windows at any time. They are local synthetic fixtures, excluded from human visitor counts, and do not generate ongoing spam. Normal chat sending uses only the UAT database. Production retains one bot and a single displayed reply.

Work on codex/uat. Deploy with `node scripts/deploy-uat.mjs`. The build copies docs to ignored .uat-dist, replaces Firebase config with environments/uat.js and enables the UAT fixture flag. Source docs/environment.js stays production-safe. Never deploy .uat-dist to GitHub Pages. Tests: npm test, node tests/topics.mjs, node tests/uat.mjs.

Promotion requires an explicit user release request after review. Select reviewed frontend commits for main; preserve production Firebase config, original hosting and project defaults. Check root/docs mirrors and IS_UAT=false; publish main and verify Pages. Deploy production database rules only when explicitly part of that approved release. Pushing codex/uat does not update GitHub Pages.

For local preview, first build UAT and serve `.uat-dist` (never source docs with production config). Google operator login is enabled for the same approved operator account; its UAT permissions apply only to the separate test database. Five bot fixtures are not persisted, so deleting test chat records does not remove those fixtures.

Nicknames use 32 hiragana adjectives × 32 animals (1,024 combinations). The opt-in “この名前を覚える” checkbox saves only a numeric nickname code in a host-only Secure, SameSite=Lax cookie for one year. No account/profile is created. Unchecking expires the cookie without changing the active session name. Posts snapshot the validated nickname code so other participants see the same name after a return visit; older posts without a code derive their name as before. Nicknames are not unique or proof of identity. Anonymous greetings omit the code. Cookie saving does not persist authentication or moderation identity. Production is unchanged until explicit promotion.
