import assert from "node:assert/strict";
import test from "node:test";

import { createKakaoSharePayload } from "../src/kakao-share.ts";

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
