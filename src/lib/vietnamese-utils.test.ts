import { describe, it, expect } from "vitest";
import { removeVietnameseDiacritics } from "@/lib/vietnamese-utils";

describe("vietnamese-utils", () => {
  it("removes diacritics correctly", () => {
    expect(removeVietnameseDiacritics("Nguyễn Văn An")).toBe("NGUYEN VAN AN");
    expect(removeVietnameseDiacritics("Trần Thị Hồng")).toBe("TRAN THI HONG");
  });

  it("handles Đ character", () => {
    expect(removeVietnameseDiacritics("Đặng Phước Thịnh")).toBe("DANG PHUOC THINH");
  });

  it("handles empty input", () => {
    expect(removeVietnameseDiacritics("")).toBe("");
  });
});
