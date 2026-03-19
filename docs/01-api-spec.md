# Phase 0: API Spec Summary

## Common

- **Auth**: `Authorization: Bearer <JWT>`
- **Error body**: `{ "code": "ERROR_CODE", "message": "human message", "errors": "field: msg, ..." }`
- **404**: resource not found, **403**: forbidden (not owner/role)

---

## Auth

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | /api/auth/login | - | { email, password } | { token, member } |
| GET | /api/auth/me | O | - | MemberResponse |

## Members

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | /api/members | - | MemberSignupRequest | MemberResponse 201 |
| GET | /api/members/me | O | - | MemberResponse |
| PATCH | /api/members/me | O | MemberUpdateRequest | MemberResponse |

**MemberSignupRequest**: name, email, password, phone?, address?, role?, termsAgreedAt (ISO datetime)
**MemberUpdateRequest**: name?, phone?, address?
**MemberResponse**: id, name, email, phone, address, role (no password)

## Products

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | /api/products | - | PageResponse<ProductResponse> (keyword?, page, size, sortBy, direction) |
| GET | /api/products/{id} | - | ProductResponse |
| POST | /api/products | O (seller) | ProductResponse 201 |
| PUT | /api/products/{id} | O (owner) | ProductResponse |
| DELETE | /api/products/{id} | O (owner) | 204 |

## Orders

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | /api/orders | O | OrderRequest (items, recipientName, recipientPhone, recipientAddress) | OrderResponse 201 |
| GET | /api/orders | O | page, size | PageResponse<OrderResponse> |
| GET | /api/orders/{id} | O (buyer) | - | OrderResponse |
| PATCH | /api/orders/{id}/status | O | { status } | OrderResponse |

## Seller

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | /api/seller/products | O SELLER | PageResponse<ProductResponse> |
| GET | /api/seller/orders | O SELLER | PageResponse<OrderResponse> (내 상품 주문만) |

## Health

| Method | Path | Response |
|--------|------|----------|
| GET | /api/health | "Backend server is running properly." |
