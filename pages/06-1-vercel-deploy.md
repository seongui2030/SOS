## Git 상태 정리

```powershell
git status
git diff
npx tsc --noEmit
npm run build
```

`git status`에서 수정·삭제·새 파일을 확인한다. `.env.local`, `.vercel`, `node_modules`, `.output` 같은 로컬·생성 파일이 올라가지 않아야 한다. `git add -A`는 현재 저장소의 추가·수정·삭제를 모두 스테이징한다. `git add .`도 현재 위치 아래 변경을 추가하지만 작업 위치와 Git 버전에 따라 범위를 오해할 수 있으므로 상태 확인이 중요하다.

```powershell
git add -A
git status
git commit -m "Add authentication and deployment setup"
git push origin main
```

스테이징 후 다시 `git status`를 읽고 의도한 파일만 있는지 본다. 이미 원격에 공개한 커밋을 force push나 rebase로 다시 쓰지 않는다. 협업 기록과 연결 서비스의 동기화가 깨질 수 있다.

## Vercel New Project

1. Vercel에 로그인한다.
2. GitHub 저장소를 Import한다.
3. 프로젝트 이름과 Production 브랜치를 확인한다.
4. Application Preset 또는 Framework Preset에서 TanStack Start를 선택한다.
5. 환경변수를 입력한다.
6. Deploy를 실행한다.

현재 `vite.config.ts`는 Nitro의 Vercel preset을 사용한다.

```ts
nitro({
  preset: "vercel",
})
```

따라서 서버 라우트까지 Vercel 함수 형식으로 빌드할 수 있다. 빌드 로그의 `You can preview this build`는 빌드가 생성되었다는 안내이며 오류가 아니다.

## 배포 결과 확인

Vercel이 제공한 실제 도메인을 기록한다. 예제 프로젝트의 주소는 `https://sos-nu-flame.vercel.app`이다. 예전에 예상했던 다른 도메인을 Google, Supabase, Kakao에 등록해 두면 로그인 후 잘못된 곳으로 이동한다.

배포 후 다음을 시험한다.

- 첫 화면과 정적 아이콘이 열린다.
- 이메일 가입과 Google 로그인이 된다.
- 새 대화가 생성되고 새로고침 후 유지된다.
- API 요청이 500 없이 응답한다.
- 모바일 화면과 HTTPS 권한 요청이 작동한다.

## 실패 시 로그

Build Logs는 TypeScript, 패키지, 빌드 오류를 보여 준다. Runtime/Function Logs는 배포 후 API 500의 원인을 보여 준다. 브라우저 Network의 요청과 같은 시각의 서버 로그를 함께 본다.

