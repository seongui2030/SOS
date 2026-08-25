## 01-3. 실행·검사·오류 읽기

### 개발 명령의 순서

```powershell
npm run format
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

항상 전부 실행해야 하는 것은 아니다. 코드를 작성한 뒤 `npx tsc --noEmit`으로 문법과 자료형을 검사하고, 배포 전에는 `npm run build`까지 확인한다. `--noEmit`은 검사만 하고 JavaScript 출력 파일은 만들지 말라는 뜻이다.

Prettier는 올바른 코드를 보기 좋게 정리한다. 문법이 깨진 코드를 고치는 도구는 아니다. `catch or finally expected`가 있으면 먼저 빠진 중괄호나 `catch`를 고쳐야 포맷이 된다.

### 오류 메시지 읽기

오류를 네 부분으로 나눈다.

```text
src/routes/auth.tsx:107:7
TS1128: Declaration or statement expected.
```

- 파일: `src/routes/auth.tsx`
- 행: 107
- 열: 7
- 설명: 문장이나 선언이 올 자리가 잘못됨

컴파일러가 가리킨 줄은 범인이 아니라 피해 지점일 수도 있다. 특히 `}` 오류는 위쪽에서 `if`, `try`, 함수의 짝이 깨진 경우가 많다. 여는 `{`와 닫는 `}`를 같은 들여쓰기 수준에서 확인한다.

### 브라우저 개발자 도구

F12를 눌러 `Console`과 `Network`를 사용한다. Console은 JavaScript 오류, Network는 서버 요청 결과를 보여 준다.

| 상태 코드 | 쉬운 뜻 | 먼저 확인할 것 |
|---|---|---|
| 200 | 성공 | 응답 내용 |
| 201 | 새 데이터 생성 성공 | 생성된 ID |
| 400 | 요청 형식 오류 | 입력값, OAuth 설정 |
| 401 | 로그인 증명 부족 | 세션, 토큰 |
| 403 | 권한 거부 | RLS 정책 |
| 404 | 주소나 테이블 없음 | URL, 프로젝트, 테이블 |
| 500 | 서버 내부 오류 | 서버 로그와 환경변수 |

무한 로딩은 같은 요청이 계속 반복되는지 살핀다. 예를 들어 `/`가 오류 때문에 `/auth`로 보내고, `/auth`는 로그인 세션 때문에 `/`로 보내면 화면이 깜박이는 순환이 생긴다.

### 디버깅 기록법

1. 내가 한 행동을 한 문장으로 쓴다.
2. 첫 오류 문장을 복사한다.
3. Network의 요청 URL과 상태 코드를 기록한다.
4. 최근 변경한 줄을 `git diff`로 본다.
5. 한 번에 한 원인만 바꾸고 다시 시험한다.

### 실습

프로젝트에서 다음을 실행하고 결과를 학습 노트에 적는다.

```powershell
git status
npx tsc --noEmit
npm run build
```

`git status`의 수정 파일은 모두 내 작업인지 확인한다. 다른 사람이 만든 변경을 임의로 삭제하지 않는다.

