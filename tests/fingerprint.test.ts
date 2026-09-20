import { beforeEach, describe, expect, it } from "vitest";
import { hasVotedLocally, markAsVoted } from "@/lib/fingerprint";

describe("event-scoped voting state", () => {
  beforeEach(() => localStorage.clear());

  it("does not leak a vote between editions", () => {
    markAsVoted("rpl-expo-2026");
    expect(hasVotedLocally("rpl-expo-2026")).toBe(true);
    expect(hasVotedLocally("rpl-expo-2027")).toBe(false);
  });
});
