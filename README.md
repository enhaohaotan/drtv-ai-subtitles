# DRTV AI Subtitles

An unofficial Chrome extension that displays AI-translated subtitles above the Danish original on DRTV. Supports 54 target languages, including Chinese, English, Japanese, Korean, Arabic, and European languages.

## Install and use

1. Download or clone this repository.
2. Open `chrome://extensions`, enable **Developer mode**, and click **Load unpacked**.
3. Select the folder containing `manifest.json`.
4. Open a DRTV programme, sign in if needed, and start playback.
5. Click **[DA]** in the player controls, then the settings gear. Enter your OpenAI API key and save.
6. Select a language to enable translation. Click the selected language again to turn it off.

Settings open inside the player and support fullscreen. You can adjust subtitle sizes and hide the Danish original. Language selection is remembered across reloads and browser restarts.

To update, replace the extension files, reload the extension at `chrome://extensions`, and refresh DRTV. Keep the installed folder in place.

## Translation and cost

Uses OpenAI with nearby dialogue and continuity notes for context. Each batch translates up to 12 cues, with up to 24 preceding and 12 following cues. Only subtitles loaded near the playback position are translated; this is not whole-episode context.

Choose **GPT-6.1 Sol** (default), **GPT-6 Luna**, or **GPT-6 Astra** in Settings. Input and output prices are shown in USD per 1M tokens. You supply your own API key and pay OpenAI directly. See [current pricing](https://developers.openai.com/api/docs/pricing).

Cached translations can appear as soon as DRTV loads the original cue. New translations require an API response; the original remains visible while waiting. Paused playback can still trigger nearby translation requests. Requests already sent may incur charges even after translation is disabled.

## Data and storage

See the [privacy policy](PRIVACY.md) for details.

- Subtitle text, nearby dialogue, programme titles, and continuity notes are sent directly to OpenAI. There is no developer-operated backend.
- The API key is saved locally by default. Uncheck **Remember the key on this device** for session-only storage, or use **Delete API key** to remove it. Local storage is not an encrypted vault.
- Translations are cached on this device for up to 30 days, within size limits. **Clear translation cache** removes saved translations; refresh DRTV to clear the current page's copy.
- The extension uses storage, scripts limited to DRTV pages, and access to `api.openai.com`. It does not request cookie or debugger access.

## Languages

Danish is the original language. Choose one of these 54 translation targets:

| Code | Language | Native name |
| --- | --- | --- |
| en | English | English |
| zh | Simplified Chinese | 中文 |
| ar | Arabic | العربية |
| az | Azerbaijani | Azərbaycanca |
| be | Belarusian | Беларуская |
| bg | Bulgarian | Български |
| br | Breton | Brezhoneg |
| bs | Bosnian | Bosanski |
| ca | Catalan | Català |
| cnr | Montenegrin in Latin script | Crnogorski |
| cs | Czech | Čeština |
| cy | Welsh | Cymraeg |
| de | German | Deutsch |
| el | Greek | Ελληνικά |
| es | Spanish | Español |
| et | Estonian | Eesti |
| eu | Basque | Euskara |
| fi | Finnish | Suomi |
| fo | Faroese | Føroyskt |
| fr | French | Français |
| ga | Irish | Gaeilge |
| gd | Scottish Gaelic | Gàidhlig |
| gl | Galician | Galego |
| hr | Croatian | Hrvatski |
| hu | Hungarian | Magyar |
| hy | Armenian | Հայերեն |
| is | Icelandic | Íslenska |
| it | Italian | Italiano |
| ja | Japanese | 日本語 |
| ka | Georgian | ქართული |
| ko | Korean | 한국어 |
| lb | Luxembourgish | Lëtzebuergesch |
| lt | Lithuanian | Lietuvių |
| lv | Latvian | Latviešu |
| mk | Macedonian | Македонски |
| mt | Maltese | Malti |
| nb | Norwegian Bokmål | Norsk bokmål |
| nl | Dutch | Nederlands |
| nn | Norwegian Nynorsk | Norsk nynorsk |
| oc | Occitan | Occitan |
| pl | Polish | Polski |
| pt | Portuguese | Português |
| rm | Romansh | Rumantsch |
| ro | Romanian | Română |
| ru | Russian | Русский |
| sco | Scots | Scots |
| se | Northern Sami | Davvisámegiella |
| sk | Slovak | Slovenčina |
| sl | Slovenian | Slovenščina |
| sq | Albanian | Shqip |
| sr | Serbian in Cyrillic script | Српски |
| sv | Swedish | Svenska |
| tr | Turkish | Türkçe |
| uk | Ukrainian | Українська |

## Development

No build step or runtime dependencies. Run the tests with a current Node.js version:

```sh
node --test tests/*.test.mjs
```

Language metadata is in [`languages.mjs`](languages.mjs).
