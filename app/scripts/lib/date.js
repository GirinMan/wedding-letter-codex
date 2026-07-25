const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_IN_MS = 86_400_000;

function parseDateParts(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new TypeError(`Invalid ISO date: ${value}`);
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function parseTimeParts(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) {
    throw new TypeError(`Invalid 24-hour time: ${value}`);
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

function datePartsInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function toUtcDay({ year, month, day }) {
  return Date.UTC(year, month - 1, day);
}

export function formatWeddingDate(date, time) {
  const dateParts = parseDateParts(date);
  const timeParts = parseTimeParts(time);
  const weekday = WEEKDAYS[
    new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day)).getUTCDay()
  ];
  const period = timeParts.hour < 12 ? "오전" : "오후";
  const displayHour = timeParts.hour % 12 || 12;
  const minute = timeParts.minute === 0 ? "" : ` ${timeParts.minute}분`;

  return `${dateParts.year}년 ${dateParts.month}월 ${dateParts.day}일 ${weekday}요일 · ${period} ${displayHour}시${minute}`;
}

export function calculateDday(eventDate, now = new Date(), timeZone = "Asia/Seoul") {
  const eventParts = parseDateParts(eventDate);
  const todayParts = datePartsInTimeZone(now, timeZone);
  return Math.round((toUtcDay(eventParts) - toUtcDay(todayParts)) / DAY_IN_MS);
}

export function formatDdayLabel(days) {
  if (days === 0) return "오늘";
  return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
}

export function formatDdayDescription(days) {
  if (days === 0) return "오늘, 저희 두 사람이 결혼합니다.";
  if (days > 0) return `결혼식까지 ${days}일 남았습니다.`;
  return `결혼한 지 ${Math.abs(days)}일 되었습니다.`;
}
