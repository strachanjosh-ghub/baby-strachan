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

## Hosting it

Drag `index.html` onto [Netlify Drop](https://app.netlify.com/drop), or turn on
GitHub Pages for this repo. There is nothing to build.

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
