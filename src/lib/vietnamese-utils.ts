/**
 * Remove Vietnamese diacritics from text
 * Converts: Nguyễn Văn Anh → NGUYEN VAN ANH
 */
export function removeVietnameseDiacritics(str: string): string {
  if (!str) return "";

  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase();
}

/**
 * Format date to Vietnamese format: DD/MM/YYYY
 * This function ensures consistent date display across the system
 * regardless of the user's PC regional settings
 */
export function formatVietnameseDate(dateStr: string | null): string {
  if (!dateStr) return "—";

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "—";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return "—";
  }
}

/**
 * Format date with time to Vietnamese format: DD/MM/YYYY HH:mm
 */
export function formatVietnameseDatetime(dateStr: string | null): string {
  if (!dateStr) return "—";

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "—";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return "—";
  }
}

/**
 * Format month/year to Vietnamese format: MM/YYYY
 * Used for partial-precision timelines like Education history.
 */
export function formatVietnameseMonthYear(
  month: number | string | null | undefined,
  year: number | string | null | undefined,
): string {
  if (!month || !year) return "—";
  const m = typeof month === "string" ? parseInt(month, 10) : month;
  const y = typeof year === "string" ? parseInt(year, 10) : year;
  if (!m || !y || Number.isNaN(m) || Number.isNaN(y)) return "—";
  if (m < 1 || m > 12) return "—";
  return `${String(m).padStart(2, "0")}/${y}`;
}

/**
 * Format a month/year range.
 * - If both ends exist: "MM/YYYY - MM/YYYY"
 * - If only start exists: "MM/YYYY"
 */
export function formatVietnameseMonthYearRange(args: {
  startMonth?: number | string | null;
  startYear?: number | string | null;
  endMonth?: number | string | null;
  endYear?: number | string | null;
}): string {
  const start = formatVietnameseMonthYear(args.startMonth ?? null, args.startYear ?? null);
  const end = formatVietnameseMonthYear(args.endMonth ?? null, args.endYear ?? null);

  if (start !== "—" && end !== "—") return `${start} - ${end}`;
  if (start !== "—") return start;
  return "—";
}

/**
 * Format date to Japanese format: 1997年04月13日
 */
export function formatJapaneseDate(dateStr: string | null): string {
  if (!dateStr) return "—";

  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}年${month}月${day}日`;
  } catch {
    return "—";
  }
}
