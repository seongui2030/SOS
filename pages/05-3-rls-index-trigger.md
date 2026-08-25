# 05-3. RLS·인덱스·트리거

## RLS 켜기

```sql
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
```

RLS를 켠 뒤 정책이 없으면 일반 클라이언트는 보통 데이터에 접근하지 못한다. 먼저 정책을 설계하고 앱의 읽기·쓰기를 시험한다.

```sql
CREATE POLICY "Users manage own conversations"
ON public.conversations
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

- `TO authenticated`: 로그인한 사용자 대상
- `USING`: 기존 행을 읽거나 수정·삭제 대상으로 고를 수 있는 조건
- `WITH CHECK`: 새로 추가하거나 수정한 행이 만족해야 하는 조건
- `auth.uid()`: 현재 로그인 사용자의 UUID

명령별 정책은 더 분명하게 권한을 제한한다.

```sql
CREATE POLICY "alerts_select_own"
ON public.emergency_alerts FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "alerts_insert_own"
ON public.emergency_alerts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
```

이 경우 사용자는 자기 알림을 조회·추가하지만 수정·삭제는 하지 못한다.

## 인덱스

책의 찾아보기처럼 검색 위치를 빠르게 찾게 한다.

```sql
CREATE INDEX conversations_user_updated_idx
ON public.conversations (user_id, updated_at DESC);
```

사용자별 최신 대화를 찾는 질의에 맞는다. 모든 열에 인덱스를 만들면 저장할 때마다 인덱스도 갱신되어 느려지고 공간을 쓴다. 실제 자주 쓰는 조건과 정렬에 맞춰 만든다.

## 트리거

트리거는 특정 사건이 일어나면 자동 실행되는 DB 규칙이다.

```sql
CREATE OR REPLACE FUNCTION public.touch_conversation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER messages_touch_conversation
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.touch_conversation();
```

새 메시지가 생기면 해당 대화의 수정 시각을 바꾼다. 앱의 모든 입력 경로에서 같은 규칙이 적용되는 장점이 있다. 잘못 만든 트리거는 숨어서 많은 변경을 일으킬 수 있으므로 함수와 실행 시점을 문서화한다.

## RLS 점검

Supabase Dashboard의 Database → Policies 또는 Table Editor의 Policies에서 확인한다. 여섯 테이블 모두 RLS가 Enabled인지, 정책 대상이 `authenticated`인지, 소유권 식이 맞는지 본다.

시험 계정 A와 B를 만들어 다음을 검증한다.

- A가 만든 대화를 A가 읽을 수 있다.
- B는 A의 대화를 읽을 수 없다.
- A가 `user_id`를 B로 속여 추가할 수 없다.
- 로그아웃 사용자는 건강·긴급 데이터에 접근할 수 없다.

서비스 역할 키로 시험하면 RLS를 우회할 수 있으므로 브라우저 publishable key와 실제 로그인 세션으로 시험한다.

