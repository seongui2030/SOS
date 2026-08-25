# 03-1. Google Cloud OAuth 설정

## 프로젝트 선택

Google Cloud Console 상단의 프로젝트 선택기를 눌러 전용 프로젝트를 선택하거나 만든다. 여러 프로젝트를 사용하면 Client ID를 잘못 복사하기 쉬우므로 프로젝트 이름을 기록한다.

콘솔 메뉴나 상단 검색창에서 `Google Auth Platform`을 찾는다. 화면 이름은 바뀔 수 있지만 핵심 작업은 앱 정보, 대상 사용자, OAuth 클라이언트 생성이다.

## 동의 화면

앱 이름, 지원 이메일, 개발자 연락처를 입력한다. 학습 단계에서 외부 사용자를 선택했다면 테스트 상태와 테스트 사용자 제한을 확인한다. 테스트 사용자로 등록되지 않은 Google 계정은 로그인이 거부될 수 있다.

민감한 범위를 불필요하게 요청하지 않는다. 기본 로그인은 보통 신원 확인에 필요한 `openid`, 이메일, 프로필 정도면 된다. 사용자의 Drive나 Gmail 권한은 이 프로젝트의 기본 로그인에 필요하지 않다.

## OAuth 클라이언트 만들기

클라이언트 유형은 `웹 애플리케이션`을 선택한다. Android나 데스크톱 앱 유형은 웹 브라우저 리디렉션 방식과 맞지 않는다.

승인된 JavaScript 원본에는 앱의 원본만 넣는다.

```text
http://localhost:8080
https://sos-nu-flame.vercel.app
```

원본에는 보통 `/auth` 같은 경로를 붙이지 않는다. 승인된 리디렉션 URI에는 Supabase 콜백을 넣는다.

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

## Client ID와 Secret

생성 후 Client ID와 Client Secret을 복사한다. JSON 파일을 내려받았다면 Git 저장소 안으로 옮기지 않는다. Client ID는 브라우저에 알려질 수 있지만 Client Secret은 비밀이다. 이 프로젝트에서는 둘을 Supabase Dashboard의 Google 공급자 설정에 입력한다.

## 체크리스트

- [ ] 올바른 Google Cloud 프로젝트인가?
- [ ] OAuth 클라이언트 유형이 웹 애플리케이션인가?
- [ ] 로컬과 실제 Vercel 원본이 등록되었는가?
- [ ] Supabase 콜백의 프로젝트 참조가 현재 프로젝트인가?
- [ ] Client Secret이 Git에 들어가지 않았는가?

