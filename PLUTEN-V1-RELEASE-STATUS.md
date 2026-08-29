# PLUTEN — Company V1 Release Candidate

This archive is a clean source release candidate built from the tested working tree.

## Included hardening

- non-blocking upload temp-file cleanup
- safer Cloudinary cleanup validation
- session-expiry notice and authenticated heartbeat
- browser draft persistence in the portfolio editor
- deterministic India date formatting
- Orbit active-index safety and gesture handling
- public portfolio rendering outside fetch error handling
- portfolio preview data model supports certifications and achievements
- responsive/mobile baseline and reduced-motion support
- Pluten metadata/assets for Open Graph and Apple touch icon
- environment example without secrets
- cleaned generated source-dump artifacts from the release archive

## Deliberately excluded

- `.git`
- `node_modules`
- `.next`
- environment secret files
- generated aggregate source dumps

## Final local gates

Run from `frontend`:

    npm ci
    npx tsc --noEmit
    npm run lint
    npm run build

Run from `backend`:

    npm ci
    npx prisma generate
    npx prisma validate
    npx prisma migrate status
    npm audit

Do not run `prisma migrate reset` against production data.

The release should not be promoted to the production tag until the local runtime smoke test passes for authentication, portfolio editor/save/publish, public portfolio, mobile layouts, checkout/payment, library download, admin search, uploads, and Vercel deployment.
