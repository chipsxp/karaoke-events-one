"use client";

import { Button } from "@/components/ui/button";

const RegisterForEventsButton = () => {
  const handleRegisterForEvents = () => {
    window.location.href = "/events";
  };

  return (
    <Button onClick={handleRegisterForEvents}>
      Register for Events
    </Button>
  );
};

export default RegisterForEventsButton;
