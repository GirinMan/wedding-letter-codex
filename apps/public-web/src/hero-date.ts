export interface HeroDate {
  weekday: string;
  month: string;
  day: string;
  ordinal: string;
  time: string;
}

function ordinalFor(day: number) {
  const remainder = day % 100;
  if (remainder >= 11 && remainder <= 13) return "TH";
  switch (day % 10) {
    case 1: return "ST";
    case 2: return "ND";
    case 3: return "RD";
    default: return "TH";
  }
}

export function formatHeroDate(startsAt: string, timezone: string): HeroDate {
  const instant = new Date(startsAt);
  const options = { timeZone: timezone };
  const day = new Intl.DateTimeFormat("en-US", { ...options, day: "numeric" }).format(instant);
  const time = new Intl.DateTimeFormat("en-US", {
    ...options,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(instant).replace(":", " : ");

  return {
    weekday: new Intl.DateTimeFormat("en-US", { ...options, weekday: "long" }).format(instant).toUpperCase(),
    month: new Intl.DateTimeFormat("en-US", { ...options, month: "long" }).format(instant).toUpperCase(),
    day,
    ordinal: ordinalFor(Number(day)),
    time,
  };
}
