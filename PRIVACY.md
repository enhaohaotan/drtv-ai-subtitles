# Privacy Policy — DRTV AI Subtitles

Effective date: 19 October 2026

DRTV AI Subtitles is an independent Chrome extension maintained through the [enhaohaotan/drtv-ai-subtitles GitHub project](https://github.com/enhaohaotan/drtv-ai-subtitles). It displays translations of existing text subtitles on DRTV. It is not affiliated with DR.

## Information the extension handles

- **API credential:** the OpenAI API key you enter in Settings. It is sent directly to OpenAI over HTTPS to authenticate translation requests.
- **Programme content:** loaded subtitle text, cue IDs and timings, nearby dialogue, programme titles, and short continuity notes. These are sent to OpenAI when translation is enabled and a new translation is needed. Translations are returned to your browser.
- **Page and playback context:** the current DRTV programme path, subtitle track, playback position, pause state, and current video source are processed locally to identify the programme, synchronize subtitles, and manage translation requests. The extension does not access your general browser history. Programme titles and subtitle timings included in translation requests may reveal what you are watching to OpenAI.
- **Preferences and cache:** selected language, model, subtitle sizes, original-subtitle visibility, key-storage preference, and cached translations are stored in extension storage on your device.

No DRTV password or login cookie is requested or exported. No audio, video, or image is uploaded for translation. The extension contains no advertising or developer analytics service.

## Purpose and sharing

Information is used only to provide subtitle translation, synchronize the display, save your choices, and avoid repeating translation requests. There is no developer-operated translation server. The extension does not transmit your API key or viewing data to the maintainer.

OpenAI receives the API credential and translation request data described above. As with other direct HTTPS requests, OpenAI can also receive network metadata such as your IP address. OpenAI's processing, retention, and account terms are governed by its own policies and your account's arrangements. The extension requests `store: false`; this is not a guarantee of zero retention by OpenAI. See [OpenAI API data controls](https://developers.openai.com/api/docs/guides/your-data).

The extension does not sell user data, use it for advertising or credit decisions, or transfer it for purposes unrelated to subtitle translation. Its use of data is limited to the user-facing functionality described here, consistent with the Chrome Web Store User Data Policy and Limited Use requirements.

## Storage and retention

Your API key is saved in extension-local storage by default. If you turn off **Remember the key on this device**, it is kept in session storage instead. Local storage is not an encrypted password vault. Storage access is restricted to trusted extension contexts; the DRTV page bridge and content script do not receive the key.

Language and display preferences remain until changed or the extension's local data is removed. Local translation caching retains up to 8 groups, with up to 1,500 cues and a size bound per group. Cached entries stop being reused 30 days after their last write. Expiry does not itself erase an entry from disk: it may remain until eviction, cache clearing, or removal of extension data. A separate cache of up to 80 batch responses is held for the browser session. Page-memory data is discarded when that document is unloaded.

Enabling translation may send nearby subtitle requests while playback is paused. Turning translation off stops new requests and attempts to cancel pending ones. Data already sent to OpenAI is not recalled by cancellation or by clearing local storage.

## Your controls

- Select the active language again to turn translation off.
- Use **Delete API key** to delete the key from both local and session storage.
- Use **Clear translation cache**, then refresh DRTV, to clear saved translations and the current page's in-memory copy.
- Remove the extension or its local browser data to remove its locally stored preferences and caches.
- Manage your API key, account data, and provider-side data requests directly with OpenAI.

## Contact and changes

For questions, use [GitHub Issues](https://github.com/enhaohaotan/drtv-ai-subtitles/issues). Issues are public: do not include API keys, passwords, private account data, or viewing details you do not want to share. Security-sensitive reports can instead use the maintainer's contact method displayed on the Chrome Web Store listing when available.

This policy may change when the extension's data practices change. Updates will be published at this page with a revised effective date.
