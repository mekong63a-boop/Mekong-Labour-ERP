import { describe, it, expect } from "vitest";
import { removeDiacritics, normalizeVietnamese } from "@/lib/vietnamese-utils";

describe("vietnamese-utils", () => {
  it("removes diacritics correctly", () => {
    expect(removeDiacritics("Nguyễn Văn An")).toBe("Nguyen Van An");
    expect(removeDiacritics("Trần Thị Hồng")).toBe("Tran Thi Hong");
  });

  it("normalizes Vietnamese text for search", () => {
    const normalized = normalizeVietnamese("Đặng Phước Thịnh");
    expect(normalized).not.toContain("ặ");
    expect(normalized).not.toContain("ướ");
    expect(normalized).not.toContain("ị");
  });

  it("handles empty/null input", () => {
    expect(removeDiacritics("")).toBe("");
  });
});
