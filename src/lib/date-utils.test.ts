import { describe, expect, test } from "bun:test";
import { formatDateTime } from "./date-utils";

const localAfternoon = new Date(2021, 10, 25, 15, 34, 12);

describe(`${formatDateTime.name}`, () => {
  test("formats calendar dates for de and en", () => {
    expect(formatDateTime(localAfternoon, "YYYY-MM-DD", "de")).toBe(
      "25.11.2021",
    );
    expect(formatDateTime(localAfternoon, "YYYY-MM-DD", "en")).toBe(
      "11/25/2021",
    );
    expect(formatDateTime(localAfternoon, "MM-DD", "de")).toBe("25.11.");
  });

  test("formats 24-hour times", () => {
    expect(formatDateTime(localAfternoon, "hh:mm", "de")).toBe("15:34");
    expect(formatDateTime(localAfternoon, "hh:mm:ss", "de")).toBe("15:34:12");
  });

  test("combines date and time", () => {
    expect(formatDateTime(localAfternoon, "YYYY-MM-DD hh:mm", "de")).toBe(
      "25.11.2021 15:34",
    );
  });

  test("prints the local calendar day as YYYY-MM-DD in UTC form", () => {
    expect(formatDateTime(localAfternoon, "UTC YYYY-MM-DD")).toBe("2021-11-25");
  });
});
