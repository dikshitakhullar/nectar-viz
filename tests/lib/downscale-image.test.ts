import { describe, it, expect } from "vitest";
import { scaledDimensions } from "@/lib/downscale-image";

describe("scaledDimensions", () => {
  it("shrinks a large landscape photo to fit the max dimension", () => {
    expect(scaledDimensions(4000, 3000, 1568)).toEqual({ width: 1568, height: 1176 });
  });

  it("shrinks a large portrait photo to fit the max dimension", () => {
    expect(scaledDimensions(3000, 4000, 1568)).toEqual({ width: 1176, height: 1568 });
  });

  it("shrinks a 24MP phone photo well under the limit", () => {
    const { width, height } = scaledDimensions(5712, 4284, 1568);
    expect(Math.max(width, height)).toBe(1568);
  });

  it("leaves an already-small image unchanged (never upscales)", () => {
    expect(scaledDimensions(1000, 800, 1568)).toEqual({ width: 1000, height: 800 });
  });

  it("leaves an image exactly at the limit unchanged", () => {
    expect(scaledDimensions(1568, 1568, 1568)).toEqual({ width: 1568, height: 1568 });
  });
});
