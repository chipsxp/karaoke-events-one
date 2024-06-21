"use client";
import { headerLinks } from "@/constants";
import Link from "next/link";
import { usePathname } from "next/navigation";

// hearderLinks map from constants index to Header and MobileNav
const NavItems = () => {
  const pathname = usePathname();
  return (
    <ul className="md:flex-center md:flex-row w-full flex-col items-start gap-5">
      {headerLinks.map((link) => {
        const isActive = pathname === link.route;
        return (
          <li
            key={link.route}
            className={`${
              isActive && "text-primary-500"
            } flex-center p-medium-16 whitespace-nowrap`}
          >
            <Link href={link.route}>{link.label}</Link>
          </li>
        );
      })}
    </ul>
  );
};

//
export default NavItems;
