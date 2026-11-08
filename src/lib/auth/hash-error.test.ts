import { describe, expect, it } from "vitest";
import { describeAuthLinkProblem, parseAuthHashError } from "./hash-error";

describe("parseAuthHashError", () => {
  it("reads the error code from a Supabase failure address", () => {
    const hash =
      "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired";
    expect(parseAuthHashError(hash)).toEqual({ code: "otp_expired" });
  });

  it("falls back to the error field when there is no code", () => {
    expect(parseAuthHashError("#error=access_denied")).toEqual({ code: "access_denied" });
  });

  it("works without the leading #", () => {
    expect(parseAuthHashError("error_code=otp_expired")).toEqual({ code: "otp_expired" });
  });

  it("returns null when there is no error", () => {
    expect(parseAuthHashError("")).toBeNull();
    expect(parseAuthHashError("#section-2")).toBeNull();
  });
});

describe("describeAuthLinkProblem", () => {
  it("explains an expired or used link and mentions signing in", () => {
    const text = describeAuthLinkProblem({ code: "otp_expired" });
    expect(text).toMatch(/already used/);
    expect(text).toMatch(/sign in/);
  });

  it("has a generic message for other problems", () => {
    expect(describeAuthLinkProblem({ code: "something_else" })).toMatch(/did not work/);
  });
});
