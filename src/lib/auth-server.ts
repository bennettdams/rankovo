import {
  accountsTable,
  sessionsTable,
  usersTable,
  verificationsTable,
} from "@/db/db-schema";
import { db } from "@/db/drizzle-setup";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { unauthorized } from "next/navigation";
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
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          console.debug("Create user | Before hook", user);

          return {
            data: {
              ...user,
              name: await createTemporaryUsername(user.name, 1),
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

export type UserAuth = Awaited<ReturnType<typeof getUserAuthGated>>;

export async function getUserAuthGated(headers: Headers) {
  const data = await auth.api.getSession({
    headers,
  });

  if (!data?.user) {
    console.error("Unauthorized access attempt. Not authenticated.");
    unauthorized();
  }

  return { id: data.user.id, username: data.user.name };
}

export async function assertAuthenticated(headers: Headers) {
  await getUserAuthGated(headers);
}

export async function assertUserForEntity(
  headers: Headers,
  cb: () => Promise<string>,
) {
  const userAuth = await getUserAuthGated(headers);

  const authorId = await cb();

  if (userAuth.id !== authorId) {
    console.error(
      "Unauthorized access attempt. You are not the author of this entity.",
    );
    unauthorized();
  }
}
