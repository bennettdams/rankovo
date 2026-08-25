# Rankovo

...

## Local development

Install [Bun](https://bun.sh) `^1.4.0` — the same range as `@types/bun` / `engines.bun` in `package.json`. `bun run test` needs that runtime.

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

## TODOs

- Transform search param keys with kebab-case & CamelCase
