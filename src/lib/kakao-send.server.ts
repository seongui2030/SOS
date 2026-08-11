/** 카카오 REST(Message) API 호출 – 서버 전용 */

export type Receiver = { name: string; relation: string; uuid?: string | null };
export type SendResult = { name: string; relation: string; channel: "friend" | "memo"; ok: boolean; error?: string };

const KAPI = "https://kapi.kakao.com";

function templateObject(message: string, mapUrl?: string | null) {
  const link = mapUrl ? { mobile_web_url: mapUrl, web_url: mapUrl } : {};
  return {
    object_type: "text",
    text: message.slice(0, 200),
    link,
    button_title: mapUrl ? "위치 지도 보기" : undefined,
  };
}

async function post(path: string, accessToken: string, body: URLSearchParams) {
  const res = await fetch(`${KAPI}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body,
  });
  const text = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, text };
}

/** 나에게 보내기 (권한만 있으면 항상 가능) */
export async function sendMemo(accessToken: string, message: string, mapUrl?: string | null) {
  return post(
    "/v2/api/talk/memo/default/send",
    accessToken,
    new URLSearchParams({ template_object: JSON.stringify(templateObject(message, mapUrl)) }),
  );
}

/** 친구에게 보내기 (uuid 필요) */
export async function sendToFriends(
  accessToken: string,
  uuids: string[],
  message: string,
  mapUrl?: string | null,
) {
  return post(
    "/v1/api/talk/friends/message/default/send",
    accessToken,
    new URLSearchParams({
      receiver_uuids: JSON.stringify(uuids),
      template_object: JSON.stringify(templateObject(message, mapUrl)),
    }),
  );
}

/** 등록된 다수 수신자에게 동시 전송. uuid가 없는 수신자는 나에게 보내기로 대체 안내됩니다. */
export async function broadcastEmergency(opts: {
  accessToken: string;
  receivers: Receiver[];
  message: string;
  mapUrl?: string | null;
}): Promise<SendResult[]> {
  const { accessToken, receivers, message, mapUrl } = opts;
  const withUuid = receivers.filter((r) => r.uuid);
  const withoutUuid = receivers.filter((r) => !r.uuid);
  const results: SendResult[] = [];

  await Promise.all(
    withUuid.map(async (r) => {
      const res = await sendToFriends(accessToken, [r.uuid as string], message, mapUrl);
      results.push({
        name: r.name,
        relation: r.relation,
        channel: "friend",
        ok: res.ok,
        error: res.ok ? undefined : `${res.status} ${res.text}`.slice(0, 300),
      });
    }),
  );

  if (withoutUuid.length > 0) {
    const summary = `${message}\n\n(카카오 친구 연결이 없는 수신자: ${withoutUuid
      .map((r) => `${r.relation} ${r.name}`)
      .join(", ")} — 직접 연락이 필요합니다.)`;
    const res = await sendMemo(accessToken, summary, mapUrl);
    for (const r of withoutUuid) {
      results.push({
        name: r.name,
        relation: r.relation,
        channel: "memo",
        ok: res.ok,
        error: res.ok ? undefined : `${res.status} ${res.text}`.slice(0, 300),
      });
    }
  }

  return results;
}
