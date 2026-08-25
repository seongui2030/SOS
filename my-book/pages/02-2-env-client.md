# 02-2. 환경변수와 클라이언트 코드

## 로컬 환경 파일

프로젝트 루트의 `.env.local`에 다음처럼 이름을 맞춘다. 실제 값은 교재나 GitHub에 쓰지 않는다.

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SECRET
```

URL과 publishable key의 값은 VITE 버전과 서버 버전에서 같을 수 있다. 이름이 두 벌인 이유는 실행 위치가 다르기 때문이다. Vite의 브라우저 코드에서는 `import.meta.env.VITE_...`, 서버에서는 `process.env...`를 읽는다.

현재 프로젝트의 핵심은 다음 구조다.

```ts
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(url, key);
```

실제 `client.ts`는 SSR도 고려해 `process.env` 대체값과 세션 저장 옵션을 더 갖는다. 핵심 원리는 URL과 publishable key로 클라이언트를 한 번 만들고 필요한 곳에서 가져다 쓰는 것이다.

```ts
const { data, error } = await supabase.auth.getUser();
```

Supabase 함수는 보통 `{ data, error }`를 돌려준다. 네트워크 작업은 실패할 수 있으므로 `error`를 확인한다. `data`만 읽고 오류를 무시하면 무한 로딩처럼 원인을 알기 어려운 화면이 생긴다.

## 환경변수 적용 시점

Vite는 시작 또는 빌드 시 환경변수를 읽는다. `.env.local`을 바꾼 뒤 실행 중인 개발 서버를 종료하고 다시 시작한다.

```powershell
# 실행 중인 터미널에서 Ctrl+C
npm run dev
```

Vercel에서도 값을 저장한 뒤 기존 배포가 자동으로 바뀌지 않을 수 있으므로 새 배포를 해야 한다.

## `.gitignore`

```gitignore
.env
.env.local
.env.*
```

비밀 파일이 Git에 포함되지 않도록 한다. 하지만 이미 커밋한 비밀은 `.gitignore`에 추가해도 과거 기록에서 사라지지 않는다. 그 키는 서비스 화면에서 폐기하고 새로 발급해야 한다.

