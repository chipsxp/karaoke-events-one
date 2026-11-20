import stripe from "stripe";
import { NextResponse } from "next/server";
import { createOrder } from "@/lib/actions/order.actions";
import { registerAttendeeFromTicket } from "@/lib/actions/eventRegistration.actions";

export async function POST(request: Request) {
  const body = await request.text();

  const sig = request.headers.get("stripe-signature") as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    return NextResponse.json({ message: "Webhook error", error: err });
  }

  // Get the ID and type
  const eventType = event.type;

  // CREATE
  if (eventType === "checkout.session.completed") {
    const { id, amount_total, metadata } = event.data.object;

    const order = {
      stripeId: id,
      eventId: metadata?.eventId || "",
      buyerId: metadata?.buyerId || "",
      totalAmount: amount_total ? (amount_total / 100).toString() : "0",
      createdAt: new Date(),
    };

    const newOrder = await createOrder(order);

    // Chain of command (Phase 1): a purchased ticket puts the singer into the
    // event KJ's approval queue (auto-approved when the event allows it).
    // metadata.buyerId is the Mongo _id set server-side by checkoutOrder.
    if (metadata?.eventId && metadata?.buyerId) {
      try {
        await registerAttendeeFromTicket(metadata.eventId, metadata.buyerId);
      } catch (regError) {
        // Never fail the webhook (and risk Stripe retries) because the
        // registration side-effect failed; the order itself is recorded.
        console.error("[stripe-webhook] registration failed:", regError);
      }
    }

    return NextResponse.json({ message: "OK", order: newOrder });
  }

  return new Response("", { status: 200 });
}
