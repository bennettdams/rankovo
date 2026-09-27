import { describe, expect, test } from "bun:test";
import { sessionForRender } from "./auth-client";

describe(sessionForRender.name, () => {
  test("uses the server session while the initial client query is pending", () => {
    const initialSession = { user: { id: "server-user" } };

    expect(
      sessionForRender({
        initialSession,
        data: null,
        isPending: true,
        isRefetching: false,
      }),
    ).toBe(initialSession);
  });

  test("uses live session data during a refetch", () => {
    const liveSession = { user: { id: "live-user" } };

    expect(
      sessionForRender({
        initialSession: { user: { id: "server-user" } },
        data: liveSession,
        isPending: true,
        isRefetching: true,
      }),
    ).toBe(liveSession);
  });
});
