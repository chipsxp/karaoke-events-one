"use client";

import { Button } from "@/components/ui/button";

const AuthButtons = () => {
  const handleLogin = () => {
    window.location.href = "/sign-in";
  };

  const handleSignUp = () => {
    window.location.href = "/sign-up";
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        className="rounded-full md:flex-between hidden text-white border-white hover:bg-white hover:text-black transition-all duration-300 animate-slide-in-right"
        size="lg"
        onClick={handleLogin}
      >
        Login
      </Button>
      <Button
        className="rounded-full md:flex-between hidden bg-white text-black hover:bg-gray-200 transition-all duration-300 animate-slide-in-right"
        size="lg"
        onClick={handleSignUp}
      >
        Sign Up
      </Button>
    </div>
  );
};

export default AuthButtons;
