import type { Metadata } from "next";
import { Poppins } from "next/font/google";
// PREVIEW MODE (ui-work branch, revert before merging to main): ClerkProvider import removed with its usage below.
import "./globals.css";


const poppins = Poppins({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Karaoke Events",
  description: "Register, Promote, and Manage your karaoke events",
  icons: {
    icon: "/images/easy-icon.png",
  },
};

export default function AppRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // PREVIEW MODE (ui-work branch, revert before merging to main): no real Clerk instance available yet.
  return (
    <html lang="en">
      <body className={poppins.className}>{children}</body>
    </html>
  );
}
