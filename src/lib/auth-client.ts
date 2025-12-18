import { assertAuthRole } from "@/data/static";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
// client only because redirect after sign up (to "Welcome" page) via `newUserCallbackURL` uses relative path
import "client-only";
import type { auth } from "./auth-server";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
  sessionOptions: {
    refetchInterval: 0,
    refetchOnWindowFocus: false,
    refetchWhenOffline: false,
  },
  fetchOptions: {
    onError: async (context) => {
      const { response } = context;
      if (response.status === 429) {
        const retryAfter = response.headers.get("X-Retry-After");
        console.error(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
      }
    },
  },
});

export async function signIn() {
  const res = await authClient.signIn.social({
    provider: "google",
    requestSignUp: true,
    newUserCallbackURL: "/welcome",
  });

  if (res.error) {
    console.error("Error signing in:", res.error);
    throw new Error("Sign in failed. Please try again");
  }

  console.debug("Sign in successful:", res.data);
}

export async function signOut() {
  const res = await authClient.signOut();

  if (res.error) {
    console.error("Error signing out:", res.error);
    throw new Error("Sign out failed. Please try again");
  }

  console.debug("Sign out successful:", res.data);
}

export function useUserAuth() {
  const { data, error, isPending, refetch } = authClient.useSession();

  if (isPending) {
    return {
      state: "pending",
      id: null,
      username: null,
      role: null,
      refetch,
    } as const;
  } else if (error) {
    console.error("Error fetching user session:", error);
    return {
      state: "error",
      id: null,
      username: null,
      role: null,
      refetch,
    } as const;
  } else if (!data) {
    return {
      state: "no-data",
      id: null,
      username: null,
      role: null,
      refetch,
    } as const;
  } else {
    const role = data.user.role;
    assertAuthRole(role);

    return {
      state: "authenticated",
      id: data.user.id,
      username: data.user.name,
      role,
      refetch,
    } as const;
  }
}
