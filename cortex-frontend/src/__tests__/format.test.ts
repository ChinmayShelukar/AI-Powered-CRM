import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { formatCurrency, formatCurrencyFull, getInitials, formatRelativeTime } from "@/lib/format";

// Scenario: SC-001 — formatCurrency — compact notation
// Requirement: numbers ≥ 1M → "$XM", ≥ 10k → "$Xk", else full with commas
describe("formatCurrency", () => {
  it("formats millions with one decimal when fractional", () => {
    expect(formatCurrency(1_500_000)).toBe("$1.5M");
  });

  it("formats exact millions without decimal", () => {
    expect(formatCurrency(2_000_000)).toBe("$2M");
  });

  it("formats ten-thousands as rounded k", () => {
    expect(formatCurrency(25_000)).toBe("$25k");
  });

  it("formats 9999 as full dollar amount", () => {
    expect(formatCurrency(9_999)).toBe("$9,999");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0");
  });

  it("handles null gracefully", () => {
    expect(formatCurrency(null)).toBe("$0");
  });

  it("handles undefined gracefully", () => {
    expect(formatCurrency(undefined)).toBe("$0");
  });

  it("formats exactly 10000 as $10k", () => {
    expect(formatCurrency(10_000)).toBe("$10k");
  });
});

// Scenario: SC-002 — formatCurrencyFull — always full locale format
describe("formatCurrencyFull", () => {
  it("formats large number with commas", () => {
    expect(formatCurrencyFull(1_234_567)).toBe("$1,234,567");
  });

  it("formats zero", () => {
    expect(formatCurrencyFull(0)).toBe("$0");
  });

  it("handles null", () => {
    expect(formatCurrencyFull(null)).toBe("$0");
  });

  it("truncates decimals", () => {
    expect(formatCurrencyFull(1234.99)).toBe("$1,235");
  });
});

// Scenario: SC-003 — getInitials — name to 2-letter monogram
describe("getInitials", () => {
  it("extracts two initials from full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("uses only first two words for three-word names", () => {
    expect(getInitials("Mary Jane Watson")).toBe("MJ");
  });

  it("returns single letter for single-word name", () => {
    expect(getInitials("Madonna")).toBe("M");
  });

  it("returns ? for empty string", () => {
    expect(getInitials("")).toBe("?");
  });

  it("returns ? for null", () => {
    expect(getInitials(null)).toBe("?");
  });

  it("returns ? for undefined", () => {
    expect(getInitials(undefined)).toBe("?");
  });

  it("uppercases initials", () => {
    expect(getInitials("alice bob")).toBe("AB");
  });

  it("handles extra whitespace between names", () => {
    expect(getInitials("  Jane   Smith  ")).toBe("JS");
  });
});

// Scenario: SC-004 — formatRelativeTime — time-relative display
describe("formatRelativeTime", () => {
  beforeEach(() => {
    // Freeze time so relative assertions are deterministic
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns em dash for null", () => {
    expect(formatRelativeTime(null)).toBe("—");
  });

  it("returns em dash for undefined", () => {
    expect(formatRelativeTime(undefined)).toBe("—");
  });

  it("returns 'just now' for a time 30 seconds ago", () => {
    expect(formatRelativeTime("2026-06-15T11:59:30Z")).toBe("just now");
  });

  it("returns minutes ago for 5 minutes ago", () => {
    const result = formatRelativeTime("2026-06-15T11:55:00Z");
    expect(result).toMatch(/minute/);
  });

  it("returns hours ago for 3 hours ago", () => {
    const result = formatRelativeTime("2026-06-15T09:00:00Z");
    expect(result).toMatch(/hour/);
  });

  it("returns days ago for 3 days ago", () => {
    const result = formatRelativeTime("2026-06-12T12:00:00Z");
    expect(result).toMatch(/day/);
  });

  it("returns weeks ago for 2 weeks ago", () => {
    const result = formatRelativeTime("2026-06-01T12:00:00Z");
    expect(result).toMatch(/week/);
  });
});
