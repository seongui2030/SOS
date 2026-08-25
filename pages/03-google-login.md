## 03. Google 계정으로 계속하기

### 학습 목표

- OAuth에서 앱, Supabase, Google, 브라우저의 역할을 구분한다.
- 승인된 출처와 리디렉션 URI를 올바르게 등록한다.
- `Unsupported provider`, `bad_oauth_state` 같은 오류를 단계별로 찾는다.

Google 로그인은 SOS가 사용자의 Google 비밀번호를 받는 방식이 아니다. 사용자를 Google로 보내고, Google이 신원을 확인한 뒤 Supabase에 결과를 돌려준다. Supabase는 자신의 세션을 만들고 앱으로 돌아온다.

```text
SOS 로그인 버튼
  → Supabase authorize
  → Google 로그인·동의
  → Supabase /auth/v1/callback
  → SOS /auth
  → 세션 확인 후 메인 화면
```

이처럼 여러 서비스가 이동하므로 주소 하나만 달라도 실패한다. 특히 Google에 등록하는 콜백은 앱 주소가 아니라 Supabase 콜백 주소다. 앱 주소는 Supabase의 Site URL과 Redirect URLs에 등록한다.

### 필요한 네 가지 설정

1. Google Cloud에서 프로젝트와 OAuth 동의 화면을 준비한다.
2. 웹 애플리케이션 OAuth 클라이언트를 만든다.
3. Google Client ID와 Client Secret을 Supabase Google 공급자에 넣는다.
4. Supabase와 Google에 로컬·운영 주소를 정확히 등록한다.

실습 중 사용하는 주소는 예를 들면 다음과 같다.

```text
로컬 앱: http://localhost:8080
운영 앱: https://sos-nu-flame.vercel.app
Supabase 콜백: https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

주소는 프로토콜, 도메인, 포트, 경로까지 비교한다. `http`와 `https`, 8080과 3000은 서로 다른 주소다.

### 확인 문제

1. SOS 앱이 Google 비밀번호를 직접 저장하지 않는 이유는 무엇인가?
2. Google에 등록할 콜백 주소는 어느 서비스의 주소인가?
3. 로컬 주소와 운영 주소를 모두 등록해야 하는 이유를 말해 보자.

