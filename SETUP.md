# 새 앱 배포 가이드

이 템플릿으로 새 리포를 만들면 serengeti-iac 홈랩에 자동 배포되는 앱을 빠르게 셋업할 수 있다.

## 1. 리포 생성

GitHub 에서 이 템플릿으로 새 리포를 생성한다:
- **Use this template** → **Create a new repository**
- 리포 이름: `GirinMan/<app-repo-name>`

## 2. 플레이스홀더 교체

프로젝트 전체에서 아래 플레이스홀더를 검색/치환한다:

| 플레이스홀더 | 설명 | 예시 |
|---|---|---|
| `__APP_NAME__` | Harbor 이미지 이름 / 컨테이너 이름 | `my-service` |
| `__DEPLOY_EVENT__` | IaC dispatch 이벤트 타입 | `deploy-my-service` |
| `__APP_PATH__` | 소스 루트 디렉토리 | `app` (Dockerfile 이 있는 곳) |
| `__IMAGE_TAG_VAR__` | `.env` 에 들어갈 이미지 태그 변수명 | `MY_SERVICE_IMAGE_TAG` |
| `__APP_PORT__` | 앱이 리슨하는 포트 | `8000` |
| `__HEALTH_PATH__` | 헬스체크 경로 | `/health` |

```bash
# 일괄 치환 예시 (macOS 는 gsed)
find . -type f -not -path './.git/*' \
  -exec sed -i \
    -e 's/__APP_NAME__/my-service/g' \
    -e 's/__DEPLOY_EVENT__/deploy-my-service/g' \
    -e 's/__APP_PATH__/app/g' \
    -e 's/__IMAGE_TAG_VAR__/MY_SERVICE_IMAGE_TAG/g' \
    -e 's/__APP_PORT__/8000/g' \
    -e 's/__HEALTH_PATH__/\/health/g' \
    {} +
```

## 3. Dockerfile 선택

`Dockerfile` 에 Python / Node / Go 옵션이 주석으로 들어있다.
프로젝트에 맞는 섹션만 남기고 나머지를 삭제한다.

## 4. GitHub Secrets & Variables 등록

리포 Settings → Secrets and variables → Actions 에서:

**Secrets:**
| 이름 | 값 | 비고 |
|---|---|---|
| `HARBOR_ROBOT_USER` | `robot$girinman+ci-push` | Harbor robot account |
| `HARBOR_ROBOT_TOKEN` | *(Harbor 에서 발급)* | |
| `IAC_DISPATCH_TOKEN` | *(GitHub PAT, `repo` scope 또는 Fine-grained)* | serengeti-iac 에 dispatch 권한 |

**Variables:**
| 이름 | 값 |
|---|---|
| `CF_DOMAIN` | `giraffe.ai.kr` |

> 기존 앱 리포(GIS, career)에 같은 값이 등록돼 있다.
> `IAC_DISPATCH_TOKEN` 은 모든 앱 리포에서 동일한 PAT 을 공유한다.

## 5. Harbor 프로젝트 확인

Harbor UI (`https://harbor.giraffe.ai.kr`) 의 `girinman` 프로젝트에
이미지가 push 되므로, robot account 에 해당 프로젝트 push 권한이
있는지 확인한다 (기존 `robot$girinman+ci-push` 사용 시 추가 설정 불필요).

## 6. IaC 쪽 설정 (serengeti-iac)

### 6.1 `.env` 에 이미지 태그 변수 추가

```
__IMAGE_TAG_VAR__=<초기 배포할 git sha>
```

### 6.2 Compose 파일 배치

`docker-compose.iac.yml` 을 아래로 복사 (플레이스홀더 치환 후):

```
serengeti-iac/docker/layer3-apps/__APP_NAME__/docker-compose.yml
```

### 6.3 `deploy-apps.yml` 에 앱 추가

```yaml
# on.repository_dispatch.types 에 추가
types: [deploy-blog, deploy-gis, deploy-my-service]

# workflow_dispatch.inputs.app.options 에 추가
options:
  - blog
  - gis
  - my-service
  - apps

# "Resolve target app & tag" step 의 case 에 추가
deploy-my-service) APP=my-service ;;

# tag → .env sed 에 추가
my-service)
  sed -i "s|^MY_SERVICE_IMAGE_TAG=.*|MY_SERVICE_IMAGE_TAG=${TAG}|" .env
  ;;

# deploy case 에 추가
my-service) make my-service ;;
```

### 6.4 `Makefile` 에 타겟 추가

```makefile
my-service: check-env network harbor-login
	@echo "==> [Layer 3] my-service 실행 (Harbor pull)"
	$(COMPOSE) -f docker/layer3-apps/my-service/docker-compose.yml pull
	$(COMPOSE) -f docker/layer3-apps/my-service/docker-compose.yml up -d
```

`apps` 타겟에도 추가:

```makefile
apps: check-env network dirs harbor-login
	# ... 기존 라인들 ...
	$(COMPOSE) -f docker/layer3-apps/my-service/docker-compose.yml pull
	$(COMPOSE) -f docker/layer3-apps/my-service/docker-compose.yml up -d
```

### 6.5 NPM 프록시 호스트 등록

Nginx Proxy Manager Admin (`http://127.0.0.1:81`) 에서:
- Domain: `my-service.giraffe.ai.kr`
- Forward: `__APP_NAME__:__APP_PORT__`
- SSL: Let's Encrypt

### 6.6 Cloudflare Tunnel 호스트 추가

Cloudflare Dashboard → Zero Trust → Tunnels → Public Hostname 에서:
- Subdomain: `my-service`
- Service: `http://localhost:80` (NPM 으로 라우팅)

## 7. 검증

```bash
# 1. 앱 리포에서 main 으로 push (또는 workflow_dispatch)
gh workflow run build.yml --ref main

# 2. GitHub Actions 에서 전체 녹색 확인
gh run list --workflow=build.yml --limit 1

# 3. IaC 쪽 deploy-apps 가 자동 실행됐는지 확인
gh run list -R GirinMan/serengeti-iac --workflow=deploy-apps.yml --limit 1

# 4. 컨테이너 healthy 확인
docker inspect __APP_NAME__ --format '{{.State.Health.Status}} {{.Config.Image}}'

# 5. 외부 접근 확인
curl -sSI https://my-service.giraffe.ai.kr
```

## Self-hosted runner 가 필요한 경우

Docker 이미지에 100MB 이상의 단일 레이어가 있으면 Cloudflare 가 push 를
차단한다 (free tier 100MB body limit). 이 경우:

1. `build.yml` 에서 `runs-on` 을 `[self-hosted, linux, x64, homelab]` 로 변경
2. `docker/setup-buildx-action` 에 `driver-opts: network=host` 추가
3. Harbor login/push 대상을 `localhost:8088` 로 변경

주석 처리된 예시가 `build.yml` 에 있다.
GIS worker (`postgis/postgis:16-3.4-alpine`, ~269MB) 가 이 패턴을 사용 중이다.
