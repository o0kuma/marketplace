# Phase 0: Screen & Flow List

## 1. First Screen (메인)
- Hero / 캐치프레이즈
- 인기 or 최신 상품 카드 (8~12개)
- 카테고리/상품목록 링크
- 로그인/회원가입 링크

## 2. Signup (회원가입)
- name, email, password, phone, address (optional), role (USER/SELLER)
- 약관 동의 (필수) 체크 → termsAgreedAt 전송
- 제출 후 로그인 처리 또는 로그인 페이지 이동

## 3. Login
- email, password
- 에러 메시지 표시

## 4. Product List
- 검색(keyword), 정렬(sortBy, direction), 페이징
- 카드: 이미지(있으면), 이름, 가격, 판매자

## 5. Product Detail
- 상품 정보, 이미지, 가격, 재고, 판매자
- 수량 선택, 장바구니 담기 or 바로 구매

## 6. Order Flow
- 배송지 입력: recipientName, recipientPhone, recipientAddress
- 주문 확인 (상품·금액·배송지)
- 주문하기 → 완료 페이지 or 주문 내역

## 7. My Orders
- 주문 목록 (페이징)
- 주문 상세 (상태, 배송지, 상품 목록)
- 취소 버튼 (ORDERED만)

## 8. Mypage
- 회원 정보 표시 (name, email, phone, address, role)
- 회원 정보 수정 (name, phone, address)

## 9. Seller
- 내 상품 목록, 상품 등록, 상품 수정/삭제
- 판매 주문 목록, 주문 상태 변경 (배송중/완료)
