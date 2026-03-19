# Phase 3: 확장 목록 및 현재 상태

## 구현 완료된 기능
- **리뷰**: 목록, 작성(POST, 주문 완료 건만), 수정(PATCH), 삭제(DELETE), 리뷰 가능 주문 항목 조회
- **장바구니**: Cart/CartItem, 담기·수량 변경·삭제, 주문하기(체크아웃 연동)
- **이미지 업로드**: POST /api/upload (multipart), 로컬 저장, 상품 등록/수정 폼 연동
- **카테고리**: Category 엔티티, GET /api/categories, Product–Category 연결, 목록 필터·등록/수정 시 선택
- **결제 스켈레톤**: POST /api/orders/{id}/pay, POST /api/orders/{id}/refund (실제 PG 미연동)
- **관리자**: ADMIN 역할, GET /api/admin/stats, /admin 페이지
- **알림**: 주문 상태 변경 시 구매자에게 Notification 생성, 목록·읽음 처리
- **문의(Q&A)**: 상품별 문의 목록·등록 API, 상품 상세 문의 목록·폼
- **검색/필터**: 키워드, 상태, 카테고리, 최소/최대 가격, 정렬·페이지 크기
- **테스트**: AuthControllerTest, MemberControllerTest, ProductControllerTest, OrderControllerTest, ReviewControllerTest

## 추후 확장 권장
1. **실제 PG 결제 연동** (토스/이니시스 등) 및 결제·환불 플로우
2. **클라우드 이미지 스토리지** (S3, NCP Object Storage 등)
3. **문의 답변** (판매자 답글)
4. **관리자 전용 API** (회원/상품/주문 관리)
5. **헬스 상세·모니터링** (Actuator, 메트릭)
