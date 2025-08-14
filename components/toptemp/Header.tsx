import Image from "next/image";
import Link from "next/link";
import NavItems from "@/components/toptemp/NavItems";
import MobileNav from "@/components/toptemp/MobileNav";
import AuthButtons from "@/components/toptemp/AuthButtons";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const Header = () => {
  return (
    <header
      className="w-full border-b bg-cover bg-top relative animate-fade-in-up"
      style={{ backgroundImage: "url('/images/party-event.jpg')" }}
    >
      {/* Overlay for better text visibility */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      <div className="wrapper flex items-center justify-between relative z-10 py-4">
        <Link href="/" className="w-36 animate-bounce-subtle">
          <Image
            src="/images/easy-icon.png"
            width={100}
            height={100}
            alt="Easy-events logo"
            className="drop-shadow-lg"
          />
        </Link>

        {/* Wide Screen Navigation */}
        <nav className="md:flex-between hidden w-full max-w-xs">
          <NavItems />
        </nav>

        {/* Clerk Auth Navigation with Mobile Navigation */}
        <div className="flex w-32 justify-end gap-3">
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 md:w-12 md:h-12", // 20% larger (from default ~8x8 to 10x10, md: 12x12)
                },
              }}
            />
          </SignedIn>
          <MobileNav />
          <SignedOut>
            <AuthButtons />
          </SignedOut>
        </div>
      </div>
    </header>
  );
};

export default Header;
