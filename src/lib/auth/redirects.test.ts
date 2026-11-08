import { describe, expect, it } from "vitest";
import { safeNextPath } from "./redirects";

describe("safeNextPath", () => {
  it("keeps plain in-app paths", () => {
    expect(safeNextPath("/app")).toBe("/app");
    expect(safeNextPath("/app/food?day=2026-11-08")).toBe("/app/food?day=2026-11-08");
  });

  it("falls back when nothing is given", () => {
    expect(safeNextPath(null)).toBe("/app");
    expect(safeNextPath(undefined)).toBe("/app");
    expect(safeNextPath("")).toBe("/app");
  });

  it("uses a custom fallback", () => {
    expect(safeNextPath(null, "/home")).toBe("/home");
  });

  it("blocks absolute URLs and protocol-relative URLs", () => {
    expect(safeNextPath("https://evil.example/steal")).toBe("/app");
    expect(safeNextPath("//evil.example")).toBe("/app");
    expect(safeNextPath("javascript:alert(1)")).toBe("/app");
  });

  it("blocks backslash and control character tricks", () => {
    expect(safeNextPath("/\\evil.example")).toBe("/app");
    expect(safeNextPath("/app\n/evil")).toBe("/app");
  });

  it("blocks paths that do not start with a slash", () => {
    expect(safeNextPath("app")).toBe("/app");
  });
});
