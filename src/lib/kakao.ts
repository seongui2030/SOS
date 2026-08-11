/** 카카오 JavaScript SDK 로더 및 로그인/공유 헬퍼 (클라이언트 전용) */

export const KAKAO_JS_KEY = "06cc2aaf22022bd20f8e654a6213dd43";

type KakaoSDK = {
  isInitialized: () => boolean;
  init: (key: string) => void;
  Auth: {
    login: (opts: {
      scope?: string;
      success: (res: { access_token: string }) => void;
      fail: (err: unknown) => void;
    }) => void;
    authorize: (opts: { redirectUri: string; scope?: string }) => void;
    getAccessToken: () => string | null;
  };
  Share: {
    sendDefault: (settings: Record<string, unknown>) => void;
  };
};

declare global {
  interface Window {
    Kakao?: KakaoSDK;
  }
}

const SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";

let loading: Promise<KakaoSDK> | null = null;

export function loadKakao(): Promise<KakaoSDK> {
  if (typeof window === "undefined") return Promise.reject(new Error("browser only"));
  if (window.Kakao?.isInitialized?.()) return Promise.resolve(window.Kakao);
  if (loading) return loading;

  loading = new Promise<KakaoSDK>((resolve, reject) => {
    const finish = () => {
      const sdk = window.Kakao;
      if (!sdk) {
        reject(new Error("카카오 SDK를 불러오지 못했습니다."));
        return;
      }
      if (!sdk.isInitialized()) sdk.init(KAKAO_JS_KEY);
      resolve(sdk);
    };

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_URL}"]`);
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      if (window.Kakao) finish();
      return;
    }

    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = finish;
    script.onerror = () => reject(new Error("카카오 SDK 로딩에 실패했습니다."));
    document.head.appendChild(script);
  }).catch((error) => {
    loading = null;
    throw error;
  });

  return loading;
}

/** 카카오 로그인 후 메시지 전송 권한이 있는 access token을 반환합니다. */
export async function kakaoLogin(): Promise<string> {
  const sdk = await loadKakao();
  const existing = sdk.Auth.getAccessToken();
  if (existing) return existing;
  return new Promise<string>((resolve, reject) => {
    sdk.Auth.login({
      scope: "talk_message,friends,profile_nickname",
      success: (res) => resolve(res.access_token),
      fail: () => reject(new Error("카카오 로그인이 취소되었거나 실패했습니다.")),
    });
  });
}

/** 카카오톡 공유창을 열어 수신자를 직접 선택해 보내는 예비 수단 */
export async function kakaoShareFallback(text: string, mapUrl?: string | null) {
  const sdk = await loadKakao();
  const link = mapUrl
    ? { mobileWebUrl: mapUrl, webUrl: mapUrl }
    : { mobileWebUrl: window.location.origin, webUrl: window.location.origin };
  sdk.Share.sendDefault({
    objectType: "text",
    text: text.slice(0, 190),
    link,
    buttonTitle: "위치 지도 보기",
  });
}
