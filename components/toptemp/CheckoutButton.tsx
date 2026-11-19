"use client";

import type { IEvent } from "@/lib/database/models/event.model";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "../ui/button";
import Checkout from "./Checkout";

const CheckoutButton = ({ event }: { event: IEvent }) => {
  const hasEventFinished = new Date(event.endDateTime) < new Date();

  return (
    <div className="flex items-center gap-3">
      {hasEventFinished ? (
        <p className="p-2 text-red-400">
          Sorry, tickets are no longer available.
        </p>
      ) : (
        <>
          <SignedOut>
            <Button
              onClick={() => (window.location.href = "/sign-in")}
              className="button rounded-full"
              size="lg"
            >
              Get Tickets
            </Button>
          </SignedOut>

          <SignedIn>
            <Checkout event={event} />
          </SignedIn>
        </>
      )}
    </div>
  );
};

export default CheckoutButton;
