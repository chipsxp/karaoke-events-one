"use client";

import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

const WelcomeBannerButton = () => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = "/#events";
  };

  return (
    <Button
      variant="secondary"
      className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-4 py-2 rounded-full mt-4 md:mt-0"
      onClick={handleClick}
    >
      <Mic className="mr-2 h-4 w-4" />
      Find Events
    </Button>
  );
};

export default WelcomeBannerButton;
