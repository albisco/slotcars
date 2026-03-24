import { describe, it, expect } from "vitest";

// Test the detection logic in isolation (not the actual Prisma client creation)
function isNeonUrl(url: string) {
  return url.includes("neon.tech");
}

describe("isNeonUrl", () => {
  it("detects Neon pooler URL", () => {
    expect(isNeonUrl("postgresql://user:pass@ep-cool-name-123.ap-southeast-2.aws.neon.tech/slotcars?sslmode=require")).toBe(true);
  });

  it("detects Neon direct URL", () => {
    expect(isNeonUrl("postgresql://user:pass@ep-cool-name-123.neon.tech/slotcars")).toBe(true);
  });

  it("rejects local Postgres URL", () => {
    expect(isNeonUrl("postgresql://postgres:slotcars@localhost:5432/slotcars")).toBe(false);
  });

  it("rejects Docker Postgres URL", () => {
    expect(isNeonUrl("postgresql://postgres:pass@db:5432/slotcars")).toBe(false);
  });

  it("rejects other hosted Postgres", () => {
    expect(isNeonUrl("postgresql://user:pass@rds.amazonaws.com:5432/slotcars")).toBe(false);
  });
});
