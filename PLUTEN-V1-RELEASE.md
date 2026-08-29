# PLUTEN Production V1

This package is the hardened V1 baseline for the Pluten storefront and portfolio platform.

## Release gates

- Backend JavaScript syntax checked.
- Frontend TS/TSX syntax transpilation checked.
- Prisma schema/migrations preserved.
- Runtime secrets are excluded.
- Generated build and dependency directories are excluded.
- Blocking synchronous temporary-file deletion removed from upload cleanup.
- CORS supports `CORS_ORIGINS` with safe Pluten production defaults.
- Deterministic India date formatting is used in customer-facing admin tables.
- Global responsive overflow/safe-area/reduced-motion baseline is included.
- Orbit includes long-content safety rules.

## Required live checks before production

Run the repository's normal dependency install and then: `npm run lint`, `npx tsc --noEmit`, `npm run build` in `frontend`; `npx prisma validate`, `npx prisma migrate status` and backend checks in `backend`.

Test authentication expiry, editor recovery, checkout, webhook duplication, uploads, mobile Safari/Chrome, 320/375/390/430 px layouts, and published/private portfolio transitions in the live environment.
