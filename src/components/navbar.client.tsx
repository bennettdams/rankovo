"use client";

import { signIn, signOut, useUserAuth } from "@/lib/auth-client";
import { routes } from "@/lib/navigation";
import { CircleUser, NotepadText } from "lucide-react";
import Link from "next/link";
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

function SignInButton() {
  return (
    <Button onClick={() => signIn()} className="bg-secondary text-secondary-fg">
      <CircleUser />
      <p>Sign in</p>
    </Button>
  );
}

export function UserMenu() {
  const userAuth = useUserAuth();

  return (
    <div className="flex h-full w-full items-center justify-end gap-2">
      {userAuth.state === "pending" ? (
        // placeholder, keep in sync with real button below
        <Button
          variant="ghost"
          className="flex h-10 items-center justify-end gap-2 py-0 text-right [&_svg]:size-8"
        >
          <p className="min-w-40 max-w-40 truncate">&nbsp;</p>
          <CircleUser className="stroke-primary" />
        </Button>
      ) : userAuth.state === "error" ? (
        <>
          <p className="text-error">Error signing in, please try again</p>
          <SignInButton />
        </>
      ) : userAuth.state === "no-data" ? (
        <SignInButton />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* keep in sync with placeholder button above */}
            <Button
              variant="ghost"
              className="flex h-10 items-center justify-end gap-2 py-0 text-right [&_svg]:size-8"
            >
              <p className="min-w-40 max-w-40 truncate">{userAuth.username}</p>
              <CircleUser className="stroke-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem>
              <Link href={routes.user(userAuth.id)}>My Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={routes.contact}>Support</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Button onClick={() => signOut()}>Sign out</Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function UserMenuForMobile() {
  const userAuth = useUserAuth();

  if (userAuth.state === "pending") return <div>Loading user..</div>;
  if (userAuth.state === "error")
    return (
      <>
        <p className="text-error">Error signing in, please try again</p>
        <SignInButton />
      </>
    );
  if (userAuth.state === "no-data") return <SignInButton />;

  return (
    <>
      <p className="truncate text-xl text-primary">{userAuth.username}</p>

      <SheetClose asChild>
        <Link href={routes.user(userAuth.id)} className="hover:text-primary">
          My Profile
        </Link>
      </SheetClose>

      <Button onClick={() => signOut()}>Sign out</Button>
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
              <NotepadText /> Create review
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
          <NotepadText /> Create review
        </Button>
      </Link>
    );
  }

  return (
    <Tooltip content={<p>You need to be signed in to create a review.</p>}>
      <div className="justify-self-end">
        <Button
          disabled
          className="cursor-not-allowed disabled:opacity-100"
          onClick={(e) => e.preventDefault()}
        >
          <NotepadText /> Create review
        </Button>
      </div>
    </Tooltip>
  );
}
