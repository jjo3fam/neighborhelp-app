# Repository guidance

NeighborHelp is a local community task exchange. Keep changes focused on the relevant workspace and follow the existing patterns.

## Structure

- `apps/api` is a NestJS API backed by PostgreSQL and TypeORM. Feature code is grouped into modules such as `posts`, `offers`, `matches`, and `messages`; keep controllers, services, entities, and DTOs within their feature directories.
- `apps/mobile` is a React Native app using Expo. Shared HTTP calls currently live in `src/api.ts`, with screens under `src/screens/`.
- `docs/architecture.md` describes product goals and milestones. `docs/safety-policy.md` is authoritative for location disclosure behavior.

## Development and verification

- Install dependencies with `npm install` from the repository root.
- Start PostgreSQL with `docker compose up -d`.
- Start the API with `npm run start:dev --workspace apps/api` and the mobile app with `npm run start --workspace apps/mobile`.
- Run the API build with `npm run build --workspace apps/api` and API lint with `npm run lint --workspace apps/api`.
- The root `npm run lint` runs both workspace lint scripts, but the mobile workspace currently has no lint script. Do not claim mobile lint coverage unless that changes.

## Product and safety invariants

- Public task listings must expose approximate location only. Never expose an exact address while browsing or before a valid match is accepted.
- Reveal exact location only to the parties in the accepted match. Keep authorization checks in the backend; hiding a value only in the mobile UI is not sufficient.
- Offers, match acceptance, and messaging are part of the in-app trust flow. Preserve the authenticated user and accepted-match boundaries when changing these paths.
- Do not log or commit secrets, credentials, or real personal location data. Use `.env.example` for environment variable names and safe development defaults.