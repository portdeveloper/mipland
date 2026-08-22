import { describe, expect, it } from "vitest";
import { formatChatError } from "./chat-error";

describe("formatChatError", () => {
  it("formats 429 rate limit JSON response correctly", () => {
    const error = new Error('{"error": "Too many requests. Try again in a minute."}');
    const result = formatChatError(error);
    expect(result.message).toBe("Too many requests. Try again in a minute.");
    expect(result.isRateLimit).toBe(true);
  });

  it("formats 403 bot check JSON response correctly", () => {
    const error = new Error('{"error": "Access denied."}');
    const result = formatChatError(error);
    expect(result.message).toBe("Access denied.");
    expect(result.isRateLimit).toBe(false);
  });

  it("handles string rate limit errors", () => {
    const error = new Error("HTTP 429: Too Many Requests");
    const result = formatChatError(error);
    expect(result.isRateLimit).toBe(true);
    expect(result.message).toContain("Too many requests");
  });

  it("handles network failure errors", () => {
    const error = new TypeError("Failed to fetch");
    const result = formatChatError(error);
    expect(result.message).toContain("Connection failed");
    expect(result.isRateLimit).toBe(false);
  });

  it("handles empty or null error", () => {
    const result = formatChatError(null);
    expect(result.message).toBe("An unknown error occurred. Please try again.");
    expect(result.isRateLimit).toBe(false);
  });

  it("handles plain custom error messages", () => {
    const error = new Error("Service temporarily unavailable");
    const result = formatChatError(error);
    expect(result.message).toBe("Service temporarily unavailable");
    expect(result.isRateLimit).toBe(false);
  });
});
