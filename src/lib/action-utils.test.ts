import { describe, expect, test } from "bun:test";
import { getActionRootErrors, withCallbacks } from "./action-utils";

const successState = {
  status: "SUCCESS" as const,
  formState: { name: "Ada" },
  data: { id: 7 },
};

const errorStateWithRoot = {
  status: "ERROR" as const,
  formState: { name: "Ada" },
  rootErrors: ["Bitte anmelden"],
};

const errorStateWithFieldsOnly = {
  status: "ERROR" as const,
  formState: { name: "Ada" },
  errors: { name: ["Pflichtfeld"] },
};

type ReviewActionState = typeof successState | typeof errorStateWithRoot;

describe(`${getActionRootErrors.name}`, () => {
  test("returns undefined for null and SUCCESS", () => {
    expect(getActionRootErrors(null)).toBeUndefined();
    expect(getActionRootErrors(successState)).toBeUndefined();
  });

  test("returns root errors from an ERROR state", () => {
    expect(getActionRootErrors(errorStateWithRoot)).toEqual(["Bitte anmelden"]);
  });

  test("returns undefined when an ERROR state has only field errors", () => {
    expect(getActionRootErrors(errorStateWithFieldsOnly)).toBeUndefined();
  });
});

describe(`${withCallbacks.name}`, () => {
  test("returns the action result unchanged", async () => {
    const wrapped = withCallbacks(async () => successState);

    expect(await wrapped()).toBe(successState);
  });

  test("forwards arguments to the action", async () => {
    let received: unknown[] = [];
    const wrapped = withCallbacks(
      async (name: string, rating: number) => {
        received = [name, rating];
        return successState;
      },
      { onSuccess: () => undefined },
    );

    await wrapped("Cheeseburger", 8.5);
    expect(received).toEqual(["Cheeseburger", 8.5]);
  });

  test("calls onSuccess with the action data", async () => {
    let received: unknown;
    const wrapped = withCallbacks(async () => successState, {
      onSuccess: (data) => {
        received = data;
      },
    });

    await wrapped();
    expect(received).toEqual({ id: 7 });
  });

  test("does not call onError on SUCCESS", async () => {
    let errorCalled = false;
    const wrapped = withCallbacks(
      async (): Promise<ReviewActionState> => successState,
      {
        onSuccess: () => undefined,
        onError: () => {
          errorCalled = true;
        },
      },
    );

    await wrapped();
    expect(errorCalled).toBe(false);
  });

  test("calls onError with the error state", async () => {
    let received: unknown;
    const wrapped = withCallbacks(async () => errorStateWithRoot, {
      onError: (error) => {
        received = error;
      },
    });

    await wrapped();
    expect(received).toBe(errorStateWithRoot);
  });

  test("does not call onSuccess on ERROR", async () => {
    let successCalled = false;
    const wrapped = withCallbacks(
      async (): Promise<ReviewActionState> => errorStateWithRoot,
      {
        onSuccess: () => {
          successCalled = true;
        },
        onError: () => undefined,
      },
    );

    await wrapped();
    expect(successCalled).toBe(false);
  });

  test("does not throw when no callbacks are provided", async () => {
    const wrapped = withCallbacks(async () => successState);
    await expect(wrapped()).resolves.toBe(successState);

    const wrappedError = withCallbacks(async () => errorStateWithRoot);
    await expect(wrappedError()).resolves.toBe(errorStateWithRoot);
  });

  test("does not call callbacks when the action throws", async () => {
    let successCalled = false;
    let errorCalled = false;
    const wrapped = withCallbacks(
      async (): Promise<ReviewActionState> => {
        throw new Error("network");
      },
      {
        onSuccess: () => {
          successCalled = true;
        },
        onError: () => {
          errorCalled = true;
        },
      },
    );

    await expect(wrapped()).rejects.toThrow("network");
    expect(successCalled).toBe(false);
    expect(errorCalled).toBe(false);
  });
});
