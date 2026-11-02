# ともり — ひとりじゃない夜に

A quiet Japanese night room for mothers: glowing apartment windows, live presence, anonymous chat, and gentle encouragement. Adapted from the original Tomori design for GitHub Pages.

## Architecture

- Root HTML/JS files: published by GitHub Pages (`main` → `/`).
- `docs/`: matching source copy, also usable with Pages configured for `/docs`.
- Firebase Anonymous Authentication and Realtime Database: live chat and disconnect-aware presence.
- `firebase/database.rules.json`: deny-by-default access, owned presence, immutable messages, 300-character validation, and per-identity sending limits.
- `tests/backend.mjs`: 12 integration checks with disposable fixtures.

The Firebase project `tomori-oneope-20261102` is configured and the rules are deployed. Paid billing is disabled. Only public Firebase browser configuration is included.

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for hosting, verification, retention behavior, and operations.

## Preview

```sh
python3 -m http.server 4173 --directory docs
```

Open http://localhost:4173/night/.
