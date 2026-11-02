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
- Messages are immutable, limited to 300 characters, and throttled to one write every second and twelve writes per 60-second window per anonymous identity. Exact consecutive duplicates require 15 seconds. Atomic message/guard writes bind each quota use to one message ID; users cannot reset their guard. The page additionally rejects excessive repeated characters or three or more links. Creating fresh identities can bypass this basic limit; it is not comprehensive spam prevention.
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

The sticky Amber mimi wordmark links to https://ambermimi.shop/ in a separate tab. Optional music-box audio is synthesized locally with an original melody and decaying bell partials. It never autoplays, stops when hidden, and uses no external audio assets. Sender appears before the message; timestamps appear on hover or keyboard focus without reserving vertical space. Names use 32 hiragana prefixes × 32 animals (1,024 combinations, not guaranteed unique). The anonymous greeting displays “だれかより”; authenticated sender IDs remain in backend message records for ownership and abuse controls, so this is display anonymity, not unlinkability.


## Reports and manual review

The message reaction menu includes 報告. Reports are accepted only from an authenticated account other than the message sender, for an existing message less than a day old. One report per sender/reporting account is allowed; report creation and counter increment are atomic and validated together. Three distinct anonymous accounts trigger room-wide display suppression for that sender and block further posts. Existing records remain available to administrators for review; this is not data deletion or a confidentiality boundary. Anonymous accounts do not establish distinct human identity, so determined account recreation can circumvent anti-abuse controls.

In the Firebase Realtime Database console for `tomori-oneope-20261102`, inspect `moderation/{senderUid}/count`, then `reports/{senderUid}`. Each report contains a `messageId` pointing to `chat/{messageId}` and its creation time. Reporter records are private to the reporter and administrators. Set `moderation/{senderUid}/status` to `visible` to restore messages and posting after review, or `hidden` to keep both suppressed. Only project administrators can set status; ordinary clients cannot. A `visible` decision overrides the automatic threshold until an administrator changes it. Do not delete reports simply to restore an account; preserve the review evidence. No automatic moderator notification is configured.

The Japanese wording filter rejects a short, explicit list of insults/threats on the page and server. Expressions of distress remain allowed. This is a basic keyword safeguard, not contextual moderation.


## Sky illustration and sunrise

The original SVG sky depicts schematic Cassiopeia and Orion figures inspired by constellations visible from Japan; it is not a live directional chart. References: https://www.nao.ac.jp/astro/sky/2026/11.html and https://www.iau.org/IAU/Astronomy-FAQs/Constellations.aspx . Sunrise and sunset are calculated locally with vendored SunCalc 1.9.0 (license included), at Tokyo coordinates 35.6762, 139.6503. The date is selected in JST, independent of device timezone. Dawn blends from 45 minutes before sunrise through 30 minutes after it; stars fade and evening restores the night palette. The page updates once per minute and on return from the background. No location permission or location API request is used.

## Operator message deletion
`/admin.html` is a separate operator page. Google login is isolated from the anonymous chat session (in-memory persistence). Enable Google in Firebase Authentication (or configure `auth.providers.googleSignIn` with the approved support email and deploy auth). After the approved operator logs in, verify their Google provider and email in Firebase Authentication, then set `operators/{their Firebase UID}` to `true` through trusted project administration. Never grant a client permission to edit this allowlist. Delete the entry to revoke access.

Operators can read all retained chat messages and delete existing messages and reactions; they cannot edit message content or grant operator access. The confirmation shows a snapshot count and requires typing 削除. Deletion atomically removes only those captured message IDs and their reactions, preserving posts arriving after the snapshot. Reports, moderation restrictions and presence are retained. This is permanent deletion; no deletion is performed merely by deploying or opening the page. Automatic local encouragement may still appear as it is generated on the participant's device, not stored chat history.

Run `firebase emulators:exec --only database --project demo-tomori 'node tests/admin-rules.mjs'` to check operator deletion, denied ordinary-user access and self-grant, revoked access, preserved newer messages and preserved reports without deleting production data.

Operator Google sign-in is enabled. The approved email is stored privately at `operatorConfig/email`, not in public source. Verified Google tokens with that exact email can read `operatorAccess` (true) and use deletion rights; no manual first-login UID setup is needed. `operators/{uid}` remains a trusted-admin-only alternative. Clients cannot read or change operator configuration. Change/remove the private email to revoke email-based access. Google provider configuration must be maintained in Firebase; do not commit the support email or OAuth credentials.

## Daily visitors
`visits.js` uses a separate persisted anonymous Firebase identity for daily visitor statistics; chat identities remain per-tab. A browser profile counts once per JST calendar day, including visitors who do not post. Different devices/profiles or cleared storage can count separately; this is not a verified count of unique people. Bots do not create visits. `visitDays/{JST day number}/count` is readable to signed-in visitors; member identities are readable only by that same identity. Rules couple a first daily membership record to exactly one count increment and reject changes to past days. `visitorStatsStartedAt` records when collection began. Yesterday is shown as preparing before collection exists, never backfilled from chat messages. The first reported day covers only the period after collection began.

Automatic encouragement now runs 21:00–05:00 JST; no schedule copy is displayed on the page. Run `node tests/bots.mjs` and the emulator with `node tests/visits.mjs` for the schedule and statistics boundary checks.

Automatic encouragement UI: the status/count banner is removed; replies are labeled 応援係（自動）. Each eligible non-anonymous post during 21:00–05:00 gets a deterministic one-emoji short reply after 20 seconds and an automatic thumbs-up marker after 20 seconds. Sensitive distress messages get supportive text without an automatic like. Updates are scheduled locally and never create fake Firebase people or persisted reactions. Foreground timers update at the threshold; background browser throttling can delay display until resumed. Automated activity remains limited to the night window.

Reply variation uses the random Firebase message ID to select from context-sensitive short phrases, keeping the result stable across redraws and clients. At the scheduled 20-second reply time, 4+ human posts by 2+ sender IDs in the preceding 2 minutes suppress that reply. Suppression is evaluated at its original due time, so skipped replies are not sent as a backlog when the room quiets; future posts can receive replies again. Likes remain at 20 seconds. Tests cover busy thresholds, single-sender activity, resumption, preservation of older replies and stable variation.

Presence now starts automatically once the visible page authenticates and connects; no join click or message is required. The former join button scrolls to the chat. Visibility changes remove/recreate presence, disconnect cleanup removes closed tabs, and the existing 90-second freshness cutoff excludes stale connections. Presence is still per anonymous tab/session (multiple open tabs or devices can count separately), distinct from the persisted browser identity used by daily visitor totals.

Topic summaries: the operator page shows broad, approximate keyword counts computed in memory. Multiple categories can match one message. Before a confirmed manual deletion, it atomically stores only schema version, total and eight category counts under a random batch ID alongside message/reaction removal. No message text, names, user/message IDs or posting times are copied into summaries. Archives are private to operators, immutable and reject additional fields. Opening or refreshing the report never deletes anything. Previously deleted messages cannot be recovered for classification. This covers manual deletion through the operator page, not automatic expiry/cleanup. Run tests/topics.mjs and emulator tests/topics-rules.mjs.

Bot display is capped at the single latest eligible reply across the entire rendered conversation, including large screens. Older synthetic replies are omitted; human messages are unaffected. The 20-second delay, quiet-conversation eligibility and transparent automatic label remain.
