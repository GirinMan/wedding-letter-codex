# Setup and deployment

이 저장소는 public이다. 실제 이름, 연락처, 계좌정보, 사진, 음악,
데이터베이스 비밀번호, MinIO key, 토큰을 commit하지 않는다.

## GitHub Actions

Repository Settings → Secrets and variables → Actions에 설정한다.

Secrets:

| 이름 | 용도 |
|---|---|
| `HARBOR_ROBOT_USER` | Harbor `girinman` project push robot |
| `HARBOR_ROBOT_TOKEN` | robot token |
| `IAC_DISPATCH_TOKEN` | private `GirinMan/serengeti-iac` repository dispatch용 fine-grained PAT |

Variable:

| 이름 | 용도 |
|---|---|
| `CF_DOMAIN` | `harbor.<domain>`, `wedding.<domain>` image/build URL 구성 |

`IAC_DISPATCH_TOKEN`은 `serengeti-iac` 한 저장소만 대상으로 하고
`Contents: Read and write` 권한을 둔다. 앱 저장소의 기본
`GITHUB_TOKEN`은 다른 private 저장소에 dispatch할 수 없다.

Workflow는 다음 세 이미지를 동일 SHA로 push한다.

```text
girinman/wedding-letter-codex-api:<sha>
girinman/wedding-letter-codex-public:<sha>
girinman/wedding-letter-codex-admin:<sha>
```

세 build가 모두 성공한 뒤 `deploy-wedding-invitation` 이벤트를 한 번
전송한다.

## Serengeti secret

Private runtime `.env`에 다음 값을 둔다.

```dotenv
TS_WEDDING_ADMIN_HOST=wedding-admin.<domain>
WEDDING_INVITATION_IMAGE_TAG=<git-sha>
WEDDING_DB_PASSWORD=<secret>
WEDDING_MINIO_ACCESS_KEY=wedding-invitation
WEDDING_MINIO_SECRET_KEY=<secret>
WEDDING_S3_BUCKET=wedding-media
WEDDING_ADMIN_EMAIL=<private-email>
WEDDING_ADMIN_PASSWORD=<at-least-12-characters>
WEDDING_ADMIN_NAME=<display-name>
WEDDING_INVITATION_SLUG=our-wedding
NPM_CLOUDFLARE_DNS_TOKEN=<dns-edit-token>
```

`make wedding-invitation`은 수동 `psql`이나 `mc` 작업 없이 아래를
idempotent하게 수행한다.

1. PostgreSQL `wedding` role/database 생성 또는 비밀번호 reconciliation
2. MinIO bucket·app user·bucket-scoped policy 생성
3. API image pull/start와 SQL migration
4. admin identity와 generic invitation seed
5. public/admin web start

## Ingress

Public:

```text
wedding.giraffe.ai.kr
  → Cloudflare Tunnel
  → NPM
  → wedding-invitation:80
```

Cloudflare가 HTTPS를 종료하므로 public NPM host의 Force SSL은 끈다.

Admin:

```text
wedding-admin.giraffe.ai.kr
  → Tailscale DNS
  → NPM
  → wedding-admin:80
```

- DNS A/AAAA는 Serengeti의 Tailscale 주소를 가리킨다.
- Cloudflare Tunnel published application route에는 넣지 않는다.
- NPM은 Cloudflare DNS-01로 certificate를 발급하고 Force SSL을 켠다.
- 앱 내부에서도 admin session 인증을 요구한다.

## Production verification

```bash
make wedding-invitation
uv run scripts/setup_npm_hosts.py \
  --apply --ssl \
  --only "Wedding Invitation" \
  --only "Wedding Admin"
CONNECTIVITY=true make verify-ingress
```

API/public/admin 컨테이너가 healthy이고 공개 hostname이 `200`, 관리자
hostname이 Tailscale 연결 환경에서만 resolve/respond하는지 확인한다.
