"use client";

import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

const HeroButtons = () => {
  const handleExploreEvents = () => {
    const element = document.getElementById('events');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCreateEvent = () => {
    window.location.href = "/events/create";
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
      <Button
        size="lg"
        onClick={handleExploreEvents}
        className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <span className="flex items-center gap-2">
          Explore Events
          <ArrowDown className="h-5 w-5" />
        </span>
      </Button>

      <Button
        size="lg"
        variant="outline"
        onClick={handleCreateEvent}
        className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 rounded-full transition-all duration-300"
      >
        Create Event
      </Button>
    </div>
  );
};

export default HeroButtons;
