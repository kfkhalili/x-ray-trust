import { normalizeHandle } from "@/lib/handle";

describe("normalizeHandle", () => {
  it("strips a leading @", () => {
    expect(normalizeHandle("@jack")).toBe("jack");
  });

  it("strips multiple leading @", () => {
    expect(normalizeHandle("@@@jack")).toBe("jack");
  });

  it("lowercases (X handles are case-insensitive)", () => {
    expect(normalizeHandle("ElonMusk")).toBe("elonmusk");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeHandle("  jack  ")).toBe("jack");
  });

  it("applies all rules together", () => {
    expect(normalizeHandle("  @@Jack ")).toBe("jack");
  });

  it("leaves an already-clean handle unchanged", () => {
    expect(normalizeHandle("jack")).toBe("jack");
  });

  it("returns empty string for blank input", () => {
    expect(normalizeHandle("   ")).toBe("");
    expect(normalizeHandle("@")).toBe("");
  });
});
