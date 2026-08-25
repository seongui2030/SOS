# 03-3. OAuth 코드와 오류 해결

## 버튼 코드

현재 `auth.tsx`의 핵심 구조는 다음과 같다.

```tsx
const google = async () => {
  setLoading(true);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth`,
    },
  });

  if (error) {
    setLoading(false);
    toast.error(error.message);
  }
};
```

`window.location.origin`은 현재 실행 중인 주소를 자동으로 사용한다. 로컬에서는 `http://localhost:8080`, 운영에서는 Vercel 도메인이 된다. `/auth`는 돌아온 세션을 확인할 페이지다.

버튼은 다음처럼 함수를 연결한다.

```tsx
<Button onClick={() => void google()} disabled={loading}>
  구글 계정으로 계속하기
</Button>
```

`void`는 Promise 반환값을 이 자리에서 기다리지 않는다는 의도를 TypeScript 도구에 알린다. 함수 내부에서는 오류를 처리한다.

## 돌아온 뒤 세션 확인

```tsx
useEffect(() => {
  void supabase.auth.getSession().then(({ data }) => {
    if (data.session) {
      void navigate({ to: "/" });
    }
  });
}, [navigate]);
```

세션이 있으면 메인 화면으로 이동한다. 세션은 브라우저 저장소에 유지되고 자동 갱신 옵션이 만료 전 토큰을 새로 받는다.

## 오류별 의미

### Unsupported provider

Supabase에서 Google 공급자를 켜지 않았다. Provider 설정을 저장한다.

### redirect_uri_mismatch

Google OAuth 클라이언트에 등록한 Supabase callback과 실제 요청 주소가 다르다. 문자 단위로 비교한다.

### bad_oauth_state

로그인 시작 때 저장한 상태값과 돌아온 값이 맞지 않는다. 로그인 중 개발 서버가 꺼졌거나, `localhost`와 다른 도메인을 섞었거나, 쿠키·저장소가 지워진 경우가 있다. 같은 탭과 같은 주소로 다시 시작한다.

### localhost 연결 거부

Google 로그인은 성공했지만 돌아갈 주소가 `localhost`이고 개발 서버가 꺼져 있다. `npm run dev`를 실행하거나 운영 Site URL/redirectTo를 점검한다.

### 로그인 후 무한 로딩

Auth 성공과 DB 성공은 별개다. Network에서 `user`가 200인데 `conversations`가 404라면 테이블 또는 프로젝트가 잘못된 것이다. 403이면 RLS, 반복 리디렉션이면 `/`와 `/auth`의 이동 조건을 확인한다.

## 테스트 표

| 시험 | 기대 결과 |
|---|---|
| 로그아웃 상태에서 Google 버튼 | Google 화면으로 이동 |
| 동의 후 callback | 앱 `/auth`로 복귀 |
| 세션 확인 | `/`로 이동 |
| 기존 대화 있음 | 최근 대화로 이동 |
| 기존 대화 없음 | 새 대화 생성 후 이동 |

