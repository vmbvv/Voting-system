# Voting-system

Quick start (backend):
- `npm install`
- Copy `.env.example` to `.env` and set `MONGODB_URI` + `JWT_SECRET`
- `npm run dev`

Quick start (frontend):
- `cd frontend`
- `npm install`
- Create `frontend/.env` with `VITE_GRAPHQL_URL=/graphql`
- `npm run dev`

Notes:
- In dev, Vite proxies `/graphql` to the backend so cookies work without CORS.
- Use the GraphQL Sandbox at `http://localhost:4000/graphql` for API testing.

Optional:
- Backend: `npm run typecheck`, `npm run build`, `npm start`
- Frontend: `npm run build`, `npm run preview`
