# Marketplace deployment & local ops

## Git

Initialize version control from the repo root:

```bash
git init
git add .
git commit -m "chore: initial import"
```

Add a remote (GitHub/GitLab) and push. Use branches for features; never commit real secrets.

## Environment

| Variable / file | Purpose |
|-----------------|--------|
| `market-back` `application.yml` | DB URL, JWT secret, `app.payment.webhook-secret`, `market.shipping.*` |
| `market-front` `BACKEND_URL` | Next.js rewrites target (default `http://localhost:8080`) |

Copy [market-back/application.example.yml](market-back/application.example.yml) to `application-local.yml` (gitignored) for machine-specific overrides.

## Database

```bash
docker compose up -d
```

Then start the API (`./gradlew bootRun` or IDE). H2 dev profile remains available via `-Dspring.profiles.active=dev`.

## Frontend

```bash
cd market-front
npm ci
npm run build
npm start
```

Set `BACKEND_URL` in production so `/api` and `/uploads` rewrite to the real API host.

## Payment (Toss Payments)

- **Real payments**: Set `TOSS_SECRET_KEY` and `TOSS_CLIENT_KEY` (backend `app.payment.toss.*`). Front uses client key from `GET /api/config/payment`. If unset, in-app 결제하기 uses stub (no PG).
- **Refund**: Buyer/admin refund calls Toss cancel API when the order was paid via Toss.
- **Webhook**: `POST /api/webhooks/payment/confirm` with header `X-Webhook-Secret` and JSON `{ "orderId", "amount", "pgTransactionId" }`.  
Set `app.payment.webhook-secret` in production; see application.example.yml for optional Toss and mail settings. Password reset: POST /api/auth/forgot-password, /api/auth/reset-password. Email: order/shipping emails when spring.mail configured. Return/exchange: POST/GET/PATCH /api/orders/{id}/return-requests. Tracking: seller enters on order detail (buyers use in-app “결제하기” for demo).

## Security notes

- Change `app.jwt.secret` and DB passwords before any public deploy.
- Login rate limit: 25 attempts / minute / IP on `POST /api/auth/login`.
