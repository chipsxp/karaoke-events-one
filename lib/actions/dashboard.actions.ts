"use server";

import { connectToDatabase } from "../database";
import Event from "../database/models/event.model";
import EventRegistration from "../database/models/eventRegistration.model";
import User from "../database/models/user.model";
import Venue from "../database/models/venue.model";
import { handleError } from "../utils";

// All dashboard actions accept a CLERK user id and resolve it to the Mongo
// ObjectId internally. (Earlier versions queried ObjectId fields with the
// Clerk id directly, so every count silently returned zero.)

async function resolveUserByClerkId(clerkId: string) {
  await connectToDatabase();
  return User.findOne({ clerkId });
}

// ===== KJ Dashboard (event host/director) =====

export async function getKJDashboardData(kjClerkId: string) {
  try {
    const kj = await resolveUserByClerkId(kjClerkId);
    if (!kj) {
      return {
        totalEvents: 0,
        pendingRegistrations: 0,
        upcomingEvents: 0,
        recentRegistrations: [],
      };
    }

    const eventIds = await Event.find({ kj: kj._id }).distinct("_id");

    const [totalEvents, pendingRegistrations, upcomingEvents, recentRegistrations] =
      await Promise.all([
        Event.countDocuments({ kj: kj._id }),
        EventRegistration.countDocuments({
          eventId: { $in: eventIds },
          status: "pending",
        }),
        Event.countDocuments({
          kj: kj._id,
          startDateTime: { $gte: new Date() },
          status: "published",
        }),
        EventRegistration.find({
          eventId: { $in: eventIds },
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        })
          .populate({
            path: "userId",
            model: User,
            select: "firstName lastName photoAvatar",
          })
          .populate({
            path: "eventId",
            model: Event,
            select: "title startDateTime",
          })
          .sort({ createdAt: -1 })
          .limit(10),
      ]);

    return {
      totalEvents,
      pendingRegistrations,
      upcomingEvents,
      recentRegistrations: JSON.parse(JSON.stringify(recentRegistrations)),
    };
  } catch (error) {
    handleError(error);
  }
}

// Detailed pending-registration queue for the KJ (singers awaiting approval)
export async function getKJRegistrationQueue(kjClerkId: string) {
  try {
    const kj = await resolveUserByClerkId(kjClerkId);
    if (!kj) return [];

    const events = await Event.find({ kj: kj._id })
      .select("_id title startDateTime")
      .sort({ startDateTime: 1 });

    const registrations = await EventRegistration.find({
      eventId: { $in: events.map((e) => e._id) },
      status: "pending",
    })
      .populate({
        path: "userId",
        model: User,
        select:
          "firstName lastName emailId photoAvatar vocalRange preferredGenres",
      })
      .populate({
        path: "eventId",
        model: Event,
        select: "title startDateTime capacity",
      })
      .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(registrations));
  } catch (error) {
    handleError(error);
  }
}

// ===== KS Dashboard (singer/customer) =====

export async function getKSDashboardData(ksClerkId: string) {
  try {
    const ks = await resolveUserByClerkId(ksClerkId);
    if (!ks) {
      return {
        registeredEvents: 0,
        interestedEvents: 0,
        attendedEvents: 0,
        upcomingRegistrations: [],
      };
    }

    const [registeredEvents, interestedEvents, attendedEvents, upcomingRegistrations] =
      await Promise.all([
        EventRegistration.countDocuments({
          userId: ks._id,
          registrationType: "registered",
          status: { $in: ["approved", "pending", "attended"] },
        }),
        EventRegistration.countDocuments({
          userId: ks._id,
          registrationType: "interested",
        }),
        EventRegistration.countDocuments({
          userId: ks._id,
          status: "attended",
        }),
        EventRegistration.find({
          userId: ks._id,
          registrationType: "registered",
          status: { $in: ["approved", "pending"] },
        })
          .populate({
            path: "eventId",
            model: Event,
            populate: [
              { path: "category", model: "Category", select: "name" },
              { path: "kj", model: "User", select: "firstName lastName" },
              { path: "venue", model: "Venue", select: "name address" },
            ],
          })
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

    return {
      registeredEvents,
      interestedEvents,
      attendedEvents,
      upcomingRegistrations: JSON.parse(JSON.stringify(upcomingRegistrations)),
    };
  } catch (error) {
    handleError(error);
  }
}

// KS event history (all registrations, newest first)
export async function getKSEventHistory(ksClerkId: string) {
  try {
    const ks = await resolveUserByClerkId(ksClerkId);
    if (!ks) return [];

    const registrations = await EventRegistration.find({ userId: ks._id })
      .populate({
        path: "eventId",
        model: Event,
        populate: [
          { path: "category", model: "Category", select: "name" },
          { path: "kj", model: "User", select: "firstName lastName" },
          { path: "venue", model: "Venue", select: "name address" },
        ],
      })
      .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(registrations));
  } catch (error) {
    handleError(error);
  }
}

// ===== Promoter Dashboard (venue owner / top of chain of command) =====

export async function getPromoterDashboardData(promoterClerkId: string) {
  try {
    const promoter = await resolveUserByClerkId(promoterClerkId);
    if (!promoter) {
      return {
        totalVenues: 0,
        pendingKJs: 0,
        upcomingEventsAtVenues: 0,
        totalEventsAtVenues: 0,
      };
    }

    const venueIds = await Venue.find({
      ownedBy: promoter._id,
      isActive: true,
    }).distinct("_id");

    const [totalVenues, pendingKJs, upcomingEventsAtVenues, totalEventsAtVenues] =
      await Promise.all([
        Venue.countDocuments({ ownedBy: promoter._id, isActive: true }),
        User.countDocuments({
          role: "KJ",
          kjVerificationStatus: "pending",
        }),
        Event.countDocuments({
          venue: { $in: venueIds },
          startDateTime: { $gte: new Date() },
          status: "published",
        }),
        Event.countDocuments({ venue: { $in: venueIds } }),
      ]);

    return {
      totalVenues,
      pendingKJs,
      upcomingEventsAtVenues,
      totalEventsAtVenues,
    };
  } catch (error) {
    handleError(error);
  }
}
