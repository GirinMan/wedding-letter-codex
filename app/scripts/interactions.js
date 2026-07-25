import { accountClipboardValue } from "./lib/content.js";

async function writeClipboard(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard copy failed");
}

function createToastController() {
  const toast = document.querySelector("#toast");
  let timer;

  return (message) => {
    window.clearTimeout(timer);
    toast.textContent = message;
    toast.hidden = false;
    timer = window.setTimeout(() => {
      toast.hidden = true;
    }, 2200);
  };
}

function installAccountCopy(invitation, notify) {
  document.querySelector("#account-list").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-account-index]");
    if (!button) return;

    const account = invitation.accounts[Number(button.dataset.accountIndex)];
    try {
      await writeClipboard(accountClipboardValue(account));
      navigator.vibrate?.(15);
      notify(`${account.owner} 계좌번호를 복사했습니다.`);
    } catch {
      notify("복사하지 못했습니다. 계좌번호를 직접 선택해 주세요.");
    }
  });
}

function installShare(invitation, notify) {
  document.querySelector("#share-button").addEventListener("click", async () => {
    const url = invitation.meta.canonicalUrl || window.location.href;
    const shareData = {
      title: invitation.meta.title,
      text: invitation.meta.description,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await writeClipboard(url);
      notify("청첩장 주소를 복사했습니다.");
    } catch (error) {
      if (error?.name !== "AbortError") {
        notify("공유하지 못했습니다. 주소를 직접 복사해 주세요.");
      }
    }
  });
}

function installGallery(gallery) {
  if (gallery.length === 0) return;

  const dialog = document.querySelector("#gallery-dialog");
  const image = document.querySelector("#gallery-dialog-image");
  const position = document.querySelector("#gallery-dialog-position");
  let currentIndex = 0;
  let opener = null;

  const show = (index) => {
    currentIndex = (index + gallery.length) % gallery.length;
    const current = gallery[currentIndex];
    image.src = current.src;
    image.alt = current.alt;
    image.width = current.width;
    image.height = current.height;
    position.textContent = `${currentIndex + 1} / ${gallery.length}`;
  };

  document.querySelector("#gallery-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-gallery-index]");
    if (!button) return;
    opener = button;
    show(Number(button.dataset.galleryIndex));
    dialog.showModal();
  });

  document.querySelector("#gallery-previous").addEventListener("click", () => {
    show(currentIndex - 1);
  });
  document.querySelector("#gallery-next").addEventListener("click", () => {
    show(currentIndex + 1);
  });
  document.querySelector("#gallery-close").addEventListener("click", () => {
    dialog.close();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => opener?.focus());
}

function installMusic(invitation, notify) {
  if (!invitation.features.music || !invitation.music.enabled) return;

  const button = document.querySelector("#music-button");
  const audio = document.querySelector("#background-music");

  button.addEventListener("click", async () => {
    if (audio.paused) {
      try {
        await audio.play();
        button.textContent = "음악 끄기";
        button.setAttribute("aria-label", `${invitation.music.title || "배경 음악"} 일시정지`);
      } catch {
        notify("음악을 재생하지 못했습니다.");
      }
      return;
    }

    audio.pause();
    button.textContent = "음악 켜기";
    button.setAttribute("aria-label", `${invitation.music.title || "배경 음악"} 재생`);
  });
}

export function installInteractions(invitation, state) {
  const notify = createToastController();
  installAccountCopy(invitation, notify);
  installShare(invitation, notify);
  installGallery(state.gallery);
  installMusic(invitation, notify);
}
