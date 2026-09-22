import Image from "next/image";
import Link from "next/link";
import NavItems from "@/components/toptemp/NavItems";
import MobileNav from "@/components/toptemp/MobileNav";
// PREVIEW MODE (ui-work branch, revert before merging to main): AuthButtons/SignedIn/SignedOut/UserButton removed, no ClerkProvider available.

const Header = () => {
  return (
    <header
      className="w-full border-b bg-cover bg-top relative animate-fade-in-up"
      style={{ backgroundImage: "url('/images/party-event.jpg')" }}
    >
      {/* Overlay for better text visibility */}
      <div className="absolute inset-0 bg-black/30"></div>

      <div className="wrapper flex items-center justify-between relative z-10 py-4 h-64">
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
        <nav className="hidden md:flex md:flex-between w-full max-w-xs">
          <NavItems />
        </nav>

        {/* Clerk Auth Navigation with Mobile Navigation */}
        <div className="flex w-32 justify-end gap-3">
          {/* PREVIEW MODE (ui-work branch, revert before merging to main): static stand-in for SignedIn/SignedOut/UserButton */}
          <MobileNav />
          <button
            type="button"
            disabled
            className="button rounded-full px-4 py-2 text-sm opacity-60"
            title="Sign in disabled in preview mode"
          >
            Sign In (preview)
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
