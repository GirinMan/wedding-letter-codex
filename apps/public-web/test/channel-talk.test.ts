import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { bootChannelTalk } from "../src/channel-talk.ts";

test("ChannelTalk boot is queued before the SDK finishes loading", () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const script = {
    async: false,
    src: "",
    dataset: {} as DOMStringMap,
    addEventListener: () => undefined,
  };

  Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      querySelector: () => null,
      createElement: () => script,
      head: { append: () => undefined },
    },
  });

  try {
    bootChannelTalk({ enabled: true, pluginKey: "plugin-key" });

    assert.ok(window.ChannelIO);
    assert.deepEqual([...window.ChannelIO.q![0]!], [
      "boot",
      { pluginKey: "plugin-key", language: "ko" },
    ]);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument);
    else Reflect.deleteProperty(globalThis, "document");
  }
});

test("ChannelTalk-enabled invitations reserve launcher space for the quick menu stack", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(
    app,
    /data-channel-talk=\{channelTalkEnabled \? "enabled" : "disabled"\}/,
  );
  assert.match(
    styles,
    /\.page-shell\[data-channel-talk="enabled"\] \.floating-menu-button\s*\{[^}]*bottom:\s*96px;/s,
  );
  assert.match(
    styles,
    /\.page-shell\[data-channel-talk="enabled"\] \.celebration-button\s*\{[^}]*bottom:\s*152px;/s,
  );
});
