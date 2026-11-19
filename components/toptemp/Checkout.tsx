"use client";

import React, { useEffect } from "react";

import type { IEvent } from "@/lib/database/models/event.model";
import { Button } from "../ui/button";
import { checkoutOrder } from "@/lib/actions/order.actions";

const Checkout = ({ event }: { event: IEvent }) => {
  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      console.log("Order placed! You will receive an email confirmation.");
    }

    if (query.get("canceled")) {
      console.log(
        "Order canceled -- continue to shop around and checkout when you're ready."
      );
    }
  }, []);

  const onCheckout = async () => {
    // Security (issue #10): only the eventId travels from the client.
    // The buyer identity, title, price, and free/paid status are all
    // resolved server-side inside the action from the database.
    await checkoutOrder(event._id);
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
