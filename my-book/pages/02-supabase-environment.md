# 02. Supabase 연결과 환경변수

## 학습 목표

- Supabase가 제공하는 인증, 데이터베이스, API의 관계를 설명한다.
- 브라우저용 환경변수와 서버 전용 환경변수를 구분한다.
- 로컬과 Vercel이 서로 다른 환경변수 저장소를 사용함을 이해한다.

Supabase는 PostgreSQL 데이터베이스, 회원 인증, 파일 저장소 등을 제공한다. 웹 앱은 `@supabase/supabase-js` 패키지로 Supabase API에 요청한다. 프로젝트 URL은 어느 Supabase 프로젝트에 갈지, publishable key는 공개 클라이언트가 그 프로젝트 API를 사용할 수 있게 한다.

환경변수는 코드와 설정값을 분리하는 방법이다. 같은 코드를 로컬, 시험 서버, 운영 서버에서 사용하면서 URL과 키만 다르게 넣을 수 있다. 하지만 환경변수라고 해서 모두 비밀은 아니다. `VITE_`로 시작하는 값은 빌드할 때 브라우저 코드에 들어가므로 누구나 개발자 도구에서 볼 수 있다고 생각해야 한다.

```text
브라우저 → VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
서버     → SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY
관리 작업→ SUPABASE_SERVICE_ROLE_KEY (절대 브라우저 금지)
```

publishable key는 공개 사용을 전제로 하지만 데이터가 공개라는 뜻은 아니다. 실제 데이터 보호는 로그인 토큰과 RLS가 담당한다. 반면 service role key는 RLS를 우회할 수 있어 유출되면 매우 위험하다.

## 확인 문제

1. 환경변수를 사용하는 이유를 두 가지 쓰시오.
2. `VITE_` 접두사가 붙은 값은 왜 진짜 비밀을 넣으면 안 되는가?
3. publishable key가 공개되어도 RLS가 필요한 이유는 무엇인가?

