import assert from "node:assert/strict";
import test from "node:test";

import { createKakaoSharePayload } from "../src/kakao-share.ts";
import * as kakaoShareModule from "../src/kakao-share.ts";

test("Kakao feed payload keeps the public invitation URL in every link target", () => {
  const pageUrl = "https://wedding.example.com/our-wedding";
  const payload = createKakaoSharePayload({
    title: "신랑 이름 · 신부 이름 결혼식",
    description: "소중한 분들을 초대합니다.",
    imageUrl: "https://wedding.example.com/api/media/greeting/content",
    pageUrl,
  });

  assert.deepEqual(payload, {
    objectType: "feed",
    content: {
      title: "신랑 이름 · 신부 이름 결혼식",
      description: "소중한 분들을 초대합니다.",
      imageUrl: "https://wedding.example.com/api/media/greeting/content",
      link: { mobileWebUrl: pageUrl, webUrl: pageUrl },
    },
    buttons: [{
      title: "청첩장 보기",
      link: { mobileWebUrl: pageUrl, webUrl: pageUrl },
    }],
  });
});

test("Kakao feed payload uses the bundled botanical image by default", () => {
  const pageUrl = "https://wedding.example.com/our-wedding";
  const payload = createKakaoSharePayload({
    title: "신랑 이름 · 신부 이름 결혼식",
    description: "소중한 분들을 초대합니다.",
    imageUrl: "",
    pageUrl,
  });

  assert.equal(
    payload.content.imageUrl,
    "https://wedding.example.com/assets/botanical-kakao-share.jpg",
  );
});

test("Kakao sharing is available with a JavaScript key before media is uploaded", () => {
  const isKakaoShareAvailable = (
    kakaoShareModule as unknown as Record<string, unknown>
  ).isKakaoShareAvailable;

  assert.equal(typeof isKakaoShareAvailable, "function");
  if (typeof isKakaoShareAvailable !== "function") return;

  assert.equal(isKakaoShareAvailable(""), false);
  assert.equal(isKakaoShareAvailable("   "), false);
  assert.equal(isKakaoShareAvailable("javascript-key"), true);
});

test("the primary share CTA identifies KakaoTalk when a key is configured", () => {
  const getPrimarySharePresentation = (
    kakaoShareModule as unknown as Record<string, unknown>
  ).getPrimarySharePresentation;

  assert.equal(typeof getPrimarySharePresentation, "function");
  if (typeof getPrimarySharePresentation !== "function") return;

  assert.deepEqual(getPrimarySharePresentation(""), {
    provider: "generic",
    label: "초대장 공유하기",
  });
  assert.deepEqual(getPrimarySharePresentation("javascript-key"), {
    provider: "kakao",
    label: "카카오톡으로 공유하기",
  });
});

test("the closing section keeps generic sharing beside KakaoTalk sharing", () => {
  const getClosingSharePresentations = (
    kakaoShareModule as unknown as Record<string, unknown>
  ).getClosingSharePresentations;

  assert.equal(typeof getClosingSharePresentations, "function");
  if (typeof getClosingSharePresentations !== "function") return;

  assert.deepEqual(getClosingSharePresentations(""), [
    { provider: "generic", label: "초대장 공유하기" },
  ]);
  assert.deepEqual(getClosingSharePresentations("javascript-key"), [
    { provider: "kakao", label: "카카오톡으로 공유하기" },
    { provider: "generic", label: "다른 방법으로 공유하기" },
  ]);
});
