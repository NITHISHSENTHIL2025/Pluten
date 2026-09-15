# Pluten V1 — System State Integration

This frontend now uses the locked Pluten motion pack as a real product-state system rather than as decorative animation.

## Locked motion mapping

| State | Asset | Use |
| --- | --- | --- |
| Loading | `/brand/motion/loading.svg` | Full route/app waits only |
| Offline | `/brand/motion/offline.svg` | Browser network unavailable |
| Error | `/brand/motion/error.svg` | A completed operation/page failure |
| Retry | `/brand/motion/retry.svg` | An explicit retry is currently running |
| Processing | `/brand/motion/processing.svg` | Server/payment verification in progress |
| Success | `/brand/motion/success.svg` | A server-confirmed operation completed |

Do not use the full-size brand motion for every small button action. Small saves, coupon checks, uploads and similar actions may keep compact inline indicators.

## Production pieces added

- `src/components/system/PlutenMotion.tsx` — one source of truth for the six motion files.
- `src/components/system/SystemStateShell.tsx` — shared Frost page structure for system states.
- `src/components/system/ErrorBoundaryView.tsx` — branded error/retry handling.
- `src/components/system/NetworkStatusGate.tsx` — live browser online/offline handling without discarding the current page.
- `src/components/system/ServiceWorkerRegistration.tsx` — production-only offline fallback registration.
- `public/sw.js` + `public/offline.html` — network-navigation fallback when the app cannot load at all.
- `/offline` — in-app offline state.
- `/maintenance` — planned maintenance state.
- `/service-unavailable` — internet works but Pluten cannot respond.
- `payment-success` — processing, pending, retry, error, failed-payment and success states in one secure flow.
- `SessionExpiryNotice` — redesigned as a clean modal/bottom sheet instead of the old floating notification.
- Route loading, global errors, 404, login fallback, library/profile loading and critical product unavailable states now use the brand system consistently.

## Payment behavior

`/payment-success?order_id=...` never grants access locally. The page waits for `/payments/verify` and only shows Success when the server confirms the order. Pending verification automatically rechecks the same order. A manual retry never creates a new order.

The included backend patch makes an already-failed order return `{ status: "FAILED", productId }` after Cashfree is checked and no successful payment exists. This allows the UI to offer `Try payment again` on the original product instead of pretending a terminal failure is still pending.

## Offline behavior

Two layers are used intentionally:

1. `NetworkStatusGate` handles a connection loss while React is already running. It keeps the current page in memory so portfolio/editor state is not thrown away.
2. The service worker handles a full navigation while offline and returns the static `offline.html` fallback. It does not cache normal Pluten pages, so it will not serve stale storefront/account pages.

## Session expiry

A 401 from normal authenticated API calls dispatches the existing `pluten:session-expired` event. The new session dialog stores the exact current path, query and hash and sends the user to:

`/login?expired=1&redirect=<original path>`

Pages that intentionally suppress the global 401 event (library/profile/product checkout) use the same redirect format themselves.

## Mobile target

System pages and overlays are designed for 320 / 350 / 375 / 390 / 430 px widths, use `100dvh`, respect safe-area insets where overlays touch the bottom edge, and avoid fixed desktop card widths.

## Final checks before merge

From `frontend`:

```powershell
npm ci
npm run typecheck
npm run lint
npm run build
```

Then manually verify:

1. Home → product → checkout → Cashfree → processing → success → library.
2. Failed Cashfree order → error → `Try payment again` → original product.
3. Payment pending → automatic checks → manual `Check this order again`.
4. Browser DevTools offline → branded offline overlay → reconnect without losing the current page.
5. Full page navigation while offline after one production visit → static offline fallback.
6. Force a page error → Error motion → Try again.
7. Expire auth cookie/session → new session dialog → sign in → original URL restored.
8. Check 320 / 350 / 375 / 390 / 430 px widths.

