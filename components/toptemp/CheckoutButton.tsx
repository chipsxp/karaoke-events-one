"use client";

import { IEvent } from "@/lib/database/models/event.model";
// PREVIEW MODE (ui-work branch, revert before merging to main): SignedIn/SignedOut/useUser removed, no ClerkProvider available.
import { Button } from "../ui/button";
import Checkout from "./Checkout";

const CheckoutButton = ({ event }: { event: IEvent }) => {
  const userId = "preview-user"; // PREVIEW MODE stub, was: useUser().user?.publicMetadata.userId
  const hasEventFinished = new Date(event.endDateTime) < new Date();

  return (
    <div className="flex items-center gap-3">
      {hasEventFinished ? (
        <p className="p-2 text-red-400">
          Sorry, tickets are no longer available.
        </p>
      ) : (
        <Checkout event={event} userId={userId} />
      )}
    </div>
  );
};

export default CheckoutButton;
