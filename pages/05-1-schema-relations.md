# 05-1. 여섯 테이블과 관계

## 1. `public.users`

앱에서 사용할 프로필이다.

| 열 | 자료형 | 뜻 |
|---|---|---|
| `id` | uuid, PK/FK | `auth.users.id`와 같은 사용자 ID |
| `email` | text | 표시·연락용 이메일 |
| `display_name` | text | 화면 이름 |
| `created_at` | timestamptz | 생성 시각 |
| `updated_at` | timestamptz | 수정 시각 |

`id`는 기본 키이면서 Auth 사용자 외래 키다. Auth 사용자가 삭제되면 `ON DELETE CASCADE`로 프로필도 삭제된다.

## 2. `healths`

사용자의 신체 측정 기록이다. `height_cm`, `weight_kg`, `gender`, `age`, `bmi`, `bmr`를 갖는다. `user_id`로 소유자를 연결한다. 한 사용자가 시간에 따라 여러 건강 기록을 만들 수 있다.

BMI와 BMR은 계산 결과이므로 입력값과 함께 저장하면 조회가 빠르지만, 계산 공식이 바뀔 때 기존 값과 새 값의 의미가 달라질 수 있다. 공식 버전이나 측정 시각을 함께 관리하는 확장을 생각할 수 있다.

## 3. `conversations`

대화 묶음이다. `title`, `created_at`, `updated_at`을 갖고 `user_id`가 소유자를 나타낸다. 최근 대화를 찾기 위해 `(user_id, updated_at DESC)` 인덱스가 있다.

## 4. `messages`

대화 안의 한 문장이다. `conversation_id`로 대화와, `user_id`로 사용자와 연결된다. `role`은 `user` 또는 `assistant`만 허용된다. `emergency_keywords`는 감지된 긴급 단어 배열이다.

대화 삭제 시 그 안의 메시지는 `ON DELETE CASCADE`로 함께 삭제된다. 메시지를 추가하면 트리거가 대화의 `updated_at`을 갱신한다.

## 5. `emergency_contacts`

긴급 연락 대상이다. 이름, 관계, 전화번호, Kakao UUID, 활성 여부를 저장한다. 이름과 관계는 공백만 입력하지 못하도록 CHECK 제약이 추가되어 있다.

## 6. `emergency_alerts`

긴급 알림을 보낸 기록이다. 위도·경도, 지도 URL, 메시지, 수신자 수, 전송 결과 JSON을 보관한다. 일반 로그인 사용자는 자기 기록을 읽고 추가할 수 있지만 수정·삭제 권한은 주어지지 않았다. 감사 기록을 쉽게 바꾸지 못하게 하는 설계다.

## 관계의 수

```text
사용자 1 ─ N 건강 기록
사용자 1 ─ N 대화
대화   1 ─ N 메시지
사용자 1 ─ N 긴급 연락처
사용자 1 ─ N 긴급 알림
```

메시지에는 `conversation_id`와 `user_id`가 모두 있다. 조회와 RLS에는 편리하지만 두 값이 서로 모순되지 않게 앱과 DB 설계를 주의해야 한다. 더 엄격한 설계는 메시지의 대화 소유권을 정책에서 함께 확인할 수 있다.

## 설계 연습

약 복용 기록 테이블을 추가한다고 가정한다. 열 이름, 기본 키, 사용자 외래 키, 시간 열, RLS 조건을 표로 설계해 보자.

