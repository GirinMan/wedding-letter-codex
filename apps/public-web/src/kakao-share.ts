export interface KakaoSharePayloadInput {
  title: string;
  description: string;
  imageUrl: string;
  pageUrl: string;
}

export interface KakaoSharePayload {
  objectType: "feed";
  content: {
    title: string;
    description: string;
    imageUrl: string;
    link: { mobileWebUrl: string; webUrl: string };
  };
  buttons: Array<{
    title: string;
    link: { mobileWebUrl: string; webUrl: string };
  }>;
}

interface KakaoSdk {
  isInitialized: () => boolean;
  init: (javascriptKey: string) => void;
  Share: { sendDefault: (payload: KakaoSharePayload) => void };
}

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

const kakaoSdkUrl = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js";
let kakaoSdkRequest: Promise<KakaoSdk> | null = null;

export function createKakaoSharePayload({
  title,
  description,
  imageUrl,
  pageUrl,
}: KakaoSharePayloadInput): KakaoSharePayload {
  const link = { mobileWebUrl: pageUrl, webUrl: pageUrl };
  return {
    objectType: "feed",
    content: { title, description, imageUrl, link },
    buttons: [{ title: "청첩장 보기", link }],
  };
}

function loadKakaoSdk() {
  if (window.Kakao) return Promise.resolve(window.Kakao);
  if (kakaoSdkRequest) return kakaoSdkRequest;

  kakaoSdkRequest = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = kakaoSdkUrl;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      if (window.Kakao) {
        resolve(window.Kakao);
        return;
      }

      kakaoSdkRequest = null;
      reject(new Error("Kakao SDK loaded without a global API."));
    };
    script.onerror = () => {
      kakaoSdkRequest = null;
      reject(new Error("Kakao SDK could not be loaded."));
    };
    document.head.append(script);
  });
  return kakaoSdkRequest;
}

export async function sendKakaoShare({
  javascriptKey,
  payload,
}: {
  javascriptKey: string;
  payload: KakaoSharePayload;
}) {
  const sdk = await loadKakaoSdk();
  if (!sdk.isInitialized()) sdk.init(javascriptKey);
  sdk.Share.sendDefault(payload);
}
