# Minor Risks

- **Authentication** — JWT presence is checked client-side without validating expiry; the next API request clears an expired token.
- **Portrait** — `public/about-me/armin.png` is intentionally optional; the page displays a placeholder when absent.
- **Polling** — A slow grid request can overlap the next 30-second refresh because requests are not aborted.
