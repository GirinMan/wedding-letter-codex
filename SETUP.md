# Setup and deployment

이 저장소는 public이다. 실제 이름, 연락처, 계좌정보, 사진, 음악,
데이터베이스 비밀번호, 객체 스토리지 key, 토큰을 commit하지 않는다.

## Local development

로컬 개발은 `.env.example`을 복사한 `.env`와 `docker compose`를 사용한다.
Compose는 PostgreSQL과 S3 호환 객체 스토리지를 제공하며, seed는 일반
placeholder 초대장과 관리자 계정만 만든다.

## CI/CD contract

배포 자동화는 API, public web, admin web의 세 이미지를 동일 Git SHA로
빌드하고, 모두 성공했을 때만 운영 배포 절차를 시작해야 한다. CI에는
다음 범주의 secret만 제공한다.

| 범주 | 용도 |
|---|---|
| Container registry credentials | 앱 이미지 push |
| Deployment dispatcher credential | 비공개 운영 자동화 트리거 |
| Runtime database credential | PostgreSQL 호환 데이터베이스 연결 |
| Runtime object-storage credential | S3 호환 버킷 접근 |
| Admin bootstrap credential | 최초 관리자 계정 생성 또는 갱신 |

각 credential은 최소 권한, 단일 목적, 회전 가능한 형태로 발급한다. 실제
이름·보관 위치·권한 범위·레지스트리 주소·네트워크 토폴로지는 비공개 운영
문서에서만 관리한다.

## Production requirements

- API는 PostgreSQL 호환 데이터베이스와 S3 호환 객체 스토리지에 연결한다.
- admin web은 애플리케이션 세션 인증과 사설 접근 경계를 모두 요구한다.
- 외부에 노출되는 public web·API의 TLS, DNS, 프록시, 배포 도구 설정은
  환경별 비공개 운영 구성에서 관리한다.
- 배포 후에는 세 앱 컨테이너의 readiness와 public invitation의 `200`,
  authenticated admin 접근, API readiness를 확인한다.
