import {
  calculateDday,
  formatDdayDescription,
  formatDdayLabel,
  formatWeddingDate,
} from "./lib/date.js";
import { isNonEmptyString, sectionEnabled } from "./lib/content.js";

function query(selector) {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
}

function setText(selector, value) {
  query(selector).textContent = value;
}

function setSectionVisibility(id, visible) {
  query(id).hidden = !visible;
}

function createLink(label, href, className = "button button--secondary") {
  const link = document.createElement("a");
  link.className = className;
  link.href = href;
  link.textContent = label;
  return link;
}

function sideLabel(side) {
  return side === "partner1" ? "신랑측" : "신부측";
}

function renderContacts(invitation) {
  const visible =
    sectionEnabled(invitation, "contacts") &&
    invitation.hosts.some((host) => isNonEmptyString(host.phone));
  setSectionVisibility("#contacts", visible);
  if (!visible) return;

  const list = query("#contact-list");
  list.replaceChildren();

  for (const host of invitation.hosts.filter((item) => isNonEmptyString(item.phone))) {
    const item = document.createElement("li");
    item.className = "contact-list__item";

    const identity = document.createElement("span");
    identity.textContent = `${sideLabel(host.side)} ${host.relationship} ${host.name}`;
    item.append(identity, createLink("전화하기", `tel:${host.phone.replace(/[^\d+]/g, "")}`));
    list.append(item);
  }
}

function renderAccounts(invitation) {
  const visible = sectionEnabled(invitation, "accounts", invitation.accounts);
  setSectionVisibility("#accounts", visible);
  if (!visible) return;

  const list = query("#account-list");
  list.replaceChildren();

  for (const [index, account] of invitation.accounts.entries()) {
    const item = document.createElement("li");
    item.className = "account-list__item";

    const summary = document.createElement("div");
    const owner = document.createElement("strong");
    owner.textContent = `${sideLabel(account.side)} · ${account.owner}`;
    const detail = document.createElement("span");
    detail.textContent = `${account.bank} ${account.number} (${account.holder})`;
    summary.append(owner, detail);

    const button = document.createElement("button");
    button.className = "button button--secondary";
    button.type = "button";
    button.dataset.accountIndex = String(index);
    button.textContent = "계좌 복사";
    button.setAttribute("aria-label", `${account.owner} 계좌번호 복사`);

    item.append(summary, button);
    list.append(item);
  }
}

function renderGallery(invitation) {
  const visible = sectionEnabled(invitation, "gallery", invitation.gallery);
  setSectionVisibility("#gallery", visible);
  if (!visible) return [];

  const list = query("#gallery-list");
  list.replaceChildren();

  invitation.gallery.forEach((image, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.className = "gallery__button";
    button.type = "button";
    button.dataset.galleryIndex = String(index);
    button.setAttribute("aria-label", `${index + 1}번째 사진 크게 보기`);

    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.alt;
    img.width = image.width;
    img.height = image.height;
    img.loading = index === 0 ? "eager" : "lazy";

    button.append(img);
    item.append(button);
    list.append(item);
  });

  return invitation.gallery;
}

function renderOptionalActions(invitation) {
  const venueLink = query("#venue-link");
  venueLink.hidden = !isNonEmptyString(invitation.event.mapUrl);
  if (!venueLink.hidden) venueLink.href = invitation.event.mapUrl;

  const rsvpVisible =
    sectionEnabled(invitation, "rsvp") &&
    invitation.rsvp.enabled &&
    isNonEmptyString(invitation.rsvp.url);
  setSectionVisibility("#rsvp", rsvpVisible);
  if (rsvpVisible) {
    const link = query("#rsvp-link");
    link.href = invitation.rsvp.url;
    if (isNonEmptyString(invitation.rsvp.deadline)) {
      setText("#rsvp-deadline", `${invitation.rsvp.deadline}까지 알려주세요.`);
    }
  }

  query("#share-button").hidden = !invitation.features.share;

  const musicVisible =
    invitation.features.music &&
    invitation.music.enabled &&
    isNonEmptyString(invitation.music.src);
  query("#music-button").hidden = !musicVisible;
  const audio = query("#background-music");
  if (musicVisible) {
    audio.src = invitation.music.src;
    query("#music-button").setAttribute(
      "aria-label",
      `${invitation.music.title || "배경 음악"} 재생`,
    );
  }
}

export function renderInvitation(invitation) {
  document.title = invitation.meta.title;
  query('meta[name="description"]').content = invitation.meta.description;

  setText("#partner1-name", invitation.couple.partner1.name);
  setText("#partner2-name", invitation.couple.partner2.name);
  setText("#footer-partner1", invitation.couple.partner1.name);
  setText("#footer-partner2", invitation.couple.partner2.name);
  setText("#headline", invitation.copy.headline);
  setText("#greeting-copy", invitation.copy.greeting);
  setText("#closing-copy", invitation.copy.closing);
  setText("#event-date", formatWeddingDate(invitation.event.date, invitation.event.time));
  setText("#hero-venue-name", invitation.event.venueName);
  setText("#venue-name", invitation.event.venueName);
  setText("#venue-hall", invitation.event.hall);
  setText("#venue-address", invitation.event.address);

  const days = calculateDday(
    invitation.event.date,
    new Date(),
    invitation.event.timezone,
  );
  setSectionVisibility("#countdown", invitation.features.countdown);
  setText("#dday-label", formatDdayLabel(days));
  setText("#dday-description", formatDdayDescription(days));

  renderContacts(invitation);
  renderAccounts(invitation);
  const gallery = renderGallery(invitation);
  renderOptionalActions(invitation);

  return { gallery };
}
