# 04-3. 세션·프로필·로그인 오류

## 세션이란

세션은 로그인에 성공했다는 임시 출입증이다. Supabase 클라이언트는 브라우저 저장소에 세션을 유지하고 만료 전 갱신할 수 있다. 비밀번호를 매 요청마다 보내지 않고 액세스 토큰으로 사용자를 증명한다.

```ts
const { data } = await supabase.auth.getSession();
```

`getSession`은 로컬 세션을 빠르게 확인할 때 쓴다. 보호된 중요한 작업은 서버 검증 또는 `getUser`처럼 인증 서버가 확인하는 방법을 사용한다.

```ts
const { data, error } = await supabase.auth.getUser();
if (error || !data.user) {
  void navigate({ to: "/auth" });
  return;
}
```

## 앱 프로필 저장

현재 프로젝트의 `recordUser`는 로그인된 Auth 사용자를 읽고 `public.users`에 upsert한다.

```ts
await table.upsert(
  {
    id: user.id,
    email: user.email ?? null,
    display_name: user.user_metadata?.["full_name"] ?? null,
  },
  { onConflict: "id" },
);
```

upsert는 같은 ID가 없으면 추가하고 있으면 갱신한다. Auth의 ID와 프로필 ID를 같게 유지해 한 사람의 데이터를 연결한다. RLS 정책 `auth.uid() = id`가 다른 사람 프로필 접근을 막는다.

## 자주 보는 로그인 오류

| 오류 | 뜻 | 조치 |
|---|---|---|
| Email not confirmed | 인증 링크 미완료 | 메일 확인·재발송 |
| Invalid login credentials | 이메일 또는 비밀번호 불일치 | 입력과 가입 방식 확인 |
| Email logins are disabled | Email 공급자 꺼짐 | Auth 설정에서 활성화 |
| Failed to fetch | 서버에 도달 못함 | URL, 네트워크, 인증서 확인 |
| 403 on users upsert | 프로필 RLS 거부 | 로그인 ID와 정책 확인 |

Google로 가입한 이메일이 목록에 있다는 사실만으로 같은 이메일과 임의의 비밀번호로 로그인할 수는 없다. Provider가 Google인 계정은 Google OAuth로 로그인한다. 이메일·비밀번호 방식으로 가입한 Provider가 Email인지 확인한다.

## 로그아웃

```ts
await supabase.auth.signOut();
void navigate({ to: "/auth" });
```

로그아웃 후 뒤로 가기만으로 보호 화면 데이터가 보이지 않는지 확인한다. 화면 숨김만으로 보호하지 말고 서버 검증과 RLS를 함께 사용한다.

## 종합 문제

회원가입 계정은 보이지만 로그인이 안 된다. 점검 순서를 작성해 보자: Provider → Email 활성화 → Email confirmed → 정확한 비밀번호 → Network 응답 → 프로젝트 URL과 키.

