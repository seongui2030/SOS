# 04-2. 회원가입과 로그인 코드

## 입력 상태

```tsx
const [mode, setMode] = useState<"signin" | "signup">("signin");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
```

`mode`가 화면의 목적을 정하고, 입력값은 state에 저장된다. `loading` 중 버튼을 막아 같은 요청이 여러 번 전송되는 것을 줄인다.

## 완성된 분기 구조

```tsx
try {
  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
      },
    });

    if (error) throw error;

    if (!data.session) {
      toast.success(
        "가입되었습니다. 받은 이메일에서 인증 링크를 눌러주세요.",
      );
      return;
    }

    await recordUser();
    toast.success("가입과 로그인이 완료되었습니다.");
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    await recordUser();
    toast.success("로그인되었습니다.");
  }

  void navigate({ to: "/" });
} catch (error) {
  toast.error(
    error instanceof Error ? error.message : "로그인에 실패했습니다.",
  );
} finally {
  setLoading(false);
}
```

`if (!data.session)`이 핵심이다. 인증 메일을 기다리는 상태에서는 안내 후 `return`하여 메인 이동을 막는다. `else`는 로그인 코드가 가입 뒤에도 연속 실행되는 실수를 방지한다.

`try`는 실패할 수 있는 영역, `catch`는 오류 안내, `finally`는 성공·실패와 관계없이 로딩을 해제한다. `try`만 쓰고 `catch`나 `finally`가 없으면 문법 오류다.

## 입력 폼

```tsx
<form onSubmit={submit}>
  <Input
    type="email"
    required
    autoComplete="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
  <Input
    type="password"
    required
    minLength={6}
    autoComplete={mode === "signup" ? "new-password" : "current-password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />
  <Button type="submit" disabled={loading}>로그인</Button>
</form>
```

`onSubmit`을 사용하면 버튼 클릭뿐 아니라 Enter 키도 작동한다. 함수 첫 줄의 `event.preventDefault()`는 브라우저의 기본 새로고침 제출을 막는다.

## 실습 시험

- 새 이메일 가입: 인증 안내가 나오는가?
- 인증 전 로그인: 이해 가능한 오류가 나오는가?
- 인증 링크 클릭: `/auth`로 돌아오는가?
- 인증 후 로그인: 메인 화면으로 가는가?
- 틀린 비밀번호: 로딩이 끝나고 오류가 보이는가?

