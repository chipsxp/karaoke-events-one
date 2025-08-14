import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import NavItems from "@/components/toptemp/NavItems";

// MobileNav is shown on mobile only, hidden on greater 768px screen
const MobileNav = () => {
  return (
    <nav className="md:hidden">
      <Sheet>
        {/* Trigger to only show Mobile Menu */}
        <SheetTrigger className="align-middle">
          <Image
            src="/images/menu-white.svg"
            alt="mobilemenu"
            width={29}
            height={29}
            className="cursor-pointer transition-transform duration-300 hover:scale-110"
          />
        </SheetTrigger>
        {/* Content for Mobile Menu */}
        <SheetContent className="flex flex-col gap-6 bg-black text-white md:hidden animate-slide-in-left">
          <SheetHeader className="flex items-center gap-2">
            <SheetTitle className="md:hidden text-white">
              Mobile Menu
            </SheetTitle>
            <Image
              src="/images/easy-icon.png"
              alt="Easy-events logo"
              width={50}
              height={50}
              className="animate-pulse-slow"
            />
            <SheetDescription className="md:hidden text-gray-300">
              Karaoke-Events
            </SheetDescription>
            <Separator className="border border-gray-700" />
            <NavItems />
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </nav>
  );
};

export default MobileNav;
