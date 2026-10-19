# DRTV subtitle translation: feasibility findings

**Observation date:** 18 October 2026.  
**Target:** [Gift ved første blik, season 1, episode 1](https://www.dr.dk/drtv/se/gift-ved-foerste-blik_50766).

This document preserves the initial investigation. Statements about work not yet implemented describe the state on that date; see the README for the current extension.

## Findings

The inspected programme provided a verifiable path to reading text subtitles, synchronizing their timing, and displaying a translation layer inside the player. These observations did not establish compatibility with every DRTV programme.

| Area | Observation |
| --- | --- |
| Authentication | An isolated Chrome profile initially displayed the email sign-in page. The user signed in manually, after which the programme loaded. Reopening the same profile retained access. Credentials were not exported. |
| Player | The DOM used Video.js, a `.video-js` container, and a video element with ID `drtv_videojs_html5_api`. |
| Subtitle transport | Observed network requests returned an HLS subtitle playlist and WebVTT segments with HTTP 200. |
| Tracks | The player exposed both `Fremmedsprogstekster` and `Dansk`, with language `da` for each. Language code alone was insufficient to choose the full Danish track. |
| Native API | The native video's `textTracks` collection was empty in this observation, so it could not be assumed to provide the required cues. |
| Visible text | `.vjs-text-track-display` exposed the currently displayed text, including from an isolated JavaScript world. |
| Player object | In the page world, `document.querySelector('.video-js').player.textTracks()` exposed cues and their `startTime`/`endTime`. The isolated world could not directly access that page-owned property. |
| Synchronization | Seeking to 138 seconds produced the corresponding cue. At 180 seconds, the DOM and player `activeCues` agreed; the inspected cue ran from 176.68 to 181.24 seconds. |
| Overlay | A temporary layer inside `.player` displayed sample Chinese/English text above Danish. These were fixed examples, not translation API output. |
| Fullscreen | The player's fullscreen button worked, and `document.fullscreenElement` contained the translation layer. This was not a visual regression across all sizes. |
| Prefetch investigation | Fetching the observed `Dansk` playlist and its first segment from the authenticated page returned HTTP 200. The playlist contained 38 segments with VOD/ENDLIST markers. The first segment contained 10 WebVTT cues and `X-TIMESTAMP-MAP`. The complete subtitle file was not downloaded. |

## Initial implementation proposal

Use a Manifest V3 extension limited to DRTV pages and place the translation layer inside the player.

1. Observe visible subtitle text for the smallest prototype. Translating only after a cue appears necessarily introduces a wait.
2. For prefetching, add a small MAIN-world adapter that reads the selected player's cues and playback time, then forwards a bounded message to the isolated content script.
3. If a longer prefetch range is necessary, investigate the actual observed playlist, segmented WebVTT, and timestamp mapping. Do not assume `track.cues` contains the whole episode or hardcode CDN URLs, segment counts, or programme IDs.
4. Call the translation service from the extension service worker. Cache by programme, track, target language, and source text. Invalidate stale requests on seeking and retain the original when translation fails.
5. Keep the overlay inside the player and account for control visibility, wrapping, and fullscreen geometry. A successful demonstration does not prove final layout quality.

The implementation subsequently adopted the player-cue bridge rather than downloading whole subtitle playlists. The current product shows a single translated language at a time.

## Authentication and permissions

The observed approach reused the user's authenticated playback page. It did not require exporting DRTV cookies, replaying login requests, or fetching video files for translation. A successful fetch from the page was not evidence that an extension service worker could fetch the subtitle CDN with the same permissions.

## Original validation gaps

At the time of this investigation:

- Real translation quality, latency, throughput, and cost per episode had not been measured.
- The formal extension, messaging lifecycle, and service-worker requests still needed end-to-end validation.
- Only one programme and one authenticated environment had been inspected.
- Episode changes, SPA navigation, track changes, continuous playback, offline behavior, session expiry, and prolonged use were not comprehensively covered.
- Picture-in-picture and Chromecast were outside the investigation. Fullscreen success did not imply support for either.
- The observed Video.js objects and CSS classes were implementation details of the website and could change.
- A programme without loaded text subtitles would need a different input mechanism; translation could not be assumed to work.

Later mock-response browser checks and persistence tests are summarized in the README. They do not establish real model translation quality.

## Evidence handling

Local investigation artifacts recorded player inspection, isolated-world access, seeks, fullscreen containment, playlist access, and sample overlays. Browser profiles, authentication state, and programme screenshots are not included in this repository.

## Technical references

- [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
- [Chrome cross-origin network requests](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests)
- [Chrome webRequest](https://developer.chrome.com/docs/extensions/reference/api/webRequest)
- [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide)

Website-specific findings above came from the inspected authenticated page, not assumptions about another player.
