# Wedding Letter Codex

Codex가 한국 모바일 청첩장을 만들고 수정하도록 구성한 공개 템플릿이다. 첫 단계는 특정 디자인을 완성하는 것이 아니라, **콘텐츠·핵심 동작·디자인 시스템을 독립적으로 교체할 수 있는 기반**을 제공하는 데 집중한다.

## 현재 포함된 핵심

- 신랑·신부, 예식 일시, 장소, 인사말의 단일 데이터 소스
- 타임존을 고려한 D-day 표시
- 선택형 연락처, 계좌 복사, 갤러리 dialog, RSVP, Web Share, 음악 제어
- 기능이 꺼지거나 데이터가 비어 있을 때 해당 섹션을 숨기는 feature flag
- 키보드 포커스, live region, reduced motion, 모바일 반응형 기반
- 교체 가능한 CSS design-system contract
- Codex용 `AGENTS.md`, repo-local skill, project custom agents
- Node 내장 테스트와 구성·자산·design-token validator
- Nginx 정적 이미지와 Harbor → IaC 배포 workflow

원본 미디어, 디자인, 음악은 포함하지 않는다.

## 구조

```text
.
├── AGENTS.md
├── .agents/skills/build-wedding-invitation/
├── .codex/agents/
├── app/
│   ├── data/invitation.js
│   ├── design-systems/foundation.css
│   ├── styles/core.css
│   ├── scripts/
│   ├── media/
│   └── index.html
├── scripts/validate-invitation.mjs
└── tests/
```

### 세 가지 경계

| 관심사 | 위치 | 변경 예 |
|---|---|---|
| 콘텐츠 | `app/data/invitation.js` | 이름, 날짜, 장소, 카피, 연락처, 계좌, 미디어 URL |
| 핵심 동작 | `app/scripts/`, `app/styles/core.css` | D-day, 복사, 공유, dialog, responsive mechanics |
| 디자인 시스템 | `app/design-systems/*.css` | 색상, 글꼴, spacing character, radius, shadow, motion feel |

새 디자인 시스템을 적용할 때는 contract의 CSS custom properties를 구현한 파일을 추가하고 `app/index.html`의 첫 번째 stylesheet 경로만 바꾼다. 이미지와 음악 경로는 디자인 시스템이 아니라 `invitation.js`에서 관리한다.

## 로컬 실행

Node.js 22 이상이 필요하다.

```bash
npm ci
npm run check
python3 -m http.server 8000 --directory app
```

브라우저에서 `http://localhost:8000`을 연다. 초기 데이터에는 의도적인 `[placeholder]`가 있어 validator가 경고하지만 실패하지 않는다.

Docker로 확인할 수도 있다.

```bash
docker build -t wedding-letter-codex:local app
docker run --rm -p 8080:80 wedding-letter-codex:local
curl -fsS http://localhost:8080/healthz
```

## Codex에서 사용

저장소를 Codex로 연 뒤 청첩장 생성·수정·QA를 요청하면 `$build-wedding-invitation` skill이 콘텐츠, 동작, 디자인 변경을 분류한다. 큰 작업만 custom subagent를 사용하고, 작은 데이터나 token 변경은 직접 처리하도록 구성했다.

실제 개인정보나 계좌정보를 public git에 올리기 전에는 공개 범위를 반드시 확인한다. 비공개 데이터 주입 방식이 필요하면 별도 runtime configuration 계층을 추가하는 편이 안전하다.

## 배포

GitHub Actions는 PR에서 테스트·validator·Docker build를 실행한다. `main` 반영 시에는 Harbor에 SHA tag 이미지를 push하고 `deploy-wedding-letter-codex` 이벤트를 IaC 저장소로 보낸다. 필요한 설정은 [SETUP.md](SETUP.md)에 정리되어 있다.

## 출처

이 프로젝트의 문제 정의와 초기 workflow는 [revfactory/wedding-letter](https://github.com/revfactory/wedding-letter)에서 영감을 받았다. Claude 전용 지침과 기존 미디어를 복사하지 않고 Codex와 교체형 디자인 시스템에 맞게 다시 구성했다. 자세한 내용은 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)를 참고한다.

## License

MIT
