export interface ChannelTalkConfig {
  enabled: boolean;
  pluginKey: string;
}

interface ChannelIO {
  (command: "boot", options: { pluginKey: string; language: "ko" }): void;
  (command: "shutdown"): void;
  q?: IArguments[];
  c?: (...args: unknown[]) => void;
}

declare global {
  interface Window {
    ChannelIO?: ChannelIO;
  }
}

let loadPromise: Promise<void> | undefined;
let bootedPluginKey: string | undefined;

function getPluginKey(config: ChannelTalkConfig): string | undefined {
  const pluginKey = config.pluginKey.trim();
  return config.enabled && pluginKey ? pluginKey : undefined;
}

function loadSdk(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-channel-talk-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("ChannelTalk SDK failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://cdn.channel.io/plugin/ch-plugin-web.js";
    script.dataset.channelTalkSdk = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("ChannelTalk SDK failed to load.")), { once: true });
    document.head.append(script);
  });

  return loadPromise;
}

export function bootChannelTalk(config: ChannelTalkConfig): void {
  const pluginKey = getPluginKey(config);
  if (!pluginKey || typeof window === "undefined" || typeof document === "undefined") return;
  if (bootedPluginKey === pluginKey) return;

  void loadSdk().then(() => {
    if (bootedPluginKey === pluginKey || !window.ChannelIO) return;
    if (bootedPluginKey) window.ChannelIO("shutdown");
    window.ChannelIO("boot", { pluginKey, language: "ko" });
    bootedPluginKey = pluginKey;
  }).catch(() => undefined);
}
