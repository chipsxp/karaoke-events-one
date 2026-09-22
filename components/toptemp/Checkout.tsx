import React, { useEffect } from "react";

import { IEvent } from "@/lib/database/models/event.model";
import { Button } from "../ui/button";
// PREVIEW MODE (ui-work branch, revert before merging to main): real Stripe checkoutOrder call disabled below.

const Checkout = ({ event, userId }: { event: IEvent; userId: string }) => {
  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      console.log("Order placed! You will receive an email confirmation.");
    }

    if (query.get("canceled")) {
      console.log(
        "Order canceled -- continue to shop around and checkout when you’re ready."
      );
    }
  }, []);

  const onCheckout = async () => {
    // PREVIEW MODE stub: pretend the purchase succeeded instead of calling Stripe.
    alert(`Preview mode: pretend ${event.isFree ? "registration" : "purchase"} succeeded for "${event.title}". No real payment was made.`);
  };

  return (
    <form action={onCheckout} method="post">
      <Button type="submit" role="link" size="lg" className="button sm:w-fit">
        {event.isFree ? "Get Ticket" : "Buy Ticket"}
      </Button>
    </form>
  );
};

export default Checkout;
