export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function accountClipboardValue(account) {
  return [account.bank, account.number.replace(/\s+/g, ""), account.holder]
    .filter(isNonEmptyString)
    .join(" ");
}

export function hasPlaceholder(value) {
  return typeof value === "string" && /\[[^\]]+\]/.test(value);
}

export function sectionEnabled(invitation, feature, items = null) {
  if (!invitation.features[feature]) return false;
  if (Array.isArray(items)) return items.length > 0;
  return true;
}
