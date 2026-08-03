export interface KakaoSharePayloadInput {
  title: string;
  description: string;
  imageUrl: string;
  pageUrl: string;
}

export interface KakaoShareDescriptionInput {
  startsAt: string;
  timezone: string;
  venueName: string;
  hall: string;
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

export const defaultKakaoShareImagePath = "/assets/botanical-kakao-share.jpg";

export function createKakaoShareDescription({
  startsAt,
  timezone,
  venueName,
  hall,
}: KakaoShareDescriptionInput) {
  const instant = new Date(startsAt);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) => (
    parts.find((part) => part.type === type)?.value ?? ""
  );
  const hour = Number(value("hour"));
  const minute = value("minute");
  const weekday = ({
    Sun: "일요일",
    Mon: "월요일",
    Tue: "화요일",
    Wed: "수요일",
    Thu: "목요일",
    Fri: "금요일",
    Sat: "토요일",
  } as Record<string, string>)[value("weekday")] ?? "";
  const hour12 = hour % 12 || 12;
  const dateAndTime = `${value("year")}년 ${value("month")}월 ${value("day")}일 ${weekday} ${hour < 12 ? "오전" : "오후"} ${hour12}시${minute === "00" ? "" : ` ${minute}분`}`;
  const venue = [venueName, hall].map((part) => part.trim()).filter(Boolean).join(" ");

  return [dateAndTime, venue].filter(Boolean).join("\n");
}

export function isKakaoShareAvailable(javascriptKey: string) {
  return Boolean(javascriptKey.trim());
}

export function getPrimarySharePresentation(javascriptKey: string) {
  return isKakaoShareAvailable(javascriptKey)
    ? { provider: "kakao" as const, label: "카카오톡으로 공유하기" }
    : { provider: "generic" as const, label: "초대장 공유하기" };
}

export function getClosingSharePresentations(javascriptKey: string) {
  const primary = getPrimarySharePresentation(javascriptKey);
  return primary.provider === "kakao"
    ? [
        primary,
        { provider: "generic" as const, label: "다른 방법으로 공유하기" },
      ]
    : [primary];
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
  const resolvedImageUrl = imageUrl || new URL(defaultKakaoShareImagePath, pageUrl).toString();
  return {
    objectType: "feed",
    content: { title, description, imageUrl: resolvedImageUrl, link },
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
