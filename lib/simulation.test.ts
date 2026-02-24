import { describe, expect, it } from "vitest";
import { simulateQuarter, validateDecisionInput } from "./simulation";

describe("validateDecisionInput", () => {
  it("accepts valid decision payload", () => {
    expect(
      validateDecisionInput({
        price: 1000,
        newEngineers: 2,
        newSales: 1,
        salaryPct: 100
      })
    ).toBeNull();
  });

  it("rejects negative hires", () => {
    expect(
      validateDecisionInput({
        price: 1000,
        newEngineers: -1,
        newSales: 0,
        salaryPct: 100
      })
    ).toBe("Engineers to hire must be a non-negative integer.");
  });

  it("rejects out-of-range salary percent", () => {
    expect(
      validateDecisionInput({
        price: 1000,
        newEngineers: 0,
        newSales: 0,
        salaryPct: 20
      })
    ).toBe("Salary percentage must be between 50 and 300.");
  });
});

describe("simulateQuarter", () => {
  it("matches expected baseline quarter math", () => {
    const result = simulateQuarter(
      {
        cash: 1_000_000,
        engineers: 4,
        salesStaff: 2,
        quality: 50,
        year: 1,
        quarter: 1
      },
      {
        price: 1000,
        newEngineers: 0,
        newSales: 0,
        salaryPct: 100
      }
    );

    expect(result.revenue).toBe(519000);
    expect(result.netIncome).toBe(339000);
    expect(result.cash).toBe(1339000);
    expect(result.quality).toBe(52);
    expect(result.nextYear).toBe(1);
    expect(result.nextQuarter).toBe(2);
    expect(result.status).toBe("ongoing");
  });

  it("applies hiring cost after net income", () => {
    const result = simulateQuarter(
      {
        cash: 1_000_000,
        engineers: 4,
        salesStaff: 2,
        quality: 50,
        year: 1,
        quarter: 1
      },
      {
        price: 1000,
        newEngineers: 2,
        newSales: 1,
        salaryPct: 100
      }
    );

    expect(result.netIncome).toBe(339000);
    expect(result.cash).toBe(1324000);
    expect(result.engineers).toBe(6);
    expect(result.salesStaff).toBe(3);
  });

  it("caps quality at 100", () => {
    const result = simulateQuarter(
      {
        cash: 2_000_000,
        engineers: 30,
        salesStaff: 3,
        quality: 95,
        year: 3,
        quarter: 2
      },
      {
        price: 1000,
        newEngineers: 0,
        newSales: 0,
        salaryPct: 100
      }
    );

    expect(result.quality).toBe(100);
  });

  it("rolls quarter 4 to next year quarter 1", () => {
    const result = simulateQuarter(
      {
        cash: 1_200_000,
        engineers: 5,
        salesStaff: 3,
        quality: 60,
        year: 1,
        quarter: 4
      },
      {
        price: 1000,
        newEngineers: 0,
        newSales: 0,
        salaryPct: 100
      }
    );

    expect(result.completedYear).toBe(1);
    expect(result.completedQuarter).toBe(4);
    expect(result.nextYear).toBe(2);
    expect(result.nextQuarter).toBe(1);
  });

  it("returns lost state when cash is zero or below", () => {
    const result = simulateQuarter(
      {
        cash: 1000,
        engineers: 4,
        salesStaff: 2,
        quality: 50,
        year: 2,
        quarter: 1
      },
      {
        price: 1,
        newEngineers: 0,
        newSales: 0,
        salaryPct: 300
      }
    );

    expect(result.cash).toBeLessThanOrEqual(0);
    expect(result.status).toBe("lost");
    expect(result.isOver).toBe(true);
  });

  it("returns won state at year 10 with positive cash", () => {
    const result = simulateQuarter(
      {
        cash: 5_000_000,
        engineers: 6,
        salesStaff: 4,
        quality: 90,
        year: 9,
        quarter: 4
      },
      {
        price: 500,
        newEngineers: 0,
        newSales: 0,
        salaryPct: 100
      }
    );

    expect(result.nextYear).toBe(10);
    expect(result.cash).toBeGreaterThan(0);
    expect(result.status).toBe("won");
    expect(result.isOver).toBe(true);
  });
});
