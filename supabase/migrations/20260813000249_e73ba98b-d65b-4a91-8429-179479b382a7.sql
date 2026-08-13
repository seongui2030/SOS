-- 1) 익명(anon) 역할의 접근 권한 회수: 비상 주소록은 로그인 사용자 전용
REVOKE ALL ON public.emergency_contacts FROM anon;
REVOKE ALL ON public.emergency_alerts FROM anon;
REVOKE ALL ON public.healths FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;
GRANT SELECT, INSERT ON public.emergency_alerts TO authenticated;
GRANT ALL ON public.emergency_alerts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.healths TO authenticated;
GRANT ALL ON public.healths TO service_role;

-- 2) 소유자 자동 지정 및 필수값 검증
ALTER TABLE public.emergency_contacts
  ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.emergency_contacts
  ADD CONSTRAINT emergency_contacts_name_not_blank CHECK (length(btrim(name)) > 0),
  ADD CONSTRAINT emergency_contacts_relation_not_blank CHECK (length(btrim(relation)) > 0);

-- 3) 비상 연락처: 명령별 RLS 정책으로 재정의
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own contacts" ON public.emergency_contacts;

CREATE POLICY "contacts_select_own"
  ON public.emergency_contacts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "contacts_insert_own"
  ON public.emergency_contacts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_update_own"
  ON public.emergency_contacts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_delete_own"
  ON public.emergency_contacts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 4) 응급 알림 기록: 본인 기록만 열람/추가
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users insert own alerts" ON public.emergency_alerts;
DROP POLICY IF EXISTS "Users read own alerts" ON public.emergency_alerts;

CREATE POLICY "alerts_select_own"
  ON public.emergency_alerts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "alerts_insert_own"
  ON public.emergency_alerts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5) 건강 기록: public 역할 대상 정책을 authenticated 전용으로 정리
ALTER TABLE public.healths ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own health data" ON public.healths;

CREATE POLICY "healths_manage_own"
  ON public.healths FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
