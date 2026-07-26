# Wedding Letter Codex

PostgreSQL과 MinIO를 기반으로 콘텐츠·디자인·미디어를 런타임에 편집하는
한국 모바일 청첩장 플랫폼이다. 공개 청첩장과 Tailscale 전용 관리자
화면이 하나의 API를 공유한다.

원본 서비스의 사적 데이터, 사진, 음악, 로고, 소스 코드는 포함하지
않는다. 관찰한 제품 구조와 인터랙션을 독립 구현했으며 커밋된 seed는
모두 일반 placeholder다.

## 포함된 기능

공개 청첩장:

- 히어로, 인사말, 양가별 가족 연락처, 인터뷰, 달력과 실시간 카운트다운
- 연애 연혁 캐러셀, RSVP, 장소·교통·외부 길찾기
- MinIO 갤러리, 방명록, 계좌 복사, 선택형 음악
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
- MinIO S3-compatible private object storage
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
docker-compose.iac.yml
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
- MinIO console: <http://localhost:9001>

seed는 같은 slug가 이미 있으면 초대장을 덮어쓰지 않는다. 관리자
identity는 `.env` 값으로 생성 또는 갱신한다.

## 디자인 교체

`InvitationDesign`은 PostgreSQL에서 관리하며 공개 앱이 semantic CSS
custom property로 변환한다. 색·글꼴·간격·radius·motion token을 바꿔도
콘텐츠 document와 인터랙션 코드는 유지된다. 미디어는 design token이
아니라 MinIO asset reference다.

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

GitHub Actions는 API/public/admin 이미지를 같은 Git SHA tag로 Harbor에
push한 다음 private `GirinMan/serengeti-iac`에 한 번만 dispatch한다.

- 공개 NPM target: `wedding-invitation:80`
- 관리자 NPM target: `wedding-admin:80`
- 내부 API: `wedding-api:3000`
- production data: Serengeti `postgres:5432`, `minio:9000`

관리자 hostname `wedding-admin.giraffe.ai.kr`은 Tailscale IP로만
resolve하고 Cloudflare Tunnel published route에는 추가하지 않는다.
구체적인 secret과 bootstrap은 [SETUP.md](SETUP.md)에 정리했다.

## 출처

초기 문제 정의와 workflow는
[revfactory/wedding-letter](https://github.com/revfactory/wedding-letter)에서
영감을 받았다. 구현은 Codex·DB 편집·독립 디자인 시스템·Serengeti
운영 모델에 맞게 새로 작성했다. [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
참조.

## License

MIT
