import {
  formatMonth,
  formatMonthRange,
  monthCount,
  previousMonth,
  seriesWindow,
  toMonthValue,
} from "../../../src/components/transactions/editRecurring/recurringMonths";

describe("recurringMonths", () => {
  describe("toMonthValue", () => {
    it("reads the UTC month of a Date", () => {
      expect(toMonthValue(new Date(Date.UTC(2026, 3, 15)))).toBe("2026-04");
    });

    it("reads the UTC month of an ISO string", () => {
      expect(toMonthValue("2026-04-15T00:00:00.000Z")).toBe("2026-04");
    });

    it("pads single-digit months", () => {
      expect(toMonthValue(new Date(Date.UTC(2026, 0, 1)))).toBe("2026-01");
    });
  });

  describe("previousMonth", () => {
    it("steps back within a year", () => {
      expect(previousMonth("2026-04")).toBe("2026-03");
    });

    it("rolls back across the year boundary", () => {
      expect(previousMonth("2026-01")).toBe("2025-12");
    });
  });

  describe("monthCount", () => {
    it("counts a single month as one", () => {
      expect(monthCount("2026-04", "2026-04")).toBe(1);
    });

    it("counts inclusively", () => {
      expect(monthCount("2026-01", "2026-03")).toBe(3);
    });

    it("counts across years", () => {
      expect(monthCount("2026-11", "2027-02")).toBe(4);
    });
  });

  describe("seriesWindow", () => {
    it("ends the window the month before the exclusive endDate", () => {
      expect(
        seriesWindow({
          startDate: new Date(Date.UTC(2026, 0, 1)),
          endDate: new Date(Date.UTC(2027, 0, 1)),
        }),
      ).toEqual({ first: "2026-01", last: "2026-12" });
    });

    it("has no upper bound for an open-ended rule", () => {
      expect(seriesWindow({ startDate: new Date(Date.UTC(2026, 0, 1)), endDate: null })).toEqual({
        first: "2026-01",
        last: null,
      });
    });
  });

  describe("formatMonth", () => {
    it("formats as abbreviated month and year in pt-BR", () => {
      expect(formatMonth("2026-04")).toBe("abr/2026");
    });
  });

  describe("formatMonthRange", () => {
    it("joins two months with a dash", () => {
      expect(formatMonthRange("2026-01", "2026-03")).toBe("jan/2026 — mar/2026");
    });

    it("renders a single month once", () => {
      expect(formatMonthRange("2026-03", "2026-03")).toBe("mar/2026");
    });

    it("renders an open-ended range", () => {
      expect(formatMonthRange("2026-04", null)).toBe("abr/2026 em diante");
    });
  });
});
