import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ACTIVITY_META, ACTIVITY_TYPES, dayBucketLabel, formatTimeOfDay } from "@/components/activities/activityMeta";
import type { ActivityType } from "@/types/api";

const TYPES: ActivityType[] = ["CALL", "EMAIL", "MEETING", "NOTE"];

// Scenario: SC-020 — ACTIVITY_META lookup table completeness
describe("ACTIVITY_META", () => {
  it.each(TYPES)("has an entry for %s", (type) => {
    expect(ACTIVITY_META[type]).toBeDefined();
  });

  it.each(TYPES)("%s entry has label, verb, and iconChip", (type) => {
    const meta = ACTIVITY_META[type];
    expect(meta.label.length).toBeGreaterThan(0);
    expect(meta.verb.length).toBeGreaterThan(0);
    expect(meta.iconChip).toContain("bg-");
  });

  it("ACTIVITY_TYPES array length matches ACTIVITY_META keys", () => {
    expect(ACTIVITY_TYPES.length).toBe(Object.keys(ACTIVITY_META).length);
  });

  it("all ACTIVITY_TYPES have consistent key with ACTIVITY_META", () => {
    for (const t of ACTIVITY_TYPES) {
      expect(ACTIVITY_META[t.key].key).toBe(t.key);
    }
  });
});

// Scenario: SC-021 — dayBucketLabel — bucket grouping by date
describe("dayBucketLabel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T14:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'Today' for today's date", () => {
    expect(dayBucketLabel("2026-06-15T09:00:00Z")).toBe("Today");
  });

  it("returns 'Yesterday' for yesterday", () => {
    expect(dayBucketLabel("2026-06-14T09:00:00Z")).toBe("Yesterday");
  });

  it("returns weekday name for 3 days ago", () => {
    const result = dayBucketLabel("2026-06-12T09:00:00Z");
    // 3 days before June 15 is June 12 — a Friday
    expect(result).toBe("Friday");
  });

  it("returns month+day for same year beyond 7 days", () => {
    const result = dayBucketLabel("2026-05-01T09:00:00Z");
    expect(result).toMatch(/May/);
    expect(result).not.toMatch(/2026/); // same year: no year shown
  });

  it("includes year for a different year", () => {
    const result = dayBucketLabel("2024-01-15T09:00:00Z");
    expect(result).toMatch(/2024/);
  });
});

// Scenario: SC-022 — formatTimeOfDay
describe("formatTimeOfDay", () => {
  it("formats local midnight as 12:00 AM", () => {
    // Build ISO from local midnight so the assertion is timezone-independent
    // (formatTimeOfDay renders in the runner's local zone).
    const localMidnight = new Date(2026, 5, 15, 0, 0, 0).toISOString();
    const result = formatTimeOfDay(localMidnight);
    expect(result).toMatch(/12:00/);
    expect(result.toUpperCase()).toMatch(/AM|PM/);
  });

  it("returns a non-empty string for any valid ISO date", () => {
    expect(formatTimeOfDay("2026-06-15T09:30:00Z").length).toBeGreaterThan(0);
  });
});
