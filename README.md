# Askew Test Project

Basic multi-service Node.js project with MongoDB and a Vite + React gateway UI.

## Services

- `gateway-service` (`:3000`): web UI for users/projects management
- `users-service` (`:3001`): create/list users in MongoDB
- `projects-service` (`:3002`): create/list projects in MongoDB
- `mongo` (`:27017`): MongoDB database

## Run

```bash
docker compose up --build
```

Or via npm script:

```bash
npm run up
```

Then open:

```text
http://localhost:3000
```

## Stop

```bash
docker compose down
```

If you want to remove DB data too:

```bash
docker compose down -v
```

## Notes

- The gateway web app calls `/api/users/*` and `/api/projects/*`.
- Vite proxies those routes to `users-service` and `projects-service`.
