"use server";

import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import {
  CreateOrderParams,
  GetOrdersByEventParams,
  GetOrdersByUserParams,
} from "@/types";
import { redirect } from "next/navigation";
import { handleError } from "../utils";
import { connectToDatabase } from "../database";
import Order from "../database/models/order.model";
import Event from "../database/models/event.model";
import { ObjectId } from "mongodb";
import User from "../database/models/user.model";
import { registerAttendeeFromTicket } from "./eventRegistration.actions";

/**
 * Create a ticket checkout for an event (security fix for issue #10).
 *
 * Only the eventId is accepted from the client. The session is authenticated
 * server-side via Clerk, and the buyer, event title, price, and free/paid
 * status are all read from the database — client-supplied values are never
 * trusted. Free tickets are recorded directly; paid tickets go through a
 * Stripe Checkout session whose metadata is built from server-side data
 * (consumed by the stripe webhook to create the Order).
 */
export const checkoutOrder = async (eventId: string) => {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  if (!ObjectId.isValid(eventId)) throw new Error("Event not found");

  await connectToDatabase();

  const [buyer, event] = await Promise.all([
    User.findOne({ clerkId: userId }),
    Event.findById(eventId),
  ]);

  if (!buyer) {
    throw new Error(
      "Buyer profile not found. Please complete sign-up and role selection first."
    );
  }
  if (!event) throw new Error("Event not found");
  if (event.status === "cancelled") {
    throw new Error("This event has been cancelled");
  }

  // Free ticket: no payment session needed — record the order directly,
  // then put the singer in the KJ's approval queue (chain of command).
  if (event.isFree) {
    await Order.create({
      stripeId: `free-${event._id}-${buyer._id}-${Date.now()}`,
      event: event._id,
      buyer: buyer._id,
      totalAmount: "0",
      createdAt: new Date(),
    });
    await registerAttendeeFromTicket(event._id.toString(), buyer._id.toString());
    redirect("/profile");
  }

  // Paid ticket: price comes from the database, never from the client.
  const unitAmount = Math.round(Number(event.price) * 100);
  if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
    throw new Error("Event price is invalid; please contact the organizer");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: unitAmount,
          product_data: {
            name: event.title,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      eventId: event._id.toString(),
      buyerId: buyer._id.toString(),
    },
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/profile`,
    cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/`,
  });

  redirect(session.url!);
};


export const createOrder = async (order: CreateOrderParams) => {
  try {
    await connectToDatabase();

    const newOrder = await Order.create({
      ...order,
      event: order.eventId,
      buyer: order.buyerId,
    });

    return JSON.parse(JSON.stringify(newOrder));
  } catch (error) {
    handleError(error);
  }
};

// GET ORDERS BY EVENT
export async function getOrdersByEvent({
  searchString,
  eventId,
}: GetOrdersByEventParams) {
  try {
    await connectToDatabase();

    if (!eventId) throw new Error("Event ID is required");
    const eventObjectId = new ObjectId(eventId);

    const orders = await Order.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "buyer",
          foreignField: "_id",
          as: "buyer",
        },
      },
      {
        $unwind: "$buyer",
      },
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "event",
        },
      },
      {
        $unwind: "$event",
      },
      {
        $project: {
          _id: 1,
          totalAmount: 1,
          createdAt: 1,
          eventTitle: "$event.title",
          eventId: "$event._id",
          buyer: {
            $concat: ["$buyer.firstName", " ", "$buyer.lastName"],
          },
        },
      },
      {
        $match: {
          $and: [
            { eventId: eventObjectId },
            { buyer: { $regex: RegExp(searchString, "i") } },
          ],
        },
      },
    ]);

    return JSON.parse(JSON.stringify(orders));
  } catch (error) {
    handleError(error);
  }
}

// GET ORDERS BY USER
export async function getOrdersByUser({
  userId,
  limit = 3,
  page,
}: GetOrdersByUserParams) {
  try {
    await connectToDatabase();

    // Find the user by clerkId to get the MongoDB ObjectId
    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found");

    const skipAmount = (Number(page) - 1) * limit;
    const conditions = { buyer: user._id };

    const orders = await Order.find(conditions)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(limit)
      .populate({
        path: "event",
        model: Event,
        populate: {
          path: "kj",
          model: User,
          select: "_id firstName lastName",
        },
      });

    const ordersCount = await Order.countDocuments(conditions);

    return {
      data: JSON.parse(JSON.stringify(orders)),
      totalPages: Math.ceil(ordersCount / limit),
    };
  } catch (error) {
    handleError(error);
  }
}
