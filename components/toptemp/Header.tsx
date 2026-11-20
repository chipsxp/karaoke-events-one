import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import NavItems from "@/components/toptemp/NavItems";
import MobileNav from "@/components/toptemp/MobileNav";
import AuthButtons from "@/components/toptemp/AuthButtons";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { getUserById } from "@/lib/actions/user.actions";

const Header = async () => {
  // Fail soft (issue #2): if Clerk auth cannot be resolved (misconfiguration
  // or outage), render the signed-out header instead of crashing every page.
  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch (error) {
    // Re-throw Next.js control-flow exceptions (e.g. DYNAMIC_SERVER_USAGE
    // during static prerendering) — swallowing them corrupts the build.
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error(
      "[Header] Clerk auth unavailable; falling back to signed-out navigation.",
      error
    );
  }

  // Resolve the viewer's role server-side (issue #8) so NavItems renders
  // links immediately with no client-side fetch and no empty-nav flash.
  let role: string | undefined;
  if (userId) {
    try {
      const dbUser = await getUserById(userId);
      role = dbUser?.role;
    } catch (error) {
      console.error(
        "[Header] Could not load user role; showing default navigation.",
        error
      );
    }
  }

  const isSignedIn = Boolean(userId);

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

        {/* Wide Screen Navigation (issue #8: sizes to content, no max-w-xs clipping) */}
        <nav className="hidden md:flex w-full max-w-none flex-1 justify-center">
          <NavItems role={role} isSignedIn={isSignedIn} />
        </nav>

        {/* Clerk Auth Navigation with Mobile Navigation */}
        <div className="flex w-32 justify-end gap-3">
          <SignedIn>
            <div className="flex items-center gap-3">
              {userId && <NotificationBell userId={userId} />}
              <UserButton
                signInUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 md:w-12 md:h-12", // 20% larger (from default ~8x8 to 10x10, md: 12x12)
                  },
                }}
              />
            </div>
          </SignedIn>
          <MobileNav role={role} isSignedIn={isSignedIn} />
          <SignedOut>
            <AuthButtons />
          </SignedOut>
        </div>
      </div>
    </header>
  );
};

export default Header;
