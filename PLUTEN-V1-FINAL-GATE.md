# PLUTEN — V1 FINAL RELEASE GATE

This archive is the company V1 candidate assembled from the current Pluten source snapshot.

## Included hardening
- non-blocking upload temp-file cleanup
- session-expiry event contract + recovery notice
- API error helpers for unknown errors
- editor 401 handling without unsafe catch typing
- public portfolio fetch/render error separation
- Orbit template + 9:16 preview
- long-content and responsive hardening retained
- generated/source-dump clutter excluded
- no `.git`, `node_modules`, `.next`, or environment secret files

## Static verification performed in packaging environment
- backend JavaScript syntax check: passed
- synchronous filesystem API scan in backend runtime: passed
- mojibake scan: passed
- archive secret/artifact scan: passed

## External verification required before production promotion
The packaging environment cannot perform the project's full dependency-backed browser/Vercel/Cashfree/S3 runtime verification. On the real workstation, run:

frontend:
- npm ci
- npx tsc --noEmit
- npm run lint
- npm run build

backend:
- npm ci
- npx prisma generate
- npx prisma validate
- npx prisma migrate status

Then perform the live smoke/regression test before moving a production tag.
