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
