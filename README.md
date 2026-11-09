# Baby Strachan — prediction game

A one-page guessing game for Tegan and Josh's baby, due **10 December 2026**.
Nine guesses, scored for closeness once baby arrives.

Styled after the "Locally grown baby" shower invitation: sage and ivory,
gingham, and an illustrated baby that changes with your guesses.

## Files

| File | What it is |
|---|---|
| `index.html` | the whole app — no build step, no dependencies |
| `apps-script.gs` | the Google Apps Script behind it: storage, duplicate checking, email |
| `DESIGN.md` | design tokens, components, and how to add a screen consistently |

## Hosting it on Netlify

This repo is set up for Netlify. There is nothing to build, so the config is
small, and once connected every push to `main` redeploys the site.

In Netlify: **Add new site -> Import an existing project -> GitHub ->
baby-strachan**. Leave the build command **empty** and set the publish
directory to **`.`** — `netlify.toml` already says both, so the defaults
Netlify offers should be correct.

What `netlify.toml` does:

| Setting | Why |
|---|---|
| `Cache-Control: max-age=0, must-revalidate` on `/index.html` | the whole app is that one file, so a push must never be served stale |
| `connect-src script.google.com script.googleusercontent.com` | Apps Script redirects a POST to the second host; without it every save fails silently |
| `X-Robots-Tag` + `robots.txt` | a family game, not something strangers should find |
| `X-Frame-Options`, `Referrer-Policy`, `nosniff`, `Permissions-Policy` | ordinary hardening |

There is deliberately **no catch-all redirect**. The app routes on the `#hash`,
which never reaches the server, so a SPA fallback would only stop `404.html`
ever being served.

If you change the font strategy or add an external script, update the
`Content-Security-Policy` in `netlify.toml` to match, or the browser will block
it.

## The backend

`index.html` posts to a Google Apps Script web app, which writes each guess to a
tab in a Google Sheet and emails a notification.

To set it up: paste `apps-script.gs` into the Apps Script editor attached to your
Sheet, deploy it as a **Web app** with access set to **Anyone**, and put the
resulting `/exec` URL into `CONFIG.notifyEndpoint` at the top of `index.html`.

One script serves more than one game. Each writes to its own tab:

| `game` | Tab |
|---|---|
| `kohler-roberts` | `Predictions` |
| `strachan` | `Strachan Predictions` |

A request with no `game` defaults to `kohler-roberts`.

## The nine questions

Arrival date · arrival hour · weight · boy or girl · name · length · hair ·
eye colour · labour duration.

Date, hour, weight and length score on how close the guess came. The rest are
exact matches, except the name, which pays part marks for the right first
letter. 155 points available.

## Scoring and admin

Add `#kitchen` to the URL. Enter the actual results once and every guess is
scored into a leaderboard.

## Privacy

Mobile numbers are used only to tell guesses apart and to let someone come back
and change theirs. They are never shown in any summary or result.

**Note:** the deployed Apps Script answers `?action=list` to anyone who has the
URL, and that response includes entrants' names and mobile numbers. The URL is
visible in this source and in any hosted copy. Add a shared key to the `list`
action before sharing this widely.
