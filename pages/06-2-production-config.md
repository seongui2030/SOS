## 06-2. 운영 환경변수와 OAuth 주소

### Vercel 환경변수

Project Settings → Environment Variables에서 Key와 Value를 분리해 입력한다.

| 이름 | 권장 유형 | 용도 |
|---|---|---|
| `VITE_SUPABASE_URL` | Config | 브라우저 Supabase URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Config | 브라우저 공개 키 |
| `SUPABASE_URL` | Secret 또는 Config | 서버 Supabase URL |
| `SUPABASE_PUBLISHABLE_KEY` | Secret | 서버 공개 키 사용 |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | 서버 전용 관리 권한 |
| `VITE_KAKAO_JS_KEY` | Config | 브라우저 Kakao JavaScript 키 |
| `KAKAO_REST_API_KEY` | Secret | 서버 Kakao REST 키 |

환경 범위가 Production인지 Preview인지 확인한다. `A variable ... already exists for target production`은 같은 이름이 이미 있다는 뜻이므로 새로 만들지 말고 기존 값을 편집한다. `branch undefined` 문구가 보여도 핵심은 Production 범위의 중복이다.

저장 후 새 Production 배포를 실행한다. Vite의 `VITE_` 값은 빌드 결과에 들어가므로 재배포가 특히 중요하다. 브라우저에서는 Ctrl+Shift+R로 캐시를 무시하고 새로고침한다.

### 운영 주소 동기화 표

| 서비스 | 설정 |
|---|---|
| Vercel | 실제 Production 도메인 확인 |
| Supabase Site URL | `https://sos-nu-flame.vercel.app` |
| Supabase Redirect URLs | 운영 `/**`, 로컬 `/**` |
| Google 승인 원본 | 운영 원본, 로컬 원본 |
| Google redirect URI | Supabase callback |
| Kakao JS 도메인 | 실제 운영 원본 |

### 운영에서 환경변수 누락 오류가 날 때

브라우저 Console의 `Missing Supabase environment variable(s)`는 빌드 때 VITE 변수를 못 읽었다는 뜻이다. 변수 목록에 이름이 보이는 것만으로 충분하지 않다.

1. 이름 철자와 밑줄을 비교한다.
2. Production 범위인지 확인한다.
3. Value가 빈 값이 아닌지 다시 입력한다.
4. URL과 key가 같은 Supabase 프로젝트인지 확인한다.
5. 캐시 없이 새 Production 배포를 만든다.
6. 새 배포가 연결된 도메인인지 확인한다.

### 배포 보안 점검

- service role key가 `VITE_`로 시작하지 않는다.
- `.env.local`은 Git에 없다.
- 공개된 비밀은 회전했다.
- RLS가 모든 개인 데이터 테이블에 켜져 있다.
- Preview 도메인을 OAuth에 허용할지 정책적으로 결정했다.
- 서버 오류 응답에 비밀 값이나 내부 스택 전체를 노출하지 않는다.

