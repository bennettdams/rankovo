"use client";

import { signIn, signOut, useUserAuth } from "@/lib/auth-client";
import { routes } from "@/lib/navigation";
import { CircleUser, NotepadText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LoadingSpinner } from "./loading-spinner";
import { Tooltip } from "./tooltip-custom";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SheetClose } from "./ui/sheet";

function SignInButton({ allowDevLogin }: { allowDevLogin: boolean }) {
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (allowDevLogin) {
    return (
      <Button asChild className="bg-secondary text-secondary-fg">
        <Link href={routes.devLogin}>
          <CircleUser />
          <p>Anmelden</p>
        </Link>
      </Button>
    );
  }

  async function handleSignIn() {
    setIsSigningIn(true);
    try {
      await signIn();
    } catch {
      setIsSigningIn(false);
    }
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={isSigningIn}
      aria-busy={isSigningIn}
      className="bg-secondary text-secondary-fg"
    >
      {isSigningIn ? (
        <LoadingSpinner className="fill-secondary-fg" />
      ) : (
        <CircleUser />
      )}
      <p>Anmelden</p>
    </Button>
  );
}

export function UserMenu({ allowDevLogin }: { allowDevLogin: boolean }) {
  const userAuth = useUserAuth();

  return (
    <div className="flex h-full w-full items-center justify-end gap-2">
      {userAuth.state === "pending" ? (
        // placeholder, keep in sync with real button below
        <Button
          variant="ghost"
          className="flex h-10 items-center justify-end gap-2 py-0 text-right [&_svg]:size-8"
        >
          <p className="max-w-40 min-w-40 truncate">&nbsp;</p>
          <CircleUser className="stroke-primary" />
        </Button>
      ) : userAuth.state === "error" ? (
        <div className="flex flex-row items-center gap-x-2">
          <p className="w-40 text-error">
            Fehler beim Anmelden, bitte versuche es erneut
          </p>
          <SignInButton allowDevLogin={allowDevLogin} />
        </div>
      ) : userAuth.state === "no-data" ? (
        <SignInButton allowDevLogin={allowDevLogin} />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* keep in sync with placeholder button above */}
            <Button
              variant="ghost"
              className="flex h-10 items-center justify-end gap-2 py-0 text-right [&_svg]:size-8"
            >
              <p className="max-w-40 min-w-40 truncate">{userAuth.username}</p>
              <CircleUser className="stroke-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            {userAuth.role === "admin" && (
              <DropdownMenuItem asChild>
                <Link href={routes.admin}>Verwaltung</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Link href={routes.user(userAuth.id)}>Mein Profil</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={routes.aboutUs}>Support</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Button onClick={() => signOut()}>Abmelden</Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function UserMenuForMobile({
  allowDevLogin,
}: {
  allowDevLogin: boolean;
}) {
  const userAuth = useUserAuth();

  if (userAuth.state === "pending") return <div>Nutzer wird geladen..</div>;
  if (userAuth.state === "error")
    return (
      <>
        <p className="text-error">
          Fehler beim Anmelden, bitte versuche es erneut
        </p>
        <SignInButton allowDevLogin={allowDevLogin} />
      </>
    );
  if (userAuth.state === "no-data")
    return <SignInButton allowDevLogin={allowDevLogin} />;

  return (
    <>
      <p className="truncate text-xl text-primary">{userAuth.username}</p>

      {userAuth.role === "admin" && (
        <SheetClose asChild>
          <Link href={routes.admin} className="hover:text-primary">
            Verwaltung
          </Link>
        </SheetClose>
      )}

      <SheetClose asChild>
        <Link href={routes.user(userAuth.id)} className="hover:text-primary">
          Mein Profil
        </Link>
      </SheetClose>

      <Button onClick={() => signOut()}>Abmelden</Button>
    </>
  );
}

export function CreateReviewButtonLink({
  inMobileMenu = false,
}: {
  inMobileMenu?: boolean;
}) {
  const userAuth = useUserAuth();

  if (userAuth.state === "authenticated") {
    if (inMobileMenu) {
      return (
        <SheetClose asChild>
          {/* Cannot easily use a React component here due to the SheetClose needing a ref to be passed. Hence the code duplication below. */}
          <Link
            href={routes.reviewCreate}
            className="justify-self-end transition-colors hover:text-primary"
          >
            <Button>
              <NotepadText /> Bewertung erstellen
            </Button>
          </Link>
        </SheetClose>
      );
    }

    return (
      <Link
        href={routes.reviewCreate}
        className="justify-self-end transition-colors hover:text-primary"
      >
        <Button>
          <NotepadText /> Bewertung erstellen
        </Button>
      </Link>
    );
  }

  return (
    <Tooltip
      content={<p>Du musst angemeldet sein, um eine Bewertung zu erstellen.</p>}
    >
      <div className="justify-self-end">
        <Button
          disabled
          className="cursor-not-allowed disabled:opacity-100"
          onClick={(e) => e.preventDefault()}
        >
          <NotepadText /> Bewertung erstellen
        </Button>
      </div>
    </Tooltip>
  );
}
