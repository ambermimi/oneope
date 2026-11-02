# Tomori: GitHub Pages + Firebase

The static site is in `docs/`. It preserves the original Japanese Tomori design and uses Firebase Anonymous Authentication + Realtime Database for shared chat and presence. No Cloud Functions or paid billing are required by this implementation.

## Current backend

Project: `tomori-oneope-20261102`. Anonymous Authentication, the Singapore Realtime Database, production rules, and the GitHub Pages authorized domain are configured. Paid billing has not been enabled.

## Connect another Firebase project

1. Use a separate Firebase project for Tomori. Register a Web app.
2. Enable **Authentication → Sign-in method → Anonymous**.
3. Create a **Realtime Database** in locked mode (Singapore is the closest available RTDB region to Japan).
4. Copy the Web app configuration into `docs/firebase-config.js`, replacing `null`. Include `databaseURL`. This public browser configuration is not an admin credential. Never commit a service account key or login token.
5. Deploy access rules: `firebase deploy --only auth,database --project YOUR_PROJECT_ID`.
6. Add `ambermimi.github.io` to Authentication's authorized domains.

## Enable GitHub Pages

Repository owner: open **Settings → Pages → Build and deployment → Deploy from a branch**, select **main** and **/ (root)**, then save. The connected GitHub account has write permission but does not have the administrative permission required to enable Pages. Private repositories may require an eligible GitHub plan. Do not change visibility without the owner's decision.

Expected URL after successful deployment: https://ambermimi.github.io/oneope/night/

## Data and limits

- Each browser tab gets an anonymous identity; no name/email is required.
- Only authenticated visitors can read chat and presence.
- Messages are immutable, limited to 300 characters, and throttled to one write every three seconds per anonymous identity. Creating fresh identities can bypass this basic limit; it is not comprehensive spam prevention.
- The browser renders text as text, not HTML.
- Presence uses server-side disconnect cleanup, a 30-second heartbeat, and a 90-second display timeout. Hidden tabs remove their presence.
- Only the latest 100 messages from the last 23–24 hours appear (the cutoff advances hourly). Old records remain in Firebase until an administrator deletes them; this is not automatic data deletion. A scheduled trusted cleanup job can be added later.
- Database reads are query-limited, and default access is denied. Users can only edit their own presence and rate-limit record.
- Before broader promotion, plan moderation/reporting and abuse controls (for example Firebase App Check), monitor database usage, and choose a retention policy.

## Local preview

`python3 -m http.server 4173 --directory docs`

Open http://localhost:4173/night/. Without Firebase configuration, the page clearly shows an opening-soon state and disables shared actions. It does not fabricate participants or messages.

## Verification

`TOMORI_TEST_PROJECT=tomori-oneope-20261102 node tests/backend.mjs` runs 22 live integration checks with disposable fixtures, then removes them. Requires Node.js 22+ and an authenticated Firebase CLI with project admin access. Syntax checks and live integration checks passed.

The active Pages configuration publishes the repository root. The static files are mirrored there from `docs/`; keep both copies in sync when editing.

## Night helpers, nicknames, and reactions

Night helpers run 22:00–05:00 Asia/Tokyo: one for 0–4 present people and two for 5+. They are labeled automatic helpers, excluded from human counts, and represented with stars. Preset encouragement is rendered locally from shared messages, at most once per minute, with a 2.5-second delay. It is not stored chat or an AI/medical service. There is no extra background server or billing. Hiragana animal names are deterministically derived from each anonymous session ID; names are not guaranteed unique.

Positive reactions are stored at `reactions/{messageId}/{uid}`. Each reader can choose, change or remove one of six allowed emoji on someone else's recent message. Rules reject self-reactions, arbitrary text, negative emoji, missing-message targets and changes to someone else's reaction. Reactions are read only for loaded recent messages. Their stored retention follows the same administrator-managed policy as messages.

The mobile composer uses 16px input text and visual viewport positioning to keep Send alongside the input when the keyboard opens. Enter adds a newline; Ctrl/Cmd+Enter sends outside Japanese IME composition.

`node tests/bots.mjs` and `node tests/names.mjs` validate schedule boundaries, scaling, pacing, deterministic replies, and nickname generation.
