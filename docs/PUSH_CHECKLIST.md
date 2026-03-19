# GitHub 푸시 전 점검 목록

개인 GitHub에 올리기 전에 한 번씩 확인하세요.

---

## 1. 절대 올리면 안 되는 파일

아래는 **이미 .gitignore에 포함**되어 있으므로, 커밋되지 않아야 합니다.

| 대상 | 설명 |
|------|------|
| `.env`, `.env.local`, `.env.production` | API URL, 키 등 (프론트/백엔드) |
| `**/application-local.yml` | 백엔드 로컬 전용 설정·비밀값 |
| `**/application-secret.yml` | 백엔드 시크릿 전용 |
| `node_modules/`, `**/build/`, `**/.gradle/`, `**/.next/` | 의존성·빌드 결과물 |
| `uploads/` | 업로드 파일 |
| `.claude/` | Cursor/Claude 프로젝트 메타 (선택 제외) |

---

## 2. 저장소에 들어가는 설정 파일 정리 상태

- **application.yml**  
  - JWT·DB·초기 관리자 비밀번호는 환경 변수 또는 플레이스홀더 기본값 사용.  
  - Toss 실제 시크릿 키는 환경 변수로만 주입 (`application-local.yml` 또는 env 권장).

- **docker-compose.yml**  
  - 로컬 기본 DB 비밀번호는 `1234`(개발용); 운영은 `POSTGRES_PASSWORD` 등 env로 덮어쓰기.

- **application.example.yml**  
  - 비밀/시크릿은 플레이스홀더만 있으므로 그대로 커밋해도 됨.  
  - 복사 후 `application-local.yml`에 실제 값을 넣어 사용.

---

## 3. 푸시 직전 체크리스트

```
[ ] application.yml에 실제 운영/공유용 비밀번호·시크릿이 하드코딩되어 있지 않음
[ ] Toss 실제 시크릿 키를 쓴 적 있으면 application.yml 기본값에서 제거했음
[ ] initial-admin / DB 비밀번호가 "실제로 쓰는 값"이면 env로만 사용하도록 했음
[ ] .env, .env.*, application-local.yml, application-secret.yml 이 .gitignore에 있음
[ ] .claude/ 를 .gitignore에 추가했음 (원하면)
[ ] git status 로 위 파일들이 추적 대상에 없는지 확인
```

---

## 4. 로컬에서만 쓸 때 (비밀값 넣는 방법)

- **백엔드**  
  - `application.example.yml`을 복사해 `application-local.yml` 생성 후 실제 비밀/키 입력.  
  - `application-local.yml`은 git에 올리지 않음 (이미 .gitignore 대상).

- **프론트**  
  - `.env.example`을 참고해 `.env.local` 등에 API URL·키 입력.  
  - `.env*`는 .gitignore 대상이므로 커밋되지 않음.

---

## 5. 로컬 개발 시 (비밀값이 필요한 경우)

저장소에는 기본값만 들어 있으므로, 로컬에서 실제 DB/관리자/Toss 키를 쓰려면:

- **백엔드:** `application.example.yml`을 복사해 `application-local.yml`을 만들고, 그 안에 `spring.datasource.password`, `app.jwt.secret`, `market.admin.password`, Toss `secret-key`/`client-key` 등을 넣어 사용. (`application-local.yml`은 git 제외)
- **Docker:** `POSTGRES_PASSWORD=원하는비밀번호` 등을 터미널에서 지정하거나, 프로젝트 루트에 `.env` 파일을 만들어 `POSTGRES_PASSWORD=...` 등 설정. (`.env`는 git 제외)
- 저장소 기본값이 `application.yml`의 `DB_PASSWORD`(기본 `1234`)와 `docker-compose`의 `POSTGRES_PASSWORD`(기본 `1234`)로 맞춰져 있음. 다른 비밀번호를 쓰려면 env로 `DB_PASSWORD` / `POSTGRES_PASSWORD` 설정.

## 6. 한 줄 요약

**올리지 말 것:** `.env`류, `application-local/secret`류, `.claude/`(선택), 그리고 **실제 비밀/시크릿이 적힌 설정 파일**.  
**올리기 전 할 일:** 위 체크리스트를 보고, 민감한 값은 전부 env 또는 로컬 전용 파일로 빼두었는지 확인.
