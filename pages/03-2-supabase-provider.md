## 공급자 켜기

Supabase Dashboard에서 프로젝트를 연 뒤 Authentication의 Providers 또는 Sign In 관련 메뉴에서 Google을 선택한다. Enable을 켜고 Google Cloud에서 만든 Client ID와 Client Secret을 입력해 저장한다.

`Unsupported provider: provider is not enabled`는 코드가 Google 로그인을 요청했지만 이 스위치가 꺼졌다는 뜻이다. 앱 코드를 고치기 전에 공급자 설정을 확인한다.

## URL Configuration

Authentication의 URL Configuration에서 Site URL을 실제 대표 주소로 정한다.

```text
https://sos-nu-flame.vercel.app
```

허용 Redirect URLs에는 운영과 로컬을 추가한다.

```text
https://sos-nu-flame.vercel.app/**
http://localhost:8080/**
```

와일드카드 허용 방식은 Supabase 화면 안내를 따른다. 운영에서는 필요 이상으로 넓은 주소를 허용하지 않는다. `localhost`는 개발용이며 다른 사람의 컴퓨터가 아니라 로그인 흐름을 시작한 바로 그 컴퓨터를 가리킨다.

## 주소의 책임 분담

| 설정 위치 | 들어갈 주소 |
|---|---|
| Google 승인 원본 | 앱의 로컬·운영 원본 |
| Google 리디렉션 URI | Supabase `/auth/v1/callback` |
| Supabase Site URL | 대표 운영 앱 주소 |
| Supabase Redirect URLs | 앱으로 돌아갈 허용 주소 |
| 코드 `redirectTo` | 현재 앱의 `/auth` |

Google이 Supabase를 믿고, Supabase가 앱 주소를 믿는 연결 고리다. 배포 도메인이 바뀌면 Google과 Supabase 양쪽을 함께 갱신한다.

## 사용자 화면 읽기

Authentication → Users의 Provider가 Google이면 Google OAuth로 만들어진 계정이다. 같은 이메일로 이메일·비밀번호 계정도 사용하려 할 때 계정 연결 정책에 따라 결과가 달라질 수 있다. Provider 표시와 실제 로그인 방식을 확인한다.

## 실습 확인

개발자 도구 Network에서 다음 이동을 찾는다.

1. Supabase `authorize?provider=google`
2. Google 로그인 페이지
3. Supabase `callback`
4. 앱의 `/auth`

앞 단계가 성공하지 않으면 뒤 단계 코드를 먼저 고치지 않는다.

