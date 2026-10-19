# DRTV AI Subtitles

A Chrome Manifest V3 extension that displays one AI-translated subtitle language above the Danish original on DRTV. Version **0.6.5**.

This is an independent, unofficial prototype. It is not affiliated with or endorsed by DR. You need lawful access to the programme and your own OpenAI API key. API usage is billed to your OpenAI account.

## Install

1. Download and extract the extension, or clone this repository.
2. Open `chrome://extensions` in Chrome and enable **Developer mode**.
3. Click **Load unpacked** and select the folder containing `manifest.json`.
4. Open a DRTV programme, sign in to DRTV if needed, and start playback.
5. Click the language-code button in the player's lower-right controls. Click the settings gear to open **Translation settings** inside the player.
6. Enter your OpenAI API key and click **Save settings**.
7. Select a language. Click the selected language again to turn translation off.

Keep the extension folder in place after installation. To update an unpacked installation, replace its files, click **Reload** on its card in `chrome://extensions`, and refresh DRTV.

## Features

- A scrollable menu with 54 target languages. Language names use their native spelling; the rest of the interface is English.
- One translated language at a time, with the Danish original optionally shown below it.
- A language-code button: **DA** when translation is off, or the selected target code when enabled.
- Player controls and menus that follow the existing DRTV styling, including hover states and the red selected state.
- An in-page settings dialog that also works inside the fullscreen player.
- Separate subtitle-size settings: 24px for translation and 22px for the original by default.
- Short subtitles use one line per language where space allows. Existing hard line breaks are joined for display; long text wraps within reading-width limits.
- The original remains visible while a translation is unavailable or a request fails.
- Language selection, including the off state, survives page reloads and browser restarts. A new installation starts with translation off.

Enabling translation prefers the full **Dansk** text track. Disabling it restores the previous track modes and native subtitle display. There is no language-search field.

## Models and translation context

The extension uses the OpenAI Responses API with a strict JSON Schema. The model is selected from a custom dropdown; arbitrary model names are not accepted.

| Model | Input, USD per 1M tokens | Output, USD per 1M tokens |
| --- | ---: | ---: |
| GPT-6.1 Sol — default | $2.00 | $10.00 |
| GPT-6 Luna | $0.10 | $0.50 |
| GPT-6 Astra | $10.00 | $50.00 |

Prices were checked on 19 October 2026 and refer to Standard processing, uncached input, and short context. Reasoning tokens are billed as output. Cache charges and other processing tiers can differ. See [current OpenAI pricing](https://developers.openai.com/api/docs/pricing). Availability depends on your API account.

The default was chosen from documented capabilities and pricing, not a subtitle-quality benchmark. Real translation quality, latency, cost per episode, and account access have not been verified by the project's automated tests.

Each request translates up to 12 cues and includes up to 24 preceding cues, 12 following cues, and a short continuity note from a nearby previous batch. The prompt asks the model to preserve meaning, speaker turns, tone, names, humor, uncertainty, and sound cues, without inventing dialogue. Source and target languages are validated variables defined in `languages.mjs`.

Only loaded subtitles within approximately 75 seconds ahead of playback are scheduled for translation. The page bridge observes loaded cues within roughly 150 seconds before and after the current time. This does not provide guaranteed whole-episode context. The extension does not download the complete subtitle file, transcribe audio, or perform OCR.

Requests use `store: false`; this does not make a promise about the API provider's data-retention policy. Nearby subtitle translation can continue while playback is paused. Turning translation off stops new requests and attempts to cancel pending ones; requests already sent may still incur charges.

## Local storage and caching

- Your selected language is saved in extension-local storage.
- **Remember the key on this device** is enabled by default. Clear it to keep your key only for the current browser session. Local storage is not an encrypted vault.
- **Delete API key** removes the saved key from both local and session storage.
- Individual translations are cached locally by programme path, subtitle track, target language, model, and cue ID. Cue IDs include timing and a hash of the original text.
- The cache retains up to 8 groups. Each group is limited to 1,500 cues and a serialized-size bound, and expires after 30 days. Entries can be evicted earlier when limits are reached.
- A separate session cache retains up to 80 complete batch responses.
- **Clear translation cache** removes both caches. Reload DRTV afterward to clear translations already held by that page.

Returning to previously translated cues can display the cached translation once DRTV has loaded the original cue. Uncached, expired, or evicted cues still require a new translation request. Changing models or target languages does not reuse a different model's or language's translations.

## Data and permissions

The extension sends subtitle batches, preceding and following dialogue, the programme title, and short continuity notes directly to OpenAI. It does not send them to a developer-operated server. The API key is sent to OpenAI for authentication.

The settings page belongs to the extension and is embedded as a separate-origin iframe; the DRTV page cannot read its key field. Extension storage is restricted to trusted extension contexts. The page bridge and content script do not receive the API key.

The manifest requests `storage`, access to `api.openai.com`, and content-script access limited to DRTV pages. It does not request cookie access, debugger access, or access to every website. Never bundle a shared API key in a distributed copy.

## Validation and limitations

- The player integration was inspected on **Gift ved første blik, season 1, episode 1**, with a manually authenticated DRTV session.
- Browser checks covered control insertion, reading Danish cues, replacement subtitle display, fullscreen containment, settings, language switching, cancellation, and error handling, using mock translation responses.
- Persistence regression checks covered reloads, navigating away and returning, restoring the off state, and cache reuse without another model request.
- The Node test suite covers batching, source and target variables, response-ID validation, subtitle line handling, saved preferences, worker restarts, expiry, and cache separation by programme, track, model, and language.
- The automated tests use mock responses, not real paid API calls. They do not establish translation quality or production readiness.
- Integration depends on DRTV's current Video.js objects, DOM structure, and CSS classes. Website changes may require updates.
- Other programmes, live streams, picture-in-picture, casting, region restrictions, expired logins, and long playback sessions have not been comprehensively tested.
- Only existing text subtitles can be translated. If no usable track is loaded, the extension waits and leaves the native layer available.

A public release needs its own review of applicable rights, DRTV terms, branding, privacy disclosures, and store requirements. This repository does not grant rights to DR programmes or subtitles.

## Development

The extension has no runtime package dependencies or build step. Load this folder as an unpacked extension.

Run the tests with a current Node.js version:

```sh
node --test tests/*.test.mjs
```

| File | Purpose |
| --- | --- |
| `bridge.js` | Minimal page-world adapter for the Video.js player |
| `content.js`, `content.css` | Subtitle overlay, player controls, and settings dialog |
| `background.js` | OpenAI requests, key access, preferences, and local caches |
| `core.mjs` | Request schema, prompt, batching, validation, and display helpers |
| `languages.mjs` | Source and target language metadata |
| `icons.mjs` | Player language-code SVG icons |
| `options.html`, `options.js`, `options.css` | Extension-owned settings interface |
| `icons/` | SVG source, PNG extension icons, and favicon |
| `tests/` | Logic and persistence regressions using mocked data |
| `docs/feasibility.md` | Historical feasibility findings from 18 October 2026 |

## Target languages

Danish is the source language and the translation-off state, rather than a duplicate target.

| Code | Native name | Prompt language |
|---|---|---|
| zh | 中文 | Simplified Chinese |
| en | English | English |
| ja | 日本語 | Japanese |
| ko | 한국어 | Korean |
| ar | العربية | Arabic |
| de | Deutsch | German |
| fr | Français | French |
| es | Español | Spanish |
| it | Italiano | Italian |
| pt | Português | Portuguese |
| nl | Nederlands | Dutch |
| sv | Svenska | Swedish |
| nb | Norsk bokmål | Norwegian Bokmål |
| fi | Suomi | Finnish |
| pl | Polski | Polish |
| uk | Українська | Ukrainian |
| ru | Русский | Russian |
| sq | Shqip | Albanian |
| hy | Հայերեն | Armenian |
| az | Azərbaycanca | Azerbaijani |
| eu | Euskara | Basque |
| be | Беларуская | Belarusian |
| bs | Bosanski | Bosnian |
| br | Brezhoneg | Breton |
| bg | Български | Bulgarian |
| ca | Català | Catalan |
| hr | Hrvatski | Croatian |
| cs | Čeština | Czech |
| et | Eesti | Estonian |
| fo | Føroyskt | Faroese |
| gl | Galego | Galician |
| ka | ქართული | Georgian |
| el | Ελληνικά | Greek |
| hu | Magyar | Hungarian |
| is | Íslenska | Icelandic |
| ga | Gaeilge | Irish |
| lv | Latviešu | Latvian |
| lt | Lietuvių | Lithuanian |
| lb | Lëtzebuergesch | Luxembourgish |
| mk | Македонски | Macedonian |
| mt | Malti | Maltese |
| cnr | Crnogorski | Montenegrin in Latin script |
| se | Davvisámegiella | Northern Sami |
| nn | Norsk nynorsk | Norwegian Nynorsk |
| oc | Occitan | Occitan |
| ro | Română | Romanian |
| rm | Rumantsch | Romansh |
| sco | Scots | Scots |
| gd | Gàidhlig | Scottish Gaelic |
| sr | Српски | Serbian in Cyrillic script |
| sk | Slovenčina | Slovak |
| sl | Slovenščina | Slovenian |
| tr | Türkçe | Turkish |
| cy | Cymraeg | Welsh |

## Changelog

- **0.6.5:** Added Japanese, Korean, and Arabic; Arabic names and translated subtitles use right-to-left direction.

- **0.6.4:** Added the independently drawn extension icon, PNG sizes, SVG source, and favicon.
- **0.6.3:** Persisted language selection and individual translations across reloads and return visits.
- **0.6.2:** Added a compact custom model picker with separate pricing text; aligned the accent color and sharp-corner checkmark; removed language search.
- **0.6.1:** Added a fixed model list with pricing and changed the default to GPT-6.1 Sol.
- **0.6.0:** Added 51 target languages and variable source/target prompt metadata.
- **0.5.1:** Aligned the settings gear with the menu title and close button.
- **0.5.0:** Moved player settings into an in-page dialog with fullscreen support.
- **0.4.0:** Replaced the generic translation symbol with the active language code.
- **0.3.0:** Standardized interface text on English and aligned player-menu styling.

## References

- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
- [Chrome storage](https://developer.chrome.com/docs/extensions/reference/api/storage)
