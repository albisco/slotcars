import { describe, it, expect } from "vitest";
import { formatTime } from "@/lib/format";

describe("formatTime", () => {
  it("formats sub-second times", () => {
    expect(formatTime(423)).toBe("0.423s");
  });

  it("formats times under a minute", () => {
    expect(formatTime(5423)).toBe("5.423s");
  });

  it("formats exact seconds", () => {
    expect(formatTime(3000)).toBe("3.000s");
  });

  it("formats times over a minute", () => {
    expect(formatTime(65432)).toBe("1:05.432");
  });

  it("pads seconds with leading zero", () => {
    expect(formatTime(62100)).toBe("1:02.100");
  });

  it("returns dash for negative values", () => {
    expect(formatTime(-1)).toBe("—");
  });

  it("formats zero", () => {
    expect(formatTime(0)).toBe("0.000s");
  });
});
