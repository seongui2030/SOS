## 테이블 생성

```sql
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '새 대화',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

`NOT NULL`은 반드시 값이 있어야 한다. `DEFAULT`는 생략했을 때 넣을 값이다. `REFERENCES`는 존재하는 Auth 사용자만 소유자가 될 수 있게 한다. `ON DELETE CASCADE`는 부모 사용자가 지워지면 연결 행도 정리한다.

## 제약 조건

```sql
role text NOT NULL CHECK (role IN ('user', 'assistant'))
```

CHECK는 잘못된 역할 문자열을 DB 단계에서 막는다. 화면 검사는 우회될 수 있지만 DB 제약은 모든 입력 경로에 적용된다.

```sql
ADD CONSTRAINT contacts_name_not_blank
CHECK (length(btrim(name)) > 0);
```

`btrim`으로 앞뒤 공백을 지운 길이가 0보다 커야 한다.

## 권한 부여

```sql
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.conversations TO authenticated;
```

GRANT는 로그인 역할이 어떤 명령 종류를 시도할 수 있는지 정한다. 그 다음 RLS가 어느 행에 가능한지 더 세밀하게 판단한다. 두 단계 모두 통과해야 한다.

## SQL Editor와 마이그레이션 파일

SQL Editor에 붙여 실행하면 원격 DB는 즉시 바뀐다. `supabase/migrations/*.sql`은 변경 순서를 Git으로 보관하고 다른 환경에 재현하기 위한 파일이다.

| 방식 | 장점 | 주의점 |
|---|---|---|
| SQL Editor | 빠르고 GUI에서 결과 확인 | 실행 이력이 로컬 마이그레이션과 자동 동기화되지 않음 |
| CLI migration | 순서·팀 공유·재현에 유리 | 로그인·링크·네트워크 설정 필요 |

CLI가 실패해 SQL Editor로 실행했다면 나중에 `db push`를 무작정 실행하지 않는다. 이미 적용된 변경을 또 실행해 `already exists`가 날 수 있다. 원격 마이그레이션 이력을 확인하고 적용 상태를 맞춘다.

## 함수는 전체 문장으로 실행

```sql
CREATE OR REPLACE FUNCTION public.update_healths_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

첫 줄만 선택해 실행하면 함수 본문과 `LANGUAGE`가 전달되지 않아 `no language specified` 오류가 난다. SQL 문은 세미콜론까지 전체를 선택한다.

## 안전한 실행 순서

1. 현재 프로젝트와 스키마를 확인한다.
2. SQL을 읽고 삭제·변경 대상을 표시한다.
3. 개발 프로젝트에서 먼저 실행한다.
4. Table Editor와 Policies에서 결과를 확인한다.
5. 앱의 실제 CRUD를 시험한다.
6. 실행한 SQL을 Git 마이그레이션으로 기록한다.

