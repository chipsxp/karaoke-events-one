import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import NavItems from "@/components/toptemp/NavItems";
import MobileNav from "@/components/toptemp/MobileNav";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const Header = () => {
  return (
    <header className="w-full border-b">
      <div className="wrapper flex bg-hero-img bg-cover items-center justify-between">
        <Link href="/" className="w-36">
          <Image
            src="/images/easy-icon.png"
            width={100}
            height={100}
            alt="Easy-events logo"
          />
        </Link>

        <nav className="md:flex-between hidden w-full max-w-xs">
          <NavItems />
        </nav>

        <div className="flex w-32 justify-end gap-3">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <MobileNav />
          <SignedOut>
            <Button
              asChild
              className="rounded-full md:flex-between hidden"
              size="lg"
            >
              <Link href="/sign-in">Login</Link>
            </Button>
          </SignedOut>
        </div>
      </div>
    </header>
  );
};

export default Header;
