import { describe, expect, it } from "vitest";
import {
  decodeParam,
  encodeParam,
  mergeSearch,
  numberParam,
  enumParam,
} from "./url-state";

describe("numberParam decoding", () => {
  const bmax = numberParam({ min: 0, max: 2000, step: 10, fallback: 1200 });

  it("returns the fallback when the param is absent", () => {
    expect(decodeParam(bmax, null)).toBe(1200);
  });

  it("parses a valid integer", () => {
    expect(decodeParam(bmax, "900")).toBe(900);
  });

  it("returns the fallback for non-numeric input", () => {
    expect(decodeParam(bmax, "abc")).toBe(1200);
    expect(decodeParam(bmax, "")).toBe(1200);
    expect(decodeParam(bmax, "NaN")).toBe(1200);
    expect(decodeParam(bmax, "Infinity")).toBe(1200);
  });

  it("clamps values outside the range", () => {
    expect(decodeParam(bmax, "-50")).toBe(0);
    expect(decodeParam(bmax, "99999")).toBe(2000);
  });

  it("snaps to the nearest step", () => {
    expect(decodeParam(bmax, "1234")).toBe(1230);
    expect(decodeParam(bmax, "1235")).toBe(1240);
  });

  it("keeps fractional values when no step is given", () => {
    const v = numberParam({ min: 0, max: 1, fallback: 0.5 });
    expect(decodeParam(v, "0.25")).toBe(0.25);
  });
});

describe("enumParam decoding", () => {
  const ordering = enumParam({
    values: ["random", "pfo"],
    fallback: "random",
  });

  it("returns the fallback when the param is absent", () => {
    expect(decodeParam(ordering, null)).toBe("random");
  });

  it("accepts a listed value", () => {
    expect(decodeParam(ordering, "pfo")).toBe("pfo");
  });

  it("returns the fallback for an unlisted value", () => {
    expect(decodeParam(ordering, "evil")).toBe("random");
  });
});

describe("encoding", () => {
  const bmax = numberParam({ min: 0, max: 2000, step: 10, fallback: 1200 });
  const ordering = enumParam({
    values: ["random", "pfo"],
    fallback: "random",
  });

  it("omits the value equal to the fallback", () => {
    expect(encodeParam(bmax, 1200)).toBeNull();
    expect(encodeParam(ordering, "random")).toBeNull();
  });

  it("serializes a non-default number", () => {
    expect(encodeParam(bmax, 900)).toBe("900");
  });

  it("serializes a non-default enum value", () => {
    expect(encodeParam(ordering, "pfo")).toBe("pfo");
  });

  it("round-trips every encodable value", () => {
    for (const value of [0, 10, 900, 2000]) {
      const raw = encodeParam(bmax, value);
      expect(decodeParam(bmax, raw)).toBe(value);
    }
  });
});

describe("mergeSearch", () => {
  it("adds a param to an empty search string", () => {
    expect(mergeSearch("", { eq: "900" })).toBe("?eq=900");
  });

  it("replaces an existing param and preserves unrelated ones", () => {
    expect(mergeSearch("?eq=100&foo=bar", { eq: "900" })).toBe(
      "?eq=900&foo=bar",
    );
  });

  it("removes a param when the update is null", () => {
    expect(mergeSearch("?eq=900&foo=bar", { eq: null })).toBe("?foo=bar");
  });

  it("returns an empty string when nothing remains", () => {
    expect(mergeSearch("?eq=900", { eq: null })).toBe("");
  });
});
