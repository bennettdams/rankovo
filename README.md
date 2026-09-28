# Rankovo

...

## Local development

Install [Bun](https://bun.sh) `^1.4.0`, matching the `@types/bun` range. `bun run test` needs that runtime.

```sh
bun --version
```

Create the database:

```sh
docker compose up -d
```

Delete the database:

```sh
docker compose down -v
```

## Testing

Prerequisites and order for the full-stack E2E tests:

1. Install Bun `^1.4.0` and Playwright Chromium:

   ```sh
   bunx playwright install chromium
   ```

2. Start local PostgreSQL and use this exact database URL:

   ```sh
   docker compose up -d
   # DATABASE_URL=postgresql://ben:password@localhost:5432/rankovo-dev
   ```

3. For a fresh database, apply the schema once:

   ```sh
   bun run db:push
   ```

4. Set `ALLOW_DEV_LOGIN=true` in `.env.local`, prepare the database, and run E2E tests:

   ```sh
   bun run test:e2e:prepare
   bun run test:e2e
   ```

`bun run test:e2e:prepare` seeds the database and creates the development login accounts. `bun run test:e2e` starts Next dev on port 3001 and runs Playwright Chromium tests; it does not seed the database by itself. Your normal `bun run dev` server can continue using port 3000.

```sh
bun run test         # Bun unit tests
bun run test:e2e     # Playwright end-to-end tests (prepare the database first)
bun run test:all     # Run unit and end-to-end tests (prepare the database first)
```

`bun run test:e2e:prepare` deletes and recreates the local seed data, then
creates the development login accounts. Use it only with the disposable test
database shown above. `bun run test:all` does not prepare or reset the database.

## TODOs

- Transform search param keys with kebab-case & CamelCase
