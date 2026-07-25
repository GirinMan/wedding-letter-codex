# girinman-app-template

serengeti-iac 홈랩에 자동 배포되는 새 앱을 만들기 위한 템플릿 리포지토리.

## 포함된 것

| 파일 | 용도 |
|------|------|
| `.github/workflows/build.yml` | Harbor push + IaC dispatch CI 워크플로우 |
| `Dockerfile` | Python(uv) / Node / Go 멀티 옵션 템플릿 |
| `docker-compose.iac.yml` | serengeti-iac 에 배치할 compose 파일 템플릿 |
| `SETUP.md` | 플레이스홀더 치환부터 IaC 연동까지 전체 가이드 |

## 배포 파이프라인 구조

```
App repo push (main)
  → build.yml: docker build → Harbor push (:sha tag)
  → curl repository_dispatch → serengeti-iac
    → deploy-apps.yml: self-hosted runner
    → sed .env IMAGE_TAG → make <app>
    → docker compose pull && up -d
  → https://<app>.giraffe.ai.kr 반영
```

## 빠른 시작

1. **Use this template** 으로 새 리포 생성
2. `SETUP.md` 의 단계를 따라 플레이스홀더 치환 + Secrets 등록
3. `Dockerfile` 에서 프로젝트에 맞는 옵션 선택
4. serengeti-iac 에 compose / Makefile / deploy-apps.yml 연동
5. `main` 에 push → 자동 배포 확인

자세한 내용은 [SETUP.md](SETUP.md) 참고.
