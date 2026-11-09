# Baby Strachan — design system and build notes

## 1. The revised flow

```
Welcome ─► Your details ─► 9 question steps ─► Review ─► Confirmation
                 │                  ▲   │
                 │                  └───┘  Edit returns to Review
                 ▼
         Already guessed? ─► Keep it  /  Change my guesses
```

- **Nothing advances on its own.** Every step waits for **Continue**. Back never loses an answer.
- **Review** lists all nine with an **Edit** beside each. Editing from Review jumps to that step,
  the button becomes **Done**, and it returns straight to Review without replaying the rest.
- **Draft** saves to the device on every change. The welcome screen offers to resume it and says
  plainly it is *not sent yet*. The draft is cleared only once a save succeeds.
- **Submission** confirms only after the save returns success. On failure the answers and the
  draft are untouched and the error says so.

## 2. Tokens

All in the `:root` block at the top of the file. Change them there, never in the rules below.

| Token | Value | Use |
|---|---|---|
| `--olive` | `#44512F` | body text, primary buttons — 9.0:1 on ivory |
| `--olive-ink` | `#2F3920` | headings, answer values — 13.6:1 |
| `--sage` | `#687647` | secondary accent, brand — 4.8:1 |
| `--sage-mid` | `#8FA06C` | decorative only, **never text** |
| `--sage-pale` | `#DCE4CC` | selected fills, slider tracks |
| `--ivory` | `#FCFBF4` | the reading surface |
| `--ivory-sunk` | `#F4F2E6` | wells, hover |
| `--muted` | `#5E6B47` | secondary text — 6.4:1 |
| `--berry` / `--good` | `#9A3F3F` / `#3F6B43` | errors / saved |

Spacing runs `--s1` 4px to `--s7` 42px. Radii `--r-sm` 8, `--r-md` 14, `--r-lg` 20, `--r-pill`.
`--tap` is 48px, the minimum height for anything you can press.

**Type.** Cormorant Garamond for questions and headings, Work Sans for everything you operate or
read in bulk, Yellowtail for the brand only — never for data or numbers.

## 3. Components

| Class | What it is |
|---|---|
| `.btn .btn-primary` | one per screen, fills the action bar |
| `.btn .btn-ghost` | the secondary choice beside it |
| `.btn-text` | inline, like Edit |
| `.btn-icon` | 44px round, for back and ± |
| `.choice` | a selectable card; `.stack` centres it; add `.swatch` for colour |
| `.field` | label + input + help + `.err`; `[data-invalid]` reddens the border |
| `.card` / `.well` | raised panel / inset panel |
| `.topbar` + `.progress` + `.body` + `.actions` | the step template |

## 4. Adding a screen

1. `<section id="s-name" class="scr">` and add `"name"` to `SCREENS`.
2. Use the four-part template: `.topbar`, optional `.progress`, `.body` (scrolls), `.actions` (pinned).
3. One `.q` heading, one `.btn-primary`. Supporting detail goes in `.q-help`, not the heading.
4. Build controls from `.choice`, `.field` and `.card`. Do not invent new shapes.
5. Every state needs a look: loading, empty, error, disabled, selected, saved, done. The admin
   table and the resume box show the empty and saved patterns.

## 5. The baby

One function, `babySVG({weightKg, lengthCm, hair, iris})`, used on weight, length, hair, eyes and
the confirmation. It is **uniformly proportional**: the whole figure is `cm / 60` of the drawing
box, so the head lands on the matching ruler tick. Weight changes widths, cheeks and limb
thickness only — the head never stretches. `headFrac(cm)` is the single source of truth for where
a value sits, and the ruler ticks, slider travel and guide line are all placed from it.

## 6. What is functional, what needs you

**Working now:** the whole journey, validation, draft save and resume, review and edit, the
animated baby, duplicate detection, the update-an-existing-guess path, scoring, and the `#kitchen`
admin screen.

**Needs the Apps Script deployed** (`predictions-apps-script.gs`, not yet redeployed):
shared storage in the `Strachan Predictions` tab, email notification, and replacing an existing
guess. Until then the app saves to the device only and says so honestly when a save fails.

**Not built, by choice:** no SMS or consent flow — the mobile number is only an identifier, and
the screen says exactly that. No public leaderboard; numbers never appear in any summary.

## 7. Verified

Journey, draft recovery, save failure, returning guest, review editing and reduced motion all
tested. Accessibility swept on every step at 320, 390, 430, 834 and 844×390: no contrast failures,
no target under 44px, no horizontal scroll, no script errors.
