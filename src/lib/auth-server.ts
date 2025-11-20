import { assertAuthRole, defaultRole } from "@/data/static";
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
  user: {
    additionalFields: {
      // Better Auth's additionalFields only supports basic types: "string", "number", "boolean"
      // It does not support TypeScript union types or enums natively.
      // From the docs: "Additional fields are supported, however full type inference for these fields isn't yet supported. Improved type support is planned."
      // See: https://www.better-auth.com/docs/concepts/database#extending-core-schema
      //
      // Workaround to ensure type safety for "role" field:
      // 1. Use type: "string" here (Better Auth requirement)
      // 2. Use varchar({ enum: roles }) in Drizzle schema (database-level constraint)
      // 3. Use assertAuthRole() type guard (runtime validation + TypeScript narrowing)
      role: {
        type: "string",
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

export async function getUserAuth(headers: Headers) {
  const data = await auth.api.getSession({
    headers,
  });

  if (!data) return null;

  const role = data.user.role;
  assertAuthRole(role);

  return {
    id: data.user.id,
    username: data.user.name,
    role,
  };
}

export type UserAuth = Awaited<ReturnType<typeof getUserAuthGated>>;

export async function getUserAuthGated(headers: Headers) {
  const userAuth = await getUserAuth(headers);

  if (!userAuth) {
    console.error("Unauthorized access attempt. Not authenticated.");
    unauthorized();
  }

  return userAuth;
}

export async function assertAuthenticated(headers: Headers) {
  await getUserAuthGated(headers);
}

export async function assertAdmin(headers: Headers) {
  const userAuth = await getUserAuthGated(headers);

  if (userAuth.role !== "admin") {
    console.error(
      "Unauthorized access attempt. Admin role required.",
      `User ${userAuth.id} has role: ${userAuth.role}`,
    );
    unauthorized();
  }
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
