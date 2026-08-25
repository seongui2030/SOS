# 01-1. 개발 도구 설치와 프로젝트 생성

## 준비물

Windows 기준으로 Node.js LTS, Git, VS Code, 최신 브라우저가 필요하다. 설치 후 PowerShell에서 다음을 확인한다.

```powershell
node --version
npm --version
git --version
```

버전 번호가 출력되면 명령을 찾은 것이다. `'node'은(는) 인식되지 않습니다`가 나오면 Node.js가 설치되지 않았거나 터미널을 설치 전부터 열어 둔 경우다. VS Code와 터미널을 완전히 닫았다가 다시 연다.

## 일반 React/Vite 프로젝트 만들기

연습용 상위 폴더에서 다음을 실행한다.

```powershell
npm create vite@latest emergency-assistant -- --template react-ts
cd emergency-assistant
npm install
npm run dev
```

첫 명령은 Vite의 생성 도구로 `emergency-assistant` 폴더를 만들고 React+TypeScript 틀을 선택한다. `cd`는 작업 위치를 옮긴다. `npm install`은 `package.json`을 읽어 패키지를 `node_modules`에 설치한다. 마지막 명령은 개발 서버를 시작한다.

터미널에 표시되는 `Local` 주소를 Ctrl 키와 함께 클릭한다. 개발 서버를 종료할 때는 터미널에서 `Ctrl+C`를 누른다. `node_modules`는 다시 만들 수 있고 매우 크므로 Git에 올리지 않는다.

## SOS 프로젝트 받기

이미 GitHub 저장소가 있다면 새 프로젝트를 생성하지 않고 복제한다.

```powershell
git clone https://github.com/사용자명/SOS.git
cd SOS
npm install
npm run dev
```

저장소 주소는 자신의 주소로 바꾼다. 이미 `C:\SOS` 폴더가 있다면 다시 복제하지 않는다. 그 폴더에서 `npm install`만 실행한다.

## 현재 프로젝트의 차이

SOS는 일반 `react-ts` 템플릿에 라우팅과 서버 기능이 더해진 TanStack Start 프로젝트다. `vite.config.ts`에는 `tanstackStart`, `nitro`, React, Tailwind CSS 플러그인이 등록되어 있다. 개발 서버 포트는 8080으로 지정되어 있다.

```ts
server: {
  host: "0.0.0.0",
  port: 8080,
}
```

`0.0.0.0`은 같은 네트워크의 다른 기기에서도 접속할 수 있게 모든 네트워크 인터페이스에서 요청을 받겠다는 뜻이다. 공공 네트워크에서는 방화벽 허용 범위를 조심한다.

## 실습 점검표

- [ ] Node와 npm 버전이 출력된다.
- [ ] 프로젝트 폴더에서 `package.json`이 보인다.
- [ ] `npm install`이 끝났다.
- [ ] `npm run dev` 후 브라우저가 열린다.
- [ ] 서버를 `Ctrl+C`로 종료할 수 있다.

