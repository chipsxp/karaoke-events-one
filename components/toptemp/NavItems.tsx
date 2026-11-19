"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { label: string; route: string };

type NavItemsProps = {
  /**
   * Viewer role resolved server-side (in Header) from the database.
   * Passing the role as a prop removes the client-side fetch that caused
   * the flash-of-empty-nav (issue #8).
   */
  role?: string;
  /** Whether the viewer is signed in (resolved server-side). */
  isSignedIn?: boolean;
};

const baseLinks: NavLink[] = [{ label: "Home", route: "/" }];

const roleLinks: Record<string, NavLink[]> = {
  KJ: [
    ...baseLinks,
    { label: "Dashboard", route: "/dashboard" },
    { label: "Create Event", route: "/events/create" },
    { label: "My Profile", route: "/profile" },
  ],
  KS: [
    ...baseLinks,
    { label: "Dashboard", route: "/dashboard" },
    { label: "Browse Events", route: "/events" },
    { label: "My Profile", route: "/profile" },
  ],
  Promoter: [
    ...baseLinks,
    { label: "Dashboard", route: "/dashboard" },
    { label: "My Profile", route: "/profile" },
  ],
};

const NavItems = ({ role, isSignedIn = false }: NavItemsProps) => {
  const pathname = usePathname();

  // Links are derived synchronously from server-provided data, so the nav
  // is never empty while a client-side request resolves (issue #8).
  const links: NavLink[] =
    (role && roleLinks[role]) ||
    (isSignedIn
      ? [...baseLinks, { label: "My Profile", route: "/profile" }]
      : baseLinks);

  return (
    <ul className="md:flex-center md:flex-row w-full flex-col items-start gap-5 md:w-auto md:flex-wrap">
      {links.map((link) => {
        const isActive = pathname === link.route;
        return (
          <li
            key={link.route}
            className={`${
              isActive ? "text-white font-bold text-glow" : "text-white"
            } flex-center p-medium-16 whitespace-nowrap transition-all duration-300 hover:text-yellow-300 hover:scale-105 transform animate-slide-in-right`}
          >
            <Link href={link.route} className="hover:text-shimmer">
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default NavItems;
