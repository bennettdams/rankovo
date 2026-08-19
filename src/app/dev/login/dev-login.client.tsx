"use client";

import { Box } from "@/components/box";
import { Button } from "@/components/ui/button";
import { actionSignInDev } from "@/data/actions";
import { usernameDevAdmin, usernameDevUser, type Role } from "@/data/static";
import { signIn, signOut, useUserAuth } from "@/lib/auth-client";
import { routes } from "@/lib/navigation";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DevLoginForm() {
  const router = useRouter();
  const userAuth = useUserAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function signInAs(role: Role) {
    setErrorMsg(null);
    startTransition(async () => {
      if (userAuth.state === "authenticated") {
        await signOut();
      }

      const result = await actionSignInDev(role);
      if (result.status === "ERROR") {
        setErrorMsg(result.message);
        return;
      }

      await userAuth.refetch();
      router.push(routes.home);
      router.refresh();
    });
  }

  return (
    <Box variant="lg" className="mx-auto max-w-lg">
      <div className="flex flex-col gap-4">
        {userAuth.state === "authenticated" && (
          <p>
            Signed in as{" "}
            <span className="font-semibold">{userAuth.username}</span> (
            {userAuth.role}). Signing in as another account will replace this
            session.
          </p>
        )}

        <Button
          disabled={isPending}
          onClick={() => signInAs("user")}
          className="w-full"
        >
          Sign in as {usernameDevUser}
        </Button>

        <Button
          disabled={isPending}
          onClick={() => signInAs("admin")}
          className="w-full"
        >
          Sign in as {usernameDevAdmin}
        </Button>

        <div className="h-px bg-gray" />

        <Button
          variant="secondary"
          disabled={isPending}
          onClick={() => signIn()}
          className="w-full"
        >
          Sign in with Google
        </Button>

        {errorMsg && <p className="text-error">{errorMsg}</p>}
      </div>
    </Box>
  );
}
