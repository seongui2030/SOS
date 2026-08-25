# 02-3. 키 보안과 연결 점검

## 공개 가능성과 안전성은 다르다

publishable key는 브라우저 앱에 배포할 수 있다. 그러나 공격자도 그 키로 API를 호출할 수 있으므로 테이블에 RLS가 없으면 위험하다. service role key는 서버 관리 권한이므로 `VITE_` 이름으로 만들거나 React 파일에 쓰면 안 된다.

| 값 | 브라우저 사용 | GitHub 공개 | 보호 방법 |
|---|---:|---:|---|
| Project URL | 가능 | 대체로 가능 | 프로젝트 확인 |
| Publishable key | 가능 | 가능하지만 환경변수 권장 | RLS |
| Service role key | 금지 | 절대 금지 | 서버 Secret |
| 개인 액세스 토큰 | 금지 | 절대 금지 | 로컬 보안 저장소 |
| Google client secret | 금지 | 절대 금지 | Supabase 공급자 Secret |

## 연결 확인 절차

1. 브라우저 Console에 `Missing Supabase environment variable`이 없는지 확인한다.
2. Network에서 Supabase 요청 URL의 프로젝트 참조가 원하는 프로젝트인지 본다.
3. `auth/v1/user`가 로그인 후 200인지 본다.
4. 테이블 요청이 404면 테이블과 스키마, 403이면 RLS 정책을 확인한다.
5. 로컬만 성공하면 Vercel 환경변수와 재배포를 확인한다.

## 자주 하는 실수

`VITE_SUPABASE_URL`의 Value에 `VITE_SUPABASE_URL=` 전체를 붙여 넣으면 URL이 아니다. Key와 Value는 분리한다. Vercel에서 Production에만 넣은 값은 Preview 배포에서 비어 있을 수 있다. 다른 Supabase 프로젝트의 URL과 키를 섞으면 인증과 DB가 서로 맞지 않는다.

오류 문구에 `Connect Supabase in Lovable Cloud`가 남아 있어도 그것은 코드에 적힌 안내 문자열일 수 있다. 실제 연결 여부는 요청 URL과 환경변수로 판단한다. 브랜드 문구가 원인을 만드는 것은 아니다.

## 보안 사고 대응

비밀 키를 채팅, 캡처, GitHub에 공개했다면 삭제만 하지 말고 즉시 회전한다. 즉, 기존 키를 폐기하고 새 키를 발급해 로컬과 Vercel 값을 교체한 뒤 재배포한다. 로그에도 비밀 전체를 출력하지 않는다.

## 확인 문제

1. publishable key와 service role key의 가장 중요한 차이는 무엇인가?
2. `.gitignore` 추가 전에 커밋된 비밀은 어떻게 처리해야 하는가?
3. 운영에서만 환경변수 오류가 날 때 확인 순서를 쓰시오.

