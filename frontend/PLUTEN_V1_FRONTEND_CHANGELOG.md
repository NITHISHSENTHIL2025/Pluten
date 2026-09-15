# Pluten V1 Frontend — Frost Refined Pass

## Locked identity
- Frost background: `#F4F6F5`
- Raised/high surface: `#FCFDFC`
- Recessed/low surface: `#E8EBE9`
- Primary black: `#101313`
- Secondary text: `#5B6060`
- Space Grotesk: brand + headings
- Inter: body + UI
- Radius family: 10 / 14 / 18 / 24 / 30 px

## Refined pass after browser review
- Removed the large nested portfolio mockup from the homepage hero.
- Replaced it with a clean textual capability rail with no enclosing card.
- Changed the public navigation from a floating rounded shell to a full-width integrated site header.
- Removed bright exterior/negative white neumorphic shadows that visually read as glow.
- New depth uses directional dark shadows plus a subtle inset surface highlight.
- Removed decorative glow/halo behavior and active blur effects.
- Reduced nested card-inside-card presentation on homepage products, library assets, profile actions, portfolio dashboard previews and several controls.
- Product/library media now sits flush with the parent card rather than inside another recessed frame.
- Simplified the homepage business section into aligned columns with separators instead of three raised boxes.
- Final homepage CTA is now a full-width dark section rather than another floating rounded card.
- Portfolio showcase uses one clean video surface with simplified controls; no glass/blur control treatment.
- Portfolio service landing uses medium typography and removes the large fake browser mockup from its hero.
- Reduced oversized heading ranges across the refined public-facing sections.
- Simplified admin control depth so nested selectors and active states do not stack multiple neumorphic boxes.

## Logic intentionally preserved
- Next.js route structure
- API client behavior
- Authentication and Google login logic
- Cashfree checkout flow
- Product fetching and pricing logic
- Library/download logic
- Portfolio CRUD/publish logic
- Admin data and permissions logic
- Sitemap/robots/API route behavior
- Analytics/auth heartbeat/session expiry behavior

## Validation performed in the handoff environment
- 66 TS/TSX files parsed with TypeScript parser: 0 syntax errors
- CSS-module class references checked: 0 missing references
- CSS brace structure checked: 0 structural issues
- Decorative glow scan: 0 active CSS blur/text-glow/exterior-white-shadow matches in the refined source

A full dependency-aware `next build` should still be run on the target machine after copying the files. The prior version of this same codebase successfully passed `npm ci`, `typecheck`, `lint` (warnings only), and `next build` on the user's machine before this styling-only refinement pass.
