# NeighborHelp

NeighborHelp is a local-first community marketplace for everyday tasks, built around privacy-first location handling and trust between local neighbors.

## Stack

- Backend: NestJS + TypeORM + PostgreSQL
- Mobile: React Native + Expo
- Database: PostgreSQL via Docker

## Local development

1. Install dependencies:
   npm install
2. Start PostgreSQL:
   docker compose up -d
3. Start the API:
   npm run start:dev --workspace apps/api
4. Start the mobile app:
   npm run start --workspace apps/mobile

## Safety-first design

- Exact address stays private until a match is accepted.
- Public task listings use approximate location only.
- Trust-building features include reviews, reports, and matching safeguards.
