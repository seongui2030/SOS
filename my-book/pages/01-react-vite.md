# 01. React와 Vite로 출발하기

## 학습 목표

- 브라우저, React, Vite, TypeScript의 역할을 구분할 수 있다.
- SOS 프로젝트가 일반 React 프로젝트보다 어떤 기능을 더 갖는지 설명할 수 있다.
- 개발 서버와 배포용 빌드의 차이를 이해할 수 있다.

웹 페이지는 HTML이 구조를, CSS가 모양을, JavaScript가 동작을 담당한다. React는 화면을 작은 컴포넌트로 나누어 JavaScript로 조립하게 해 주는 라이브러리다. 예를 들어 로그인 화면은 `AuthPage`, 이메일 입력은 `Input`, 버튼은 `Button`이라는 부품으로 나눌 수 있다.

Vite는 개발 도구다. 소스 파일을 읽어 브라우저가 실행할 형태로 바꾸고, 개발 중에는 저장한 결과를 빠르게 새로 보여 준다. `npm run dev`는 개발 서버를, `npm run build`는 배포용 결과물을 만든다. TypeScript는 JavaScript에 자료형 검사를 더해 오타와 잘못된 값 사용을 실행 전에 찾는다.

현재 SOS 프로젝트는 React와 Vite 위에 TanStack Start를 사용한다. TanStack Start는 파일 기반 라우팅과 서버 API를 함께 제공한다. 따라서 `src/routes/auth.tsx`가 `/auth` 주소가 되고, `src/routes/api/transcribe.ts`는 서버 API가 된다. `src/routeTree.gen.ts`는 라우트 도구가 자동 생성하므로 보통 직접 편집하지 않는다.

## 전체 흐름

```text
개발자가 TSX 작성
        ↓
Vite가 변환하고 개발 서버 제공
        ↓
React가 컴포넌트로 화면 구성
        ↓
TanStack Router가 URL에 맞는 페이지 선택
        ↓
브라우저가 사용자에게 화면 표시
```

`package.json`은 프로젝트의 신분증과 준비물 목록이다. `dependencies`는 실행에 필요한 패키지, `devDependencies`는 개발과 검사에 필요한 패키지다. `scripts`에는 자주 쓰는 명령의 별명이 들어 있다. 이 프로젝트의 `dev`, `build`, `preview`, `lint`, `format`이 그 예다.

## 단원 프로젝트

이 단원에서는 빈 React/Vite 프로젝트를 만드는 일반 절차를 익힌 뒤 SOS의 확장 구조를 읽는다. 새 프로젝트를 꼭 덮어쓸 필요는 없다. 기존 SOS에서 실습한다면 명령의 뜻만 확인하고 파일 구조를 관찰한다.

## 확인 문제

1. React와 Vite는 각각 무슨 일을 하는가?
2. `.tsx` 확장자는 어떤 두 기술이 결합된 파일인가?
3. 개발 서버의 주소가 `localhost:8080`이라면 `localhost`는 누구의 컴퓨터인가?
4. 자동 생성 파일을 함부로 수정하면 안 되는 이유를 말해 보자.

