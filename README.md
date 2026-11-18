# Ippo Care · Legal and support pages

Source of the public pages for the Ippo Care iPhone app:

| Page | English | Other languages |
| --- | --- | --- |
| Privacy Policy | https://moka992.github.io/ippo-care-legal/privacy/ | `/zh-Hans/privacy/`, `/zh-Hant/privacy/`, `/ja/privacy/`, `/ko/privacy/` |
| Terms of Service | https://moka992.github.io/ippo-care-legal/terms/ | same pattern |
| Support | https://moka992.github.io/ippo-care-legal/support/ | same pattern |

Provider: Yusen Wang, individual developer of Ippo Care · Contact: wm88889@hotmail.com

## Integrity

- Only the repository owner can change these documents. The `main` branch is protected: force pushes and branch deletion are blocked, and the full history of every change stays public in the commit log.
- The published site is built from `locales/*.json` by `build.mjs` into `docs/`, which GitHub Pages serves.
- Copyright © 2026 Yusen Wang. All rights reserved. The text is published for reading; it is not licensed for reuse.

## Build

```sh
node build.mjs   # writes docs/
```
