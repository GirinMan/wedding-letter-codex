function localDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function rsvpPromptStorageKey(slug: string) {
  return `wedding:rsvp-welcome:${slug}`;
}

export function shouldShowRsvpWelcomePrompt(dismissedDay: string | null, today = new Date()) {
  return dismissedDay !== localDayKey(today);
}

export function dismissRsvpWelcomePromptForToday(today = new Date()) {
  return localDayKey(today);
}
