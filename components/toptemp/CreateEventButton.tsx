"use client";

import { Button } from "@/components/ui/button";

const CreateEventButton = () => {
  const handleCreateEvent = () => {
    window.location.href = "/events/create";
  };

  return (
    <Button onClick={handleCreateEvent}>
      Create Your First Event
    </Button>
  );
};

export default CreateEventButton;
