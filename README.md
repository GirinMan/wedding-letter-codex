# Wedding Letter Codex

콘텐츠·디자인·미디어를 런타임에 편집하는 한국 모바일 청첩장 플랫폼이다.
공개 청첩장과 비공개 관리자 화면이 하나의 API를 공유한다. 운영 환경은
PostgreSQL 호환 관계형 데이터베이스와 S3 호환 객체 스토리지를 사용한다.
예를 들어 Supabase와 Cloudflare R2 같은 관리형 서비스를 연결할 수 있다.

원본 서비스의 사적 데이터, 사진, 음악, 로고, 소스 코드는 포함하지
않는다. 관찰한 제품 구조와 인터랙션을 독립 구현했으며 커밋된 seed는
모두 일반 placeholder다.

## 포함된 기능

공개 청첩장:

- 히어로, 인사말, 양가별 가족 연락처, 인터뷰, 달력과 실시간 카운트다운
- 연애 연혁 캐러셀, RSVP, 장소·교통·외부 길찾기
- S3 호환 스토리지 갤러리, 방명록, 계좌 복사, 선택형 음악
- 예식 시각에 맞춘 방문객 사진 업로드와 Web Share fallback
- 스크롤 reveal, dialog, reduced motion, 키보드 접근성

관리자:

- 이름·문구·예식 일정·장소·양가 관계별 연락처 편집
- 인터뷰·연혁·디자인 토큰 편집과 실시간 공개 화면 미리보기
- MinIO 이미지/음악 업로드
- RSVP 조회·CSV 내보내기, 방명록 moderation, 방문객 사진 승인
- draft revision 저장과 원자적 publish
- Secure/HttpOnly/SameSite 세션

백엔드:

- Fastify + TypeScript REST API
- PostgreSQL migration과 JSONB content/design document
- S3-compatible private object storage
- scrypt password verifier와 hashed session token
- public write validation과 rate limit

## 구조

```text
apps/
  api/          API, domain schema, migration, seed, tests
  public-web/   React + Vite 모바일 청첩장
  admin-web/    React + Vite 관리자
deploy/
  docker/       API와 web image build
  nginx/        public/admin SPA와 API proxy
docs/
  architecture.md
  reference-audit.md
  concepts/wedding-platform-concept.png
docker-compose.yml
```

설계 근거는 [reference audit](docs/reference-audit.md), 런타임 구성은
[architecture](docs/architecture.md), 전체 화면 시안은
[concept board](docs/concepts/wedding-platform-concept.png)에 있다.

## 로컬 실행

Node.js 22와 Docker가 필요하다.

```bash
cp .env.example .env
# .env의 placeholder를 로컬 전용 값으로 교체
npm ci
npm run check
docker compose up -d --build
docker compose --profile tools run --rm seed
```

- 공개: <http://localhost:8080/our-wedding>
- 관리자: <http://localhost:8081>
- API: <http://localhost:3000/api/health/ready>
- 객체 스토리지 console: <http://localhost:9001>

seed는 같은 slug가 이미 있으면 초대장을 덮어쓰지 않는다. 관리자
identity는 `.env` 값으로 생성 또는 갱신한다.

## 디자인 교체

`InvitationDesign`은 PostgreSQL에서 관리하며 공개 앱이 semantic CSS
custom property로 변환한다. 색·글꼴·간격·radius·motion token을 바꿔도
콘텐츠 document와 인터랙션 코드는 유지된다. 미디어는 design token이
아니라 S3 호환 asset reference다.

## 검증

```bash
npm run check
docker compose config --quiet
curl -fsS http://localhost:8080/healthz
curl -fsS http://localhost:8081/healthz
curl -fsS http://localhost:3000/api/health/ready
```

브라우저 QA에서는 공개 페이지 로딩·연락 dialog·전체 섹션 DOM·콘솔
오류 없음, 관리자 로그인·실데이터 dashboard·좁은 desktop 반응형을
확인한다.

## 배포

이 저장소는 컨테이너 이미지와 환경 변수 기반의 배포 계약을 제공한다.
운영 데이터베이스와 객체 스토리지는 PostgreSQL·S3 호환 서비스를 선택해
연결할 수 있다. 실제 네트워크 경계, 호스트명, 레지스트리 및 배포 자동화
구성은 공개 저장소에 기록하지 않는다. 비공개 관리 화면은 애플리케이션
세션 인증과 별도의 사설 접근 경계로 보호해야 한다.

일반적인 배포 준비 항목은 [SETUP.md](SETUP.md)에 정리했다.

## 출처

초기 문제 정의와 workflow는
[revfactory/wedding-letter](https://github.com/revfactory/wedding-letter)에서
영감을 받았다. 구현은 Codex·DB 편집·독립 디자인 시스템에 맞게 새로
작성했다. [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
참조.

## License

MIT
