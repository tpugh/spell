# Chrome Web Store listing

Draft listing content for the Spell extension. Everything here is either ready to paste or marked
as a manual step.

## Store listing fields

| Field | Value |
|---|---|
| Name | Spell — spelling practice |
| Short description (132 chars max) | Kid-friendly spelling practice with audio prompts. Works offline, no accounts, and all word lists stay on the device. |
| Category | Education |
| Language | English |
| Privacy policy URL | https://tpugh.github.io/spell/privacy.html |
| Homepage URL | https://tpugh.github.io/spell/ |
| Support URL | https://github.com/tpugh/spell/issues |
| Official URL | https://github.com/tpugh/spell |

### Detailed description

```
Spell helps young children practise spelling words with a calm, audio-first interface.

• Manage word lists — type the words your child is learning this week.
• Practice mode — hear the word, type it, get instant encouragement, and retry missed words.
• Test mode — take a short scored test and review the words to practise next.
• Easy-read font — one tap switches to a dyslexia-friendly typeface with wider spacing.
• Accessible by design — full keyboard support, screen reader announcements, large tap targets,
  WCAG AA contrast, and reduced-motion support.
• Private by default — no accounts, no ads, no tracking. Word lists and results are stored only on
  this device (chrome.storage.local).

Spell was built for a six-year-old: big buttons, short screens, and nothing to configure before you
can start.
```

## Permission justification

| Permission | Why it is needed |
|---|---|
| `storage` | Saves word lists, test results, and the last opened tab id on the device. Nothing is transmitted. |

No host permissions, no `tabs`, no remote code. The app bundle is fully self-contained.

## Single purpose statement

> Spell is a spelling-practice app: it lets a child review a parent-managed word list through audio
> prompts and typed answers, and stores that progress locally.

## Data usage disclosures

- Does the extension collect personally identifiable information? **No**
- Health, financial, authentication, personal communications, location, web history? **No**
- Does it sell or transfer data to third parties? **No**
- Is data used for purposes unrelated to the single purpose? **No**
- Is data used to determine creditworthiness or for lending? **No**

## Assets

| Asset | Status |
|---|---|
| Store icon 128×128 | `extension/icons/icon-128.png` — ready |
| Screenshots 1280×800 (or 640×400) | Manual: capture the home screen, practice mode, results, and easy-read mode |
| Small promo tile 440×280 (optional) | Manual |

## Submission checklist

1. Build and zip: `npm run build:extension`, then zip the contents of `dist-extension/`
   (or download `spell-chrome-extension.zip` from the GitHub release).
2. Load unpacked in `chrome://extensions` and smoke-test: create a list, practise a word, take a
   test, reload the browser and confirm the data is still there.
3. Confirm `manifest.json` version matches `package.json` (the build copies it).
4. Upload the zip in the Chrome Web Store developer dashboard, paste the fields above, and attach
   the screenshots.
5. Submit for review.

## Versioning

`package.json` `version` is the single source of truth. `scripts/build-extension.mjs` writes it into
the packaged manifest. Bump it before each store submission, and update the release tag to match.
