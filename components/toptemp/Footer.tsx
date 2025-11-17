import Image from "next/image";
import Link from "next/link";

// Add Sales catch and click here with images
const Footer = () => {
  return (
    <footer className="border-t-2 bg-cover bg-center relative" style={{ backgroundImage: "url('/images/party-event.jpg')" }}>
      {/* Overlay for better text visibility */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      <div className="wrapper flex-center flex-col gap-4 p-5 text-center relative z-10">
        {/* Logo Section - Now its own Link */}
        <Link href="/" className="flex items-center justify-center hover:opacity-80 transition-opacity">
          <Image
            src="/images/easy-icon.png"
            alt="Easy-events logo"
            width={50}
            height={50}
            className="drop-shadow-lg"
          />
          <span className="text-white font-bold text-xl ml-2">Karaoke Events</span>
        </Link>

        {/* Navigation Links - No longer nested */}
        <div className="flex gap-6 mt-4 flex-wrap justify-center">
          <Link
            href="/privacy-policy"
            className="text-white hover:text-yellow-300 transition-all duration-300 hover:scale-105 transform animate-slide-in-right"
          >
            Privacy Policy
          </Link>
          <Link
            href="/about"
            className="text-white hover:text-yellow-300 transition-all duration-300 hover:scale-105 transform animate-slide-in-right"
          >
            About Karaoke Events
          </Link>
        </div>

        {/* Fun Copyright Info - No longer inside Link */}
        <p className="text-white mt-4 text-sm animate-fade-in-up text-center">
          🎤 <span className="text-yellow-300 font-bold">Karaoke Events</span> by <span className="text-pink-400 font-bold">pluckCode</span> ©{new Date().getFullYear()} 🎉
          <br />
          <span className="text-xs">All Rights Reserved. Let's sing our hearts out! 🎶</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
