# Mid-term ops: monitoring, settlement/CS, seller alignment

Cross-reference: order/payment domain in `docs/00-domain-design.md`, API in `docs/01-api-spec.md`.

## 1. Monitoring

### Backend (Spring)

- **API errors**: `ApiExceptionHandler` logs handled failures (code + message). Watch for spikes in `BAD_REQUEST`, `FORBIDDEN`, `NOT_FOUND` on `/api/orders`, `/api/orders/*/pay`, `/api/orders/*/refund`.
- **Production**: ship logs to your stack (CloudWatch, ELK, Loki, etc.). Alert on 5xx rate and repeated payment failures.
- **Health**: expose `GET /api/health` (or actuator) for load balancer probes.

### Frontend (optional)

- Client error reporting: Sentry / LogRocket / similar — capture checkout and payment step failures.
- Track Core Web Vitals (LCP on home benefits from server-fetched shop block).

## 2. Settlement, refund, CS

| Topic | Action |
|-------|--------|
| **Settlement** | Document seller payout cycle (e.g. D+N after delivery confirm). Align admin reports with `Order` / `Payment` states. |
| **Refund** | Match UI copy (`/orders`, emails) with API rules: who can refund, which statuses allow `POST .../refund`. |
| **CS** | Single policy doc: return window (e.g. 7-day), who pays return shipping, dispute channel. Sync footer/marketing lines (`HomeShopBelow` “Easy returns”) with legal/terms. |

## 3. Seller flow consistency

Verify end-to-end:

- **Onboarding**: signup role `SELLER` → seller dashboard `/seller` loads.
- **Catalog**: `/seller/products/new` → list appears on `/products` and buyer cart.
- **Orders**: buyer order appears under `/seller/orders`; tracking update matches buyer order detail.
- **Q&A / reviews**: if enabled, seller `/seller/questions` and `/seller/reviews` match buyer-facing product pages.

When adding new seller screens, update `docs/02-screen-list.md` and API spec.

## 4. Quick audit script (manual)

1. Buyer: login → order → pay → refund (if allowed) — DB + notifications consistent.  
2. Seller: same order visible; status transitions match notifications.  
3. Admin: order list/admin order detail matches buyer-facing status labels.
