import { routes } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import Link from "next/link";
import { IconRankovo } from "./icons";
import {
  CreateReviewButtonLink,
  UserMenu,
  UserMenuForMobile,
} from "./navbar.client";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

const userMenuWidthStyles = "w-96 min-w-96 max-w-96";

export function Navbar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 px-4 backdrop-blur-2xl md:px-6">
      <nav className="hidden w-full flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <div className={cn("flex gap-x-10 pl-6 text-lg", userMenuWidthStyles)}>
          <Link
            href={routes.rankings}
            className="transition-colors hover:text-primary"
          >
            Rankings
          </Link>

          {/* <Link
            href={routes.reviews}
            className="transition-colors hover:text-primary"
          >
            Reviews
          </Link> */}

          <Link
            href={routes.aboutUs}
            className="transition-colors hover:text-primary"
          >
            About Us
          </Link>
        </div>

        <div className="grid grow grid-cols-3 items-center justify-center">
          <div></div>

          <div className="flex items-center justify-center gap-x-6">
            <Link
              href={routes.home}
              className="relative flex items-center gap-2 text-lg font-semibold md:text-base"
            >
              <IconRankovo className="absolute -left-8 h-6 w-6" />
              <h1 className="text-3xl font-extrabold tracking-tight text-fg">
                <span className="block text-primary">Rankovo</span>
              </h1>
            </Link>
          </div>
        </div>

        <div
          className={cn(
            "hidden h-full items-center justify-end gap-4 md:ml-auto md:flex md:w-min md:gap-2 lg:gap-4",
            userMenuWidthStyles,
          )}
        >
          <CreateReviewButtonLink />

          <UserMenu />
        </div>
      </nav>

      <MobileMenu />

      {/* Mobile content */}
      <div className="flex w-full items-center justify-end gap-x-2 text-right md:hidden">
        <IconRankovo className="h-6 w-6" />
        <h1 className="text-3xl font-extrabold tracking-tight text-fg">
          <span className="block text-primary">Rankovo</span>
        </h1>
      </div>
    </header>
  );
}

function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left">
        <SheetHeader className="sr-only">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>Main menu</SheetDescription>
        </SheetHeader>
        <nav className="grid gap-6 text-lg font-medium">
          <Link
            href={routes.home}
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <IconRankovo className="h-6 w-6" />
            <h1 className="text-xl font-extrabold tracking-tight text-fg md:text-5xl lg:text-6xl">
              <span className="block text-primary">Rankovo</span>
            </h1>
          </Link>
          <SheetClose asChild>
            <Link href={routes.rankings} className="hover:text-primary">
              Rankings
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href={routes.reviews} className="hover:text-primary">
              Reviews
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href={routes.aboutUs} className="hover:text-primary">
              About Us
            </Link>
          </SheetClose>

          <CreateReviewButtonLink inMobileMenu={true} />

          <div className="h-0.5 bg-gray"></div>

          <UserMenuForMobile />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
