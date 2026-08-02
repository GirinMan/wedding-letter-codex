import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const accountGroups = [
  {
    id: "partner-one",
    label: "신랑 측",
    items: [
      { id: "groom-one", holder: "신랑", bank: "가은행", accountNumber: "111-111", paymentUrl: "" },
      { id: "groom-two", holder: "신랑 아버지", bank: "나은행", accountNumber: "222-222", paymentUrl: "https://pay.example.com/groom" },
    ],
  },
  {
    id: "partner-two",
    label: "신부 측",
    items: [
      { id: "bride-one", holder: "신부", bank: "다은행", accountNumber: "333-333", paymentUrl: "" },
    ],
  },
];

test("both families and every configured account render together", async () => {
  const accountModule = await import("../src/components/AccountGroups.tsx").catch(() => null);

  assert.ok(accountModule, "account groups component should exist");
  const html = renderToStaticMarkup(createElement(accountModule.AccountGroups, {
    groups: accountGroups,
    onCopy: () => undefined,
  }));

  assert.match(html, /신랑 측/);
  assert.match(html, /신부 측/);
  assert.match(html, /111-111/);
  assert.match(html, /222-222/);
  assert.match(html, /333-333/);
  assert.doesNotMatch(html, /aria-hidden="true"/);
  assert.doesNotMatch(html, /role="tab"/);
  assert.doesNotMatch(html, /이전 계좌|다음 계좌/);
});
