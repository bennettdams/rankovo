import { assertAuthRole, defaultRole, roles } from "@/data/static";
import {
  accountsTable,
  sessionsTable,
  usersTable,
  verificationsTable,
} from "@/db/db-schema";
import { db } from "@/db/drizzle-setup";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { parseSetCookieHeader, setSessionCookie } from "better-auth/cookies";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { createInternalContext } from "better-call";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { forbidden, unauthorized } from "next/navigation";
import { cache } from "react";
import "server-only";

export const auth = betterAuth({
  appName: "Rankovo",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      users: usersTable,
      sessions: sessionsTable,
      accounts: accountsTable,
      verifications: verificationsTable,
    },
    usePlural: true,
  }),
  user: {
    additionalFields: {
      role: {
        // convert readonly array to regular array
        type: [...roles],
        required: false,
        defaultValue: defaultRole,
        // When input is set to false, the field will be excluded from user input, preventing users from passing a value for it.
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          console.debug("Create user | Before hook", user);

          return {
            data: {
              ...user,
              name: await createTemporaryUsername(user.name, 1),
              role: defaultRole, // Explicitly set default role
            },
          };
        },
      },
    },
  },
  advanced: {
    cookiePrefix: "rankovo",
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      disableImplicitSignUp: true,
    },
  },
  emailAndPassword: {
    disableSignUp: true,
    enabled: false,
  },
  plugins: [nextCookies()], // According to the docs, nextCookies is supposed the last plugin in the array
});

/**
 * Create a Better Auth session for a seeded user without enabling the public
 * email/password HTTP API. Writes the session cookie via Next.js `cookies()`.
 *
 * Normal sign-in goes through `auth.api.signInEmail`, which needs
 * `emailAndPassword.enabled` and therefore registers `POST /api/auth/sign-in/email`.
 * We skip that endpoint: insert a session row ourselves, then copy the signed
 * `Set-Cookie` header into the Next.js cookie store the same way `nextCookies()`
 * does after a real `auth.api.*` call.
 */
export async function createDevLoginSession(userId: string): Promise<boolean> {
  // Adapter + cookie config (prefix `rankovo`, signing secret, max-age).
  const authContext = await auth.$context;
  const user = await authContext.internalAdapter.findUserById(userId);
  // Seeded ids live in `devUsers`; false means `bun run db:seed` was not run.
  if (!user) return false;

  // Session row only — no password check, no HTTP sign-in route.
  const session = await authContext.internalAdapter.createSession(userId);

  // `setSessionCookie` expects a better-call endpoint context: `setSignedCookie`
  // HMAC-signs the token and appends `Set-Cookie` on `responseHeaders`.
  // Path/method are dummy; this context is never routed.
  const endpointCtx = await createInternalContext(
    { context: authContext },
    { options: { method: "POST" }, path: "/dev-login" },
  );

  // better-call types `context` as `Record<string, any>`; Better Auth wants
  // `GenericEndpointContext`. The object is the real endpoint ctx either way.
  await setSessionCookie(
    endpointCtx as unknown as Parameters<typeof setSessionCookie>[0],
    { session, user },
  );

  // Cookie was written onto the fake response, not the incoming Next.js request.
  const setCookies = endpointCtx.responseHeaders.get("set-cookie");
  if (!setCookies) return false;

  // Same mapping as `nextCookies()`: parse `Set-Cookie` and `cookies().set(...)`
  // so the browser actually receives `rankovo.session_token`. Attributes are
  // copied through so httpOnly / lax / max-age match a normal Better Auth login.
  const cookieStore = await cookies();
  parseSetCookieHeader(setCookies).forEach((attributes, name) => {
    cookieStore.set(name, attributes.value, {
      sameSite: attributes.samesite,
      secure: attributes.secure,
      maxAge: attributes["max-age"],
      httpOnly: attributes.httponly,
      domain: attributes.domain,
      path: attributes.path,
    });
  });

  return true;
}

async function createTemporaryUsername(
  usernameRawExternal: string,
  tryNum: number,
): Promise<string> {
  if (tryNum > 3) throw new Error("Failed to sign up, please try again.");

  // check for duplicate username
  const existingUsers = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.name, usernameRawExternal));

  if (existingUsers.length === 0) {
    return usernameRawExternal + "-" + randomUUID().slice(0, 4);
  } else {
    console.debug("Duplicate username found, trying again");
    return createTemporaryUsername(usernameRawExternal, tryNum + 1);
  }
}

export const getUserAuth = cache(async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });

  if (!data) return null;

  const role = data.user.role;
  assertAuthRole(role);

  return {
    id: data.user.id,
    username: data.user.name,
    role,
  };
});

export type UserAuth = Awaited<ReturnType<typeof getUserAuthGated>>;

export async function getUserAuthGated() {
  const userAuth = await getUserAuth();

  if (!userAuth) {
    console.warn("Unauthorized access attempt. Not authenticated.");
    unauthorized();
  }

  return userAuth;
}

export async function assertAuthenticated() {
  await getUserAuthGated();
}

export async function assertAdmin() {
  const userAuth = await getUserAuthGated();

  if (userAuth.role !== "admin") {
    console.warn(
      "Forbidden access attempt. Admin role required.",
      `User ${userAuth.username} has role: ${userAuth.role}`,
    );
    forbidden();
  }
}

export async function assertUserForEntity(cb: () => Promise<string>) {
  const userAuth = await getUserAuthGated();

  const authorId = await cb();

  if (userAuth.id !== authorId) {
    console.warn(
      "Unauthorized access attempt. You are not the author of this entity.",
    );
    unauthorized();
  }
}
