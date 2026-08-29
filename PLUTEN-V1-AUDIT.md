# Pluten Production V1 — Final Source Audit

## Release posture

This package is the current hardened source baseline. It is designed to be copied over the existing repository after a backup and environment restoration.

## Completed fixes

- Removed accidental empty duplicate `src/app/portfolio/edit/[id]` files from the repository root.
- Removed repository-generated aggregate source dumps and the accidental shell-history-named file from the runtime release package.
- Replaced synchronous upload temp-file deletion with asynchronous `fs.promises.unlink` cleanup.
- Added upload rollback cleanup on multipart parsing errors.
- Hardened Cloudinary deletion to accept only HTTPS Cloudinary resource URLs for the configured cloud.
- Added deterministic India timezone formatting for admin date display.
- Added long-content safety rules to Orbit and a responsive global baseline.
- Added editor local draft persistence and restoration so session expiry, refresh, browser restart, and network failures do not silently destroy work.
- Added a sliding authenticated session refresh endpoint and a frontend heartbeat that refreshes active sessions before normal expiry.
- Added payment checkout race handling for the existing database-unique `clientRequestId` constraint.
- Fixed a serious product-upload integrity bug: once a product database mutation succeeds, later audit/cleanup failures no longer delete the assets that the database now references.
- Added `backend/.env.example` with safe placeholders only.
- Added missing `og.png` and `apple-touch-icon.png` assets referenced by root metadata.
- Added final static audit checks for blocking filesystem operations in upload middleware and accidental duplicate root source files.

## Verification completed in this environment

- Backend JavaScript syntax check: 33 files, 0 failures.
- Frontend TypeScript/TSX parse/transpile check: 47 files, 0 diagnostics.
- Pluten final static audit script: PASSED.
- CSS-module bare-selector audit: 0 candidates.
- Secret-pattern scan of release source: 0 hits.
- Mojibake scan of live source: clean.
- Generated artifacts and dependency directories excluded from final archive.

## Environment limitation

A full `npm ci` could not complete in the isolated build environment because the package download operation timed out. Therefore a fresh dependency-backed `next build`, ESLint execution, live browser run, Vercel deployment, Cashfree transaction, PostgreSQL concurrency run, S3 upload, and Cloudinary upload were not falsely marked as passed here.

## Required release gate on the developer machine

Frontend:

- `npm ci`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

Backend:

- `npm ci`
- `npx prisma generate`
- `npx prisma validate`
- `npx prisma migrate status`
- `node --check` all runtime controllers/services/middleware

Live regression:

- authentication and session refresh
- editor draft recovery and save failure recovery
- portfolio publish/unpublish
- Editorial and Orbit rendering
- long portfolio content
- mobile 320/375/390/430 px
- iOS Safari and Android Chrome
- admin search cancellation/stale-result behavior
- product upload and asset replacement
- duplicate checkout submission
- Cashfree success/pending/failure/webhook paths
- library authorization and secure downloads
