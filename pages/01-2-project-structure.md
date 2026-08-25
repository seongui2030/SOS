## 01-2. 프로젝트 기본 골격 읽기

### 중요한 폴더 지도

```text
SOS/
├── public/                 정적 파일
├── src/
│   ├── components/         재사용 화면 부품
│   ├── hooks/              React 사용자 정의 훅
│   ├── integrations/       Supabase 연결 코드
│   ├── lib/                공통 기능
│   ├── routes/             페이지와 서버 API
│   ├── router.tsx          라우터 생성
│   ├── routeTree.gen.ts    자동 생성 라우트 목록
│   └── styles.css          전체 스타일
├── supabase/
│   └── migrations/         DB 변경 이력 SQL
├── package.json            패키지와 명령
├── tsconfig.json           TypeScript 설정
└── vite.config.ts          Vite와 배포 빌드 설정
```

`public`의 파일은 거의 그대로 배포된다. `src`는 변환이 필요한 소스다. `components/ui`에는 버튼·대화상자 같은 범용 부품이 있고, `VoiceAssistant.tsx`처럼 서비스 기능을 담은 큰 컴포넌트도 있다.

### 파일 기반 라우팅

TanStack Start에서는 파일 이름과 URL이 연결된다.

| 파일 | 주소 또는 역할 |
|---|---|
| `src/routes/index.tsx` | `/` |
| `src/routes/auth.tsx` | `/auth` |
| `src/routes/api/geocode.ts` | `/api/geocode` |
| `src/routes/_authenticated/c.$conversationId.tsx` | 대화 ID가 포함된 동적 주소 |
| `src/routes/__root.tsx` | 모든 페이지를 감싸는 최상위 레이아웃 |

`$conversationId`는 고정 글자가 아니라 변수다. 예를 들어 `/c/abc123`에서 `abc123`이 대화 ID가 된다. `_authenticated`는 로그인 확인을 공통 적용하기 위한 레이아웃 그룹이다.

### import 별칭

다음 코드는 `@/`를 `src/`처럼 사용한다.

```ts
import { supabase } from "@/integrations/supabase/client";
```

긴 `../../` 경로를 반복하지 않아 읽기 쉽다. 현재 Vite 설정의 `resolve.tsconfigPaths: true`가 TypeScript 경로 설정을 읽는다.

### 컴포넌트 읽는 순서

처음부터 모든 줄을 이해하려 하지 않는다. 먼저 `export const Route`에서 주소 설정을 확인하고, `component`에 지정된 함수로 이동한다. 그다음 상태(`useState`), 시작 작업(`useEffect`), 이벤트 함수, 마지막으로 반환하는 JSX 순서로 읽는다.

### 자료형의 도움

```ts
const [mode, setMode] = useState<"signin" | "signup">("signin");
```

`mode`에는 두 문자열만 들어갈 수 있다. 실수로 `"login"`을 넣으면 TypeScript가 알려 준다. 이런 제한은 프로그램의 가능한 상태를 분명하게 만든다.

### 확인 문제

1. `/auth` 화면을 수정할 파일은 무엇인가?
2. `routeTree.gen.ts`를 직접 편집하지 않는 이유는 무엇인가?
3. `@/components/ui/button`의 실제 시작 폴더는 어디인가?

