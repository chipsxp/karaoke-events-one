"use client";

import { Button } from "@/components/ui/button";

const CTAButton = () => {
  const handleCreateEvent = () => {
    window.location.href = "/events/create";
  };

  return (
    <Button
      size="lg"
      onClick={handleCreateEvent}
      className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
    >
      Start Creating
    </Button>
  );
};

export default CTAButton;
