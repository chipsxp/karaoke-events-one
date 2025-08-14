"use client";

import { Button } from "@/components/ui/button";
import { Star, Ticket } from "lucide-react";

interface ProfileButtonsProps {
  type:
    | "browse-events"
    | "edit-profile"
    | "view-details"
    | "create-event"
    | "no-tickets-browse"
    | "explore-events";
  eventId?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
}

const ProfileButtons = ({
  type,
  eventId,
  className,
  variant = "default",
  size = "default",
}: ProfileButtonsProps) => {
  const handleClick = () => {
    switch (type) {
      case "browse-events":
      case "explore-events":
      case "no-tickets-browse":
        window.location.href = "/#events";
        break;
      case "edit-profile":
        window.location.href = "/profile/edit";
        break;
      case "view-details":
        if (eventId) {
          window.location.href = `/events/${eventId}`;
        }
        break;
      case "create-event":
        window.location.href = "/events/create";
        break;
    }
  };

  const getButtonContent = () => {
    switch (type) {
      case "browse-events":
        return "Browse Events";
      case "explore-events":
        return "Explore Events";
      case "edit-profile":
        return (
          <>
            <Star className="mr-2 h-4 w-4" />
            Edit Profile
          </>
        );
      case "view-details":
        return "View Details";
      case "create-event":
        return "Create New Event";
      case "no-tickets-browse":
        return "Browse Events";
      default:
        return "Click";
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
    >
      {getButtonContent()}
    </Button>
  );
};

export default ProfileButtons;
