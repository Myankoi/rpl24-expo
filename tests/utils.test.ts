import { describe, expect, it } from "vitest";
import { isValidHttpUrl, slugify } from "@/lib/utils";

describe("project input utilities", () => {
  it("creates stable URL-safe slugs", () => {
    expect(slugify("  Aplikasi Kelas Pintar! ")).toBe("aplikasi-kelas-pintar");
    expect(slugify("Café & Data")).toBe("cafe-data");
  });

  it("accepts empty optional links but rejects unsafe protocols", () => {
    expect(isValidHttpUrl("")).toBe(true);
    expect(isValidHttpUrl("https://example.com/demo")).toBe(true);
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
  });
});
