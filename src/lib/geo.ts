export type Coords = { latitude: number; longitude: number; accuracy?: number };

/** 브라우저 Geolocation API로 현재 GPS 좌표를 가져옵니다. */
export function getCurrentCoords(timeoutMs = 12000): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("이 브라우저에서는 위치 확인을 지원하지 않습니다."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? "위치 권한이 거부되었습니다. 브라우저 설정에서 위치 접근을 허용해 주세요."
            : err.code === err.POSITION_UNAVAILABLE
              ? "현재 위치를 확인할 수 없습니다."
              : "위치 확인 시간이 초과되었습니다.";
        reject(new Error(message));
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );
  });
}

/** 카카오맵 지도 링크 (map.kakao.com/link/map/이름,위도,경도) */
export function kakaoMapUrl(coords: Coords, label = "환자 위치") {
  return `https://map.kakao.com/link/map/${encodeURIComponent(label)},${coords.latitude},${coords.longitude}`;
}

/** 카카오맵 길찾기 링크 */
export function kakaoMapRouteUrl(coords: Coords, label = "환자 위치") {
  return `https://map.kakao.com/link/to/${encodeURIComponent(label)},${coords.latitude},${coords.longitude}`;
}

export function buildEmergencyMessage(opts: {
  name?: string | null;
  coords?: Coords | null;
  mapUrl?: string | null;
  keywords?: string[];
}) {
  const who = opts.name?.trim() ? opts.name.trim() : "보호 대상자";
  const lines = [
    `🚨 [말벗 케어 응급 알림] ${who}님이 도움을 요청했습니다.`,
    opts.keywords?.length ? `감지된 상황: ${opts.keywords.join(", ")}` : null,
    opts.coords
      ? `현재 위치: 위도 ${opts.coords.latitude.toFixed(6)}, 경도 ${opts.coords.longitude.toFixed(6)}`
      : "현재 위치를 확인하지 못했습니다.",
    opts.mapUrl ? `카카오맵으로 위치 보기: ${opts.mapUrl}` : null,
    "즉시 연락을 시도하시고, 필요하면 119에 신고해 주세요.",
  ].filter(Boolean);
  return lines.join("\n");
}
