# Netivaryeh library kiosk (static page)

Single-file static site: `index.html` + `config.js`. No build step.

- Search runs in the browser (all-MiniLM-L6-v2 q8, loaded from jsdelivr/Hugging Face on first visit, cached after).
- Catalog + vectors are read from the endpoint in `config.js` (default: the existing sheet-backed service, which allows cross-origin GET).
- The "Request a book" form posts to `requestEndpoint`.
- Owner admin client (hidden #admin route) is included. It is only a client: sign-in and every admin action are enforced server-side by the backend allowlist. The Claude prompt and catalog data are not in this repo.

Hosting: GitHub Pages (free plan requires a public repository). Nothing in this repo is secret; the catalog is already public.
Local preview: `python3 -m http.server` in this folder, open http://localhost:8000/.
