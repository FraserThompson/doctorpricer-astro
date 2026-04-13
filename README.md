# DoctorPricer Astro

Back from the dead and rewritten to be vastly simpler and less unpleasant to maintain.

## Doing things

**start a frontend dev server** `npm run dev`
**start a backend dev server** `npm run dev-backend`
**deploy practices db to local dev env** `npm run deploy-db-dev`

**deploy latest app changes** `npm run build-deploy`
**deploy practices db** `npm run deploy-db`

## Architecture

### Frontend

Pure Astro encapsulated web components and Tailwind.

### Backend

A JSON file from Cloudflare's KV store pulled into a JavaScript worker on the edge and processed for the frontend.

Endpoints are in `./backend/endpoints` and the `router.ts` handles routing requests to them.

### Scrapers

Secret for now.
