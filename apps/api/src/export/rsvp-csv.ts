export interface RsvpCsvRow {
  createdAt: Date | string;
  attending: boolean;
  party: "partnerOne" | "partnerTwo";
  name: string;
  phone: string;
  additionalGuests: number;
  meal: "yes" | "no" | "undecided" | null;
  shuttle: "yes" | "no" | "undecided" | null;
  note: string;
}

const headers = [
  "접수일",
  "참석 여부",
  "구분",
  "이름",
  "대표 연락처",
  "총 인원",
  "추가 인원",
  "식사",
  "셔틀",
  "메모",
];

const mealLabels: Record<NonNullable<RsvpCsvRow["meal"]>, string> = {
  yes: "식사함",
  no: "식사 안 함",
  undecided: "미정",
};

const shuttleLabels: Record<NonNullable<RsvpCsvRow["shuttle"]>, string> = {
  yes: "이용함",
  no: "이용 안 함",
  undecided: "미정",
};

function protectSpreadsheetFormula(value: string): string {
  return /^[\t\r ]*[=+\-@]/.test(value) ? `'${value}` : value;
}

function escapeCsvCell(value: string | number): string {
  const protectedValue = protectSpreadsheetFormula(String(value));
  return /[",\r\n]/.test(protectedValue)
    ? `"${protectedValue.replaceAll("\"", "\"\"")}"`
    : protectedValue;
}

function createCsvRow(values: Array<string | number>): string {
  return values.map(escapeCsvCell).join(",");
}

export function createRsvpCsv(rows: RsvpCsvRow[]): string {
  const csvRows = [
    createCsvRow(headers),
    ...rows.map((row) => createCsvRow([
      new Date(row.createdAt).toISOString(),
      row.attending ? "참석" : "불참",
      row.party === "partnerOne" ? "신랑 측" : "신부 측",
      row.name,
      row.phone,
      row.additionalGuests + 1,
      row.additionalGuests,
      row.meal ? mealLabels[row.meal] : "미수집",
      row.shuttle ? shuttleLabels[row.shuttle] : "미수집",
      row.note,
    ])),
  ];

  return `\uFEFF${csvRows.join("\r\n")}\r\n`;
}
