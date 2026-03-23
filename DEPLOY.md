# Marketplace deployment & local ops

## Repository layout

- **`market-back`** — Spring Boot API (port `8080` by default)
- **`market-front`** — Next.js app (`output: "standalone"` for container-friendly production builds)
- **`docker-compose.yml`** — local PostgreSQL (repo root)

Use feature branches; never commit real secrets. Override secrets via environment variables or `application-local.yml` (see below).

## Environment overview

| Area | Source |
|------|--------|
| API defaults & structure | `market-back/src/main/resources/application.yml` |
| Production overrides | `market-back/src/main/resources/application-prod.yml` (activate with `spring.profiles.active=prod`) |
| Local-only YAML (gitignored) | Copy [market-back/application.example.yml](market-back/application.example.yml) → `market-back/src/main/resources/application-local.yml` — SMTP / `front-url` starter; other keys follow `application.yml` |
| Frontend proxy | `market-front` **`BACKEND_URL`** — rewrites `/api/*` and `/uploads/*` to the API (default `http://localhost:8080`). See [Frontend](#frontend). |

## Backend environment variables

### Database (default profile)

| Variable | Purpose |
|----------|---------|
| `DB_USERNAME` | Postgres user (default in YAML: `kuma`) |
| `DB_PASSWORD` | Postgres password (default in YAML: `1234`; **change for non-local**) |

Default JDBC URL in `application.yml` is `jdbc:postgresql://localhost:5432/market`.

### Docker Compose Postgres

[docker-compose.yml](docker-compose.yml) reads:

| Variable | Purpose |
|----------|---------|
| `POSTGRES_USER` | DB user (default `kuma`) |
| `POSTGRES_PASSWORD` | DB password (default `1234`) |
| `POSTGRES_DB` | Database name (default `market`) |

Align these with `DB_USERNAME` / `DB_PASSWORD` / DB name the API uses.

### Production profile (`prod`)

Required / important when using `--spring.profiles.active=prod`:

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | JWT signing secret (**required** in prod YAML) |
| `DB_URL` | JDBC URL (default `jdbc:postgresql://localhost:5432/market` if unset) |
| `DB_USERNAME` | DB user (**required**) |
| `DB_PASSWORD` | DB password (**required**) |
| `APP_UPLOAD_DIR` | File upload directory (default `/app/uploads`) |
| `JWT_EXPIRATION_MS` | Optional; default `86400000` |

### JWT (local default profile)

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Overrides `app.jwt.secret` (YAML default is a dev placeholder — **replace before any public deploy**) |

### Transactional email

| Variable | Purpose |
|----------|---------|
| `MAIL_HOST` | SMTP host; if empty, **no mail is sent** (password-reset API still returns success to reduce email enumeration) |
| `MAIL_PORT` | Usually `587` (STARTTLS) or `465` |
| `MAIL_USERNAME` | SMTP user |
| `MAIL_PASSWORD` | SMTP password or API key |
| `MAIL_FROM` | `From` address (`app.mail.from`) |
| `FRONT_URL` | Public storefront URL for email links (`app.front-url`, e.g. `https://shop.example.com`) |

### Payment (Toss)

| Variable | Purpose |
|----------|---------|
| `TOSS_SECRET_KEY` | Toss secret key (`app.payment.toss.secret-key`). **Frontend treats Toss as enabled when this value is non-blank** (`GET /api/config/payment`). |
| `TOSS_CLIENT_KEY` | Toss client key exposed to the browser via that endpoint |

**Stub / no PG:** The default `application.yml` ships with **Toss test key placeholders**, so locally the app often behaves as “Toss enabled” unless you override `TOSS_SECRET_KEY` to empty or use a dedicated profile. For a true stub, use an empty secret key (and ensure `isConfigured()` is false).

| Config property | Purpose |
|-----------------|--------|
| `app.payment.webhook-secret` | Shared secret for header `X-Webhook-Secret` on the payment webhook; empty = webhook rejects requests |
| `app.payment.toss.allow-duplicate-order-id-bypass` | `true` in default/dev YAML for local retries; **`false` in `application-prod.yml`** |

### OpenAlex (paper search API)

| Variable | Purpose |
|----------|---------|
| `OPENALEX_MAIL` | Contact email for OpenAlex polite pool / rate limits (`app.openalex.contact-email`) |

Endpoints (no auth): `GET /api/papers/search`, `GET /api/papers/graph/{workId}`.

### Initial admin bootstrap

When no `ADMIN` user exists, the API can create one (see `InitialAdminRunner`):

| Variable | Purpose |
|----------|---------|
| `INITIAL_ADMIN_EMAIL` | Default `admin@example.com` in YAML |
| `INITIAL_ADMIN_PASSWORD` | Default `changeme` in YAML — **set in production** |

## Database

Start Postgres:

```bash
docker compose up -d
```

Run the API from `market-back`:

```bash
./gradlew bootRun
# Windows: .\gradlew.bat bootRun
```

**Profiles:**

- **Default or `dev`** — Uses PostgreSQL from `application.yml`. The `dev` profile does **not** switch the database; it mainly adjusts logging (and Toss duplicate-order bypass).  
  Example: `./gradlew bootRun --args='--spring.profiles.active=dev'`
- **`h2`** — In-memory H2 only (no Docker Postgres):  
  `./gradlew bootRun --args='--spring.profiles.active=h2'`  
  H2 console is enabled per `application-h2.yml`.

**Production:**

```bash
./gradlew bootRun --args='--spring.profiles.active=prod'
```

Ensure `DB_*`, `JWT_SECRET`, and other prod env vars are set.

## Frontend

```bash
cd market-front
npm ci
npm run dev          # local development
npm run build
npm start            # production mode after build
```

- Set **`BACKEND_URL`** in production so `/api` and `/uploads` rewrites in `next.config.ts` target the real API host.
- Builds use **`output: "standalone"`** — suitable for Docker/Kubernetes images that run `node server.js` from `.next/standalone`.

## Transactional email (detail)

Password reset: `POST /api/auth/forgot-password` → link to `/reset-password?token=…` → `POST /api/auth/reset-password`. Order/shipping notifications also use Spring Mail when configured.

### Local / staging

- Use [Mailtrap](https://mailtrap.io), [Mailpit](https://github.com/axllent/mailpit), or your provider’s SMTP sandbox.
- After SMTP is set, test **Forgot password** on the login page end-to-end.

### SPF / DKIM

For production deliverability, configure **SPF** and **DKIM** for the domain used in `MAIL_FROM`.

## Payment (Toss) — behavior

- **Client flow:** Browser loads Toss SDK when `GET /api/config/payment` returns `useToss: true` and a non-null `clientKey`. After success, the app calls `POST /api/orders/{id}/pay/confirm` with `paymentKey`, `orderId`, `amount`.
- **Stub:** When Toss is not configured (`secret-key` blank), buyers can use `POST /api/orders/{id}/pay` for demo completion (see API implementation).
- **Refund:** Buyer/admin/seller flows call Toss cancel when the order was paid via Toss.
- **Webhook:** `POST /api/webhooks/payment/confirm` with header `X-Webhook-Secret` and JSON body `{ "orderId", "amount", "pgTransactionId" }`. Set `app.payment.webhook-secret` in production.

### Related order APIs (reference)

- Returns/exchanges: `POST` / `GET` / `PATCH` `/api/orders/{id}/return-requests`
- Tracking: seller can set tracking on order detail; buyers see status in-app.

## Security notes

- Replace **`JWT_SECRET`** and **DB passwords** before any public deploy; restrict **`INITIAL_ADMIN_*`** defaults.
- **Login rate limit:** 25 attempts per minute per IP on `POST /api/auth/login` (`LoginRateLimitFilter`).
- Keep **`app.payment.webhook-secret`** secret and non-empty in production if you use the payment webhook.
