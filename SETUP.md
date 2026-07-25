# Public repository deployment setup

이 저장소는 public이다. Secret 값, 실제 계좌정보, 비공개 전화번호, 개인용 토큰을 commit하지 않는다.

## GitHub Actions

Repository Settings → Secrets and variables → Actions에 다음을 설정한다.

### Secrets

| 이름 | 용도 |
|---|---|
| `HARBOR_ROBOT_USER` | 대상 Harbor 프로젝트에 push 가능한 robot account |
| `HARBOR_ROBOT_TOKEN` | 위 account의 token |
| `IAC_DISPATCH_TOKEN` | private `GirinMan/serengeti-iac`에 repository dispatch를 보낼 수 있는 fine-grained PAT |

### Variable

| 이름 | 용도 |
|---|---|
| `CF_DOMAIN` | Harbor hostname을 구성할 공개 domain |

Secret 값은 GitHub secret manager에서 직접 등록하고 문서나 issue에 남기지 않는다.

`IAC_DISPATCH_TOKEN`은 `GirinMan/serengeti-iac` 저장소만 대상으로 하고
`Contents: Read and write` 권한만 부여한다. 이 앱 저장소의 기본
`GITHUB_TOKEN`은 다른 private 저장소에 dispatch할 수 없으므로 대신 사용할 수 없다.

## serengeti-iac 연결

1. `.env`에 배포 tag 변수를 추가한다.

   ```dotenv
   WEDDING_INVITATION_IMAGE_TAG=<initial-git-sha>
   ```

2. `docker-compose.iac.yml`을 IaC 저장소의 앱 디렉터리에 배치한다.
3. `repository_dispatch` type에 `deploy-wedding-invitation`을 등록한다.
4. dispatch payload의 `tag`로 `WEDDING_INVITATION_IMAGE_TAG`를 갱신한다.
5. compose pull/up을 수행하는 Make target에 서비스를 연결한다.
6. 서비스와 `container_name`을 모두 `wedding-invitation`으로 유지하고 `proxy-tier`에 연결한다.
7. NPM의 forward target을 `http://wedding-invitation:80`으로 설정한다. Cloudflare Tunnel은 NPM의 host port `80`으로 전달한다.

구체적인 IaC 파일 구조와 운영 정보는 public 앱 저장소에 복제하지 않고 IaC 저장소 내부 문서를 따른다.

## 검증

```bash
npm run check
docker build -t wedding-letter-codex:verify app
gh workflow run build.yml --ref main
gh run list --workflow=build.yml --limit 1
```

배포 뒤 `/healthz`가 `200 OK`와 `ok`를 반환하는지 확인한다.
