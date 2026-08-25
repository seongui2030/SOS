## 학습 목표

- GitHub의 소스가 Vercel 빌드와 배포로 이어지는 과정을 설명한다.
- 로컬과 운영 환경변수 및 OAuth 주소를 구분한다.
- VS Code에서 Codex에게 안전하고 검증 가능한 방식으로 도움을 요청한다.

배포는 내 컴퓨터에서만 실행되던 프로그램을 인터넷 서버에 올리는 과정이다. SOS에서는 GitHub `main` 브랜치의 코드가 Vercel로 전달되고, Vercel이 패키지를 설치하고 빌드한 뒤 주소를 제공한다.

```text
로컬 수정 → 검사 → Git commit → GitHub push
                                  ↓
                         Vercel 빌드·배포
                                  ↓
                  운영 환경변수로 Supabase 연결
```

AI 도구 Codex는 이 과정에서 코드 설명, 오류 진단, 파일 수정, 검사를 도울 수 있다. 하지만 계정 비밀, 배포 권한, 삭제 판단의 책임자는 사용자다. 변경 전 범위를 말하고, 변경 후 diff와 테스트 결과를 확인하는 습관이 중요하다.

## 단원 결과물

- GitHub와 연결된 Vercel 프로젝트
- Production 환경변수
- 올바른 Supabase·Google OAuth 운영 주소
- VS Code Codex 확장 연결
- AI 작업 전후 검사 체크리스트

## 확인 문제

1. 로컬 `.env.local`이 Vercel에 자동 전달되지 않는 이유는 무엇인가?
2. Git push 전 실행할 검사를 세 가지 쓰시오.
3. AI가 수정한 코드를 사람이 검토해야 하는 이유는 무엇인가?

