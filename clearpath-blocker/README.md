# ClearPath Blocker

A Chrome/Edge extension that blocks adult content and locks the off-switch behind a
password held by someone you trust.

## What it does

- **Blocks** ~100 known adult sites plus keyword patterns (`porn`, `xxx`, `hentai`,
  `nsfw`, `onlyfans`, …) and the `.xxx` / `.porn` / `.adult` / `.sex` / `.cam` / `.tube`
  top-level domains, in tabs and embedded frames.
- **Forces SafeSearch** on Google, Bing, and DuckDuckGo, and puts YouTube in
  Restricted Mode.
- **Nobody-knows-it lock (recommended):** generates a random password, keeps only its
  hash, and discards the plaintext forever. The only way to pause protection is the
  **24-hour delayed unlock** — request it, wait a day, and it's usable once for one
  hour. Weak moments don't survive a 24-hour delay; legitimate needs do.
- **Partner-held password (alternative):** someone you trust sets a password you don't
  know, and pausing requires it.
- Pauses last 30 minutes and auto-resume, even across browser restarts.
- **X / Twitter block (optional):** X hosts adult content natively and its media URLs
  carry no NSFW markers, so filtering inside the site is impossible — the only block
  that works is all-or-nothing. Turning it on is one click; turning it off requires
  the lock password or a ready delayed unlock. The X block stays on during pauses.

Blocking uses Chrome's declarativeNetRequest rules, so it works even in Incognito
(if the extension is allowed there) and doesn't read or record your browsing.
Nothing leaves your machine — the lock password is stored only as a SHA-256 hash
in local extension storage.

## Install (2 minutes)

1. Download/copy this `clearpath-blocker` folder to your computer.
2. Open Chrome (or Edge) and go to `chrome://extensions` (`edge://extensions`).
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `clearpath-blocker` folder.
5. Click the extension's **Settings & lock**, hand the keyboard to your
   accountability partner, and have them set the lock password.
6. In `chrome://extensions` → ClearPath Blocker → Details, enable
   **Allow in Incognito**.

## Honest limitations — read this part

Any blocker you install yourself, you can uninstall yourself. This extension is a
strong speed bump, not a vault. For real tamper-resistance, layer it:

1. **DNS filtering at the router** (covers every device and app in the house):
   CleanBrowsing Adult Filter (`185.228.168.10` / `185.228.169.11`) or NextDNS with
   the porn category enabled — account password held by your partner.
   Helper scripts for per-device DNS are in `scripts/`.
2. **iPhone:** Settings → Screen Time → Content & Privacy Restrictions → Web Content
   → **Limit Adult Websites**, with a Screen Time passcode someone else sets. This
   also blocks it in Safari private tabs.
3. **This extension** catches what DNS misses (keyword URLs, forced SafeSearch,
   YouTube Restricted Mode).

## Files

- `manifest.json` — extension manifest (Manifest V3)
- `rules/block.json` — domain + keyword blocklist (edit to add sites; bump rule ids)
- `rules/safesearch.json` — SafeSearch / Restricted Mode enforcement
- `background.js` — pause/resume logic with password gate and auto-resume alarm
- `popup.html/js` — status popup
- `options.html/js` — settings page with the accountability lock
- `scripts/set-dns-windows.ps1`, `scripts/set-dns-mac.sh` — set CleanBrowsing DNS
