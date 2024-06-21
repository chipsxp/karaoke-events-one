import Image from "next/image";
import Link from "next/link";

// Add Sales catch and click here with images
const Footer = () => {
  return (
    <footer className="border-t-2">
      <div className="flex-center wrapper flex-between flex flex-col gap-4 p-5 text-center sm:flex-row">
        <Link href="/">
          Karaoke Events
          <Image
            src="/images/easy-icon.png"
            alt="Easy-events logo"
            width={50}
            height={50}
          />
          <p>
            Karaoke Events by pluckCode ©{new Date().getFullYear()}. All Rights
            Reserved.
          </p>
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
