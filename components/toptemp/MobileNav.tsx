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

const MobileNav = () => {
  return (
    <nav className="md:hidden">
      <Sheet>
        <SheetTrigger className="align-middle">
          <Image
            src="/images/menu.svg"
            alt="mobilemenu"
            width={24}
            height={24}
            className="cursor-pointer"
          />
        </SheetTrigger>

        <SheetContent className="flex flex-col gap-6 bg-slate-100 md:hidden">
          <SheetHeader className="flex items-center gap-2">
            <SheetTitle className="md:hidden bg-slate-100">
              Mobile Menu
            </SheetTitle>
            <Image
              src="/images/easy-icon.png"
              alt="Easy-events logo"
              width={50}
              height={50}
            />
            <SheetDescription className="md:hidden bg-slate-100">
              Karaoke-Events
            </SheetDescription>
            <Separator className="border border-black-50" />
            <NavItems />
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </nav>
  );
};

export default MobileNav;
