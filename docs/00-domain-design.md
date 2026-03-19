# Phase 0: Domain Design

## 1. Member (회원)

| Field | Type | Required | Note |
|-------|------|----------|------|
| id | Long | - | PK |
| name | String | O | max 100 |
| email | String | O | unique, max 255 |
| password | String | O | encoded, min 8 |
| phone | String | X | max 20 |
| address | String | X | max 500 |
| role | Enum | O | USER, SELLER (default USER) |
| termsAgreedAt | LocalDateTime | O | 가입 시 필수 약관 동의 시각 |
| createdAt, updatedAt | LocalDateTime | - | BaseTimeEntity |

- 가입: name, email, password, phone, address(선택), role, termsAgreedAt
- 수정 가능: name, phone, address, password(별도 API)

## 2. Product (상품)

| Field | Type | Required | Note |
|-------|------|----------|------|
| id | Long | - | PK |
| name | String | O | max 200 |
| description | String | X | TEXT |
| imageUrl | String | X | max 512 |
| price | Integer | O | >= 0 |
| stockQuantity | Integer | O | >= 0 |
| status | Enum | O | ON_SALE, SOLD_OUT, DELETED |
| seller | Member | O | FK |
| createdAt, updatedAt | - | - | BaseTimeEntity |

- 수정/삭제: 본인(판매자)만 가능

## 3. Order (주문)

| Field | Type | Required | Note |
|-------|------|----------|------|
| id | Long | - | PK |
| buyer | Member | O | FK |
| status | Enum | O | ORDERED, PAYMENT_COMPLETE, SHIPPING, COMPLETE, CANCELLED |
| totalAmount | Integer | O | |
| recipientName | String | O | max 100 |
| recipientPhone | String | O | max 20 |
| recipientAddress | String | O | max 500 |
| items | List<OrderItem> | O | cascade |
| createdAt, updatedAt | - | - | BaseTimeEntity |

- 상태 변경: 구매자 → CANCELLED(ORDERED만), 판매자 → PAYMENT_COMPLETE/SHIPPING/COMPLETE

## 4. OrderItem

| Field | Type | Required |
|-------|------|----------|
| id | Long | - |
| order | Order | O |
| product | Product | O |
| quantity | Integer | O |
| orderPrice | Integer | O |

## 5. Review (Phase 3 확장)

| Field | Type | Required |
|-------|------|----------|
| id | Long | - |
| product | Product | O |
| author | Member | O |
| orderItem | OrderItem | O |
| rating | Integer | O | 1~5 |
| content | String | X |
| createdAt | - | BaseTimeEntity |
