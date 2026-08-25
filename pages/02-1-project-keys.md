## 02-1. Supabase 프로젝트와 API 키

### 프로젝트 만들기

Supabase Dashboard에서 새 프로젝트를 만들 때 조직, 프로젝트 이름, 데이터베이스 비밀번호, 지역을 선택한다. 지역은 사용자가 가까운 곳을 고르면 지연 시간이 줄어든다. 데이터베이스 비밀번호는 CLI나 직접 DB 연결에 쓰일 수 있으므로 비밀번호 관리자에 보관한다.

프로젝트가 준비되면 Connect 창 또는 Project Settings의 API 관련 화면에서 다음 두 값을 찾는다.

- Project URL: `https://프로젝트참조.supabase.co`
- Publishable key: `sb_publishable_...`

프로젝트 참조(project ref)는 URL에 들어 있는 고유 식별자다. 사람에게 읽기 좋은 프로젝트 이름과 다르며 CLI의 `--project-ref`에도 사용된다.

### 클라이언트 라이브러리 설치

```powershell
npm install @supabase/supabase-js
```

이 명령은 패키지를 내려받아 `node_modules`에 설치하고, `package.json`과 잠금 파일에 의존성을 기록한다. `npx skills add ...` 같은 명령과 다르다. SDK 설치는 앱이 Supabase와 통신하게 하고, AI skill 설치는 AI에게 작업 지침을 제공한다.

### 두 종류의 사용자 표

Supabase의 Authentication → Users는 `auth.users`에 해당하며 로그인 계정의 원본이다. 우리가 만든 `public.users`는 화면에 표시할 이름 등 앱 프로필이다. 두 표의 `id`를 같게 연결한다.

```text
auth.users.id  1 ─── 0..1  public.users.id
```

Authentication 목록에 이메일이 있다고 해서 `public.users` 행이 반드시 있다는 뜻은 아니다. 반대도 정상 로그인 계정을 보장하지 않는다. 로그인은 항상 Supabase Auth가 판단한다.

### 키를 복사할 때 주의할 점

- `.env.local`에는 `KEY=value` 형식으로 한 줄씩 쓴다.
- Vercel 입력창의 Key에는 이름만, Value에는 값만 넣는다.
- 화면에서 복사한 따옴표를 Value에 넣지 않는 것이 안전하다.
- Project URL과 키는 반드시 같은 Supabase 프로젝트에서 가져온다.
- 개인 액세스 토큰(`sbp_...`)은 publishable key가 아니다.

