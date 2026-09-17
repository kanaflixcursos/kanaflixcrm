export function parseCsv(value: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    const next = value[index + 1];
    if (character === '"') {
      if (quoted && next === '"') { cell += '"'; index += 1; } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell); cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell); cell = "";
      if (row.some((item) => item.trim())) rows.push(row);
      row = [];
    } else cell += character;
  }
  if (cell || row.length) { row.push(cell); if (row.some((item) => item.trim())) rows.push(row); }
  if (!rows.length) return { headers: [], rows: [] };
  const headers = rows[0].map((header) => header.trim());
  return { headers, rows: rows.slice(1).map((items) => headers.map((_, index) => items[index]?.trim() ?? "")) };
}

export function normalizeCsvHeader(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
