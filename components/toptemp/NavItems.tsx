"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { getUserById } from "@/lib/actions/user.actions";

interface User {
  role: string;
}

const NavItems = () => {
  const pathname = usePathname();
  const { userId } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      getUserById(userId).then((userData) => {
        setUser(userData);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [userId]);

  const getRoleBasedLinks = () => {
    if (loading) return [];
    
    const baseLinks = [
      { label: "Home", route: "/" },
    ];

    if (!user) {
      return [...baseLinks];
    }

    const roleLinks = {
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

    return roleLinks[user.role as keyof typeof roleLinks] || [...baseLinks, { label: "My Profile", route: "/profile" }];
  };

  const links = getRoleBasedLinks();

  return (
    <ul className="md:flex-center md:flex-row w-full flex-col items-start gap-5">
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