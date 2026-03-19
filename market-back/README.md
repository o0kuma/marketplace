# Market Backend

Spring Boot API (JPA, Security, PostgreSQL; optional H2 in-memory profile `h2`).

## 요구 사항

- JDK 17+
- (선택) PostgreSQL — 기본 프로파일 사용 시
- (선택) Gradle — Wrapper 사용 시 로컬 Gradle 불필요

## 실행 방법

> **Gradle 태스크 이름은 `bootRun`입니다.** (`booRun` 등은 오타로 실패합니다.)  
> Windows: `.\gradlew.bat bootRun ...`

### 1) PostgreSQL 사용 (권장, DBeaver와 동일 DB)

1. 저장소 루트에서 `docker compose up -d` 로 Postgres 기동 (또는 로컬 Postgres에 DB `market` 생성)
2. `application.yml`의 `spring.datasource` 확인 (기본: `localhost:5432`, 사용자 `kuma`)
3. `./gradlew bootRun` 또는 IDE에서 `MarketApplication` 실행 (프로파일 없음 = Postgres)

**`dev` 프로파일**은 이제 datasource를 바꾸지 않습니다. Postgres 그대로 쓰면서 로그만 조금 더 자세히 보려면:

- `./gradlew bootRun --args='--spring.profiles.active=dev'`

### 2) PostgreSQL 없이 (H2 메모리만)

- `./gradlew bootRun --args='--spring.profiles.active=h2'`

H2 콘솔: http://localhost:8080/h2-console  
(JDBC URL: `jdbc:h2:mem:market`, 사용자: `sa`, 비밀번호 없음)

## API

- `GET /api/health` — 헬스 체크
- `GET /api/papers/search?q=&page=&size=` — OpenAlex 논문 검색 (인증 불필요)
- `GET /api/papers/graph/{workId}` — 인용·피인용 그래프 (workId 예: `W2741805807`)

OpenAlex rate limit 완화를 위해 환경 변수 `OPENALEX_MAIL`에 연락용 이메일을 설정할 수 있습니다 (`application.yml`의 `app.openalex.contact-email`).

## Gradle Wrapper

처음 한 번만: 로컬에 Gradle이 있으면 프로젝트 루트에서 `gradle wrapper` 실행 후, 이후에는 `./gradlew`(Windows: `gradlew.bat`)로 빌드/실행하면 됩니다.
