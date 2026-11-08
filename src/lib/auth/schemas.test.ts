import { describe, expect, it } from "vitest";
import { friendlyAuthError } from "./messages";
import { loginSchema, resetPasswordSchema, signupSchema } from "./schemas";

describe("loginSchema", () => {
  it("trims and lowercases the email", () => {
    const result = loginSchema.safeParse({ email: "  Me@Example.COM ", password: "x" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("me@example.com");
  });

  it("rejects a bad email and an empty password", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("signupSchema", () => {
  const valid = { name: "Asha", email: "asha@example.com", password: "longenough1" };

  it("accepts a valid sign-up", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a name and a password of at least 8 characters", () => {
    expect(signupSchema.safeParse({ ...valid, name: "  " }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, password: "short" }).success).toBe(false);
  });

  it("limits the password to 72 characters", () => {
    expect(signupSchema.safeParse({ ...valid, password: "a".repeat(73) }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, password: "a".repeat(72) }).success).toBe(true);
  });
});

describe("resetPasswordSchema", () => {
  it("requires both passwords to match", () => {
    const result = resetPasswordSchema.safeParse({
      password: "longenough1",
      confirm: "different1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirm"]);
    }
  });

  it("accepts matching passwords", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "longenough1", confirm: "longenough1" }).success,
    ).toBe(true);
  });
});

describe("friendlyAuthError", () => {
  it("explains wrong credentials", () => {
    expect(friendlyAuthError({ message: "Invalid login credentials" })).toMatch(/do not match/);
  });

  it("explains an unconfirmed email", () => {
    expect(friendlyAuthError({ code: "email_not_confirmed" })).toMatch(/Confirm your email/);
  });

  it("falls back to a generic message", () => {
    expect(friendlyAuthError({ message: "weird upstream failure" })).toMatch(
      /Something went wrong/,
    );
  });
});
