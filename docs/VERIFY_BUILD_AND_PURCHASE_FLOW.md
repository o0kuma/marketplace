# Verify: build, bootRun, purchase flow

## 1. Backend — correct Gradle task

- **Correct**: `bootRun` (Spring Boot run task).
- **Common typo**: `booRun` → will fail (unknown task).

### Windows (PowerShell)

```powershell
cd market-back
.\gradlew.bat bootRun --args="--spring.profiles.active=dev"
```

### Unix

```bash
cd market-back
./gradlew bootRun --args='--spring.profiles.active=dev'
```

### Smoke check (API up)

- `GET http://localhost:8080/api/health` → e.g. `Backend server is running properly.` (public).

## 2. Frontend — production build

```bash
cd market-front
npm run build
```

Fix any TypeScript or route errors before release.

## 3. Manual purchase flow checklist

Run **backend (dev profile)** + **frontend** (`npm run dev`). Complete in order:

| Step | Action | Expected |
|------|--------|----------|
| 1 | Sign up / log in | Session or JWT stored; redirect works |
| 2 | Browse `/products`, open a product | Detail loads, price/stock shown |
| 3 | Add to cart | Cart count updates |
| 4 | `/cart` → proceed to checkout | Address/shipping valid |
| 5 | Place order | Order created (`ORDERED` or next state per app) |
| 6 | Pay (simulated PG if applicable) | Status → paid / `PAYMENT_COMPLETE` |
| 7 | `/orders` or order detail | Order visible to buyer |

**Regression**: Log out, log in as seller (if applicable) — seller order list matches shipped flow.

Document failures with URL, user role, and browser console + API response body.
