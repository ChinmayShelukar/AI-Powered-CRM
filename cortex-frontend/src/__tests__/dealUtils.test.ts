import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { companyChipClass, companyInitial, dealPriority, emptyColumnCopy, formatCloseDate } from "@/components/deals/dealUtils";
import type { Deal, DealStage } from "@/types/api";

// Scenario: SC-010 — companyInitial
describe("companyInitial", () => {
  it("returns first letter uppercased", () => {
    expect(companyInitial("acme")).toBe("A");
  });

  it("returns middle dot for null", () => {
    expect(companyInitial(null)).toBe("·");
  });

  it("returns middle dot for empty string", () => {
    expect(companyInitial("")).toBe("·");
  });

  it("returns middle dot for whitespace-only", () => {
    expect(companyInitial("   ")).toBe("·");
  });
});

// Scenario: SC-011 — companyChipClass — deterministic hash-based palette
describe("companyChipClass", () => {
  it("returns a non-empty CSS class string", () => {
    expect(companyChipClass("Acme Corp")).toBeTruthy();
  });

  it("returns same class for same input (deterministic)", () => {
    expect(companyChipClass("Acme Corp")).toBe(companyChipClass("Acme Corp"));
  });

  it("returns a value from the palette (contains bg-)", () => {
    expect(companyChipClass("test")).toContain("bg-");
  });

  it("returns first palette entry for null/undefined", () => {
    const nullResult = companyChipClass(null);
    const undefinedResult = companyChipClass(undefined);
    expect(nullResult).toBeTruthy();
    expect(undefinedResult).toBe(nullResult);
  });
});

// Scenario: SC-012 — dealPriority — date + value-based urgency
const baseDeal: Deal = {
  id: 1,
  title: "Test Deal",
  value: 10_000,
  stage: "PROSPECT",
  closeDate: null,
  contactId: null,
  contactName: null,
  assignedToUserId: null,
  assignedToUserName: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("dealPriority", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when no close date and value < 50k", () => {
    expect(dealPriority({ ...baseDeal, closeDate: null, value: 10_000 })).toBeNull();
  });

  it("returns 'high' for value >= 50k with no close date", () => {
    expect(dealPriority({ ...baseDeal, value: 50_000 })).toBe("high");
  });

  it("returns 'soon' when close date is within 7 days", () => {
    expect(dealPriority({ ...baseDeal, closeDate: "2026-06-20T00:00:00Z", value: 5_000 })).toBe("soon");
  });

  it("returns 'overdue' when close date is in the past", () => {
    expect(dealPriority({ ...baseDeal, closeDate: "2026-06-01T00:00:00Z", value: 5_000 })).toBe("overdue");
  });

  it("returns null for WON deal even with past close date (closed = no urgency)", () => {
    expect(dealPriority({ ...baseDeal, stage: "WON", closeDate: "2026-06-01T00:00:00Z", value: 5_000 })).toBeNull();
  });

  it("returns null for LOST deal even with past close date", () => {
    expect(dealPriority({ ...baseDeal, stage: "LOST", closeDate: "2026-06-01T00:00:00Z", value: 5_000 })).toBeNull();
  });
});

// Scenario: SC-013 — emptyColumnCopy — all DealStage values covered
describe("emptyColumnCopy", () => {
  const STAGES: DealStage[] = ["PROSPECT", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];

  it.each(STAGES)("returns non-empty string for stage %s", (stage) => {
    expect(emptyColumnCopy(stage).length).toBeGreaterThan(0);
  });

  it("returns distinct copy per stage", () => {
    const copies = STAGES.map(emptyColumnCopy);
    const unique = new Set(copies);
    expect(unique.size).toBe(STAGES.length);
  });
});

// Scenario: SC-014 — formatCloseDate
describe("formatCloseDate", () => {
  it("formats ISO date to short locale string", () => {
    const result = formatCloseDate("2026-07-04T00:00:00Z");
    // en-US short: "Jul 4" or "Jul 4" — contains month and day
    expect(result).toMatch(/Jul/);
    expect(result).toMatch(/4/);
  });

  it("returns null for null input", () => {
    expect(formatCloseDate(null)).toBeNull();
  });
});
