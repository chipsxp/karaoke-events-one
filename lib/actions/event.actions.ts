"use server";

import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/lib/database";
import Event from "@/lib/database/models/event.model";
import EventRegistration from "@/lib/database/models/eventRegistration.model";
import User from "@/lib/database/models/user.model";
import Venue from "@/lib/database/models/venue.model";
import Category from "@/lib/database/models/category.model";
import { handleError, handleErrorThrow } from "@/lib/utils";

import {
  CreateEventParams,
  UpdateEventParams,
  DeleteEventParams,
  GetAllEventsParams,
  GetEventsByUserParams,
  GetRelatedEventsByCategoryParams,
} from "@/types";

const getCategoryByName = async (name: string) => {
  return Category.findOne({ name: { $regex: name, $options: "i" } });
};

const populateEvent = (query: any) => {
  return query
    .populate({
      path: "kj",
      model: User,
      select: "_id firstName lastName kjVerificationStatus",
    })
    .populate({
      path: "promoter",
      model: User,
      select: "_id firstName lastName",
    })
    .populate({
      path: "venue",
      model: Venue,
      select: "_id name address",
    })
    .populate({ path: "category", model: Category, select: "_id name" });
};

// CREATE — only verified KJs (event hosts/directors) may create events.
// When a Venue is selected, the event's promoter is set to the venue owner.
export async function createEvent({ userId, event, path }: CreateEventParams) {
  try {
    await connectToDatabase();

    const kj = await User.findOne({ clerkId: userId });
    if (!kj) throw new Error("User not found");
    if (kj.role !== "KJ") {
      throw new Error("Only KJs (event hosts) can create events");
    }
    if (kj.kjVerificationStatus !== "verified") {
      throw new Error(
        "Your KJ verification is still pending Promoter approval. You can create events once approved."
      );
    }

    const { venueId, ...eventData } = event as any;

    let venue: any = null;
    let promoter: any = null;
    if (venueId) {
      venue = await Venue.findOne({ _id: venueId, isActive: true });
      if (!venue) throw new Error("Selected venue not found or inactive");
      promoter = venue.ownedBy;
    }

    const newEvent = await Event.create({
      ...eventData,
      category: event.categoryId,
      kj: kj._id,
      promoter,
      venue,
      location:
        event.location ||
        (venue ? [venue.name, venue.address].filter(Boolean).join(" — ") : ""),
      status: "published",
    });
    revalidatePath(path);

    return JSON.parse(JSON.stringify(newEvent));
  } catch (error) {
    handleErrorThrow(error);
  }
}

// GET ONE EVENT BY ID
export async function getEventById(eventId: string) {
  try {
    await connectToDatabase();

    const event = await populateEvent(Event.findById(eventId));

    if (!event) throw new Error("Event not found");

    return JSON.parse(JSON.stringify(event));
  } catch (error) {
    handleError(error);
  }
}

// UPDATE — only the event's KJ may update it
export async function updateEvent({ userId, event, path }: UpdateEventParams) {
  try {
    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found");

    const eventToUpdate = await Event.findById(event._id);
    if (!eventToUpdate || eventToUpdate.kj?.toHexString() !== user._id.toHexString()) {
      throw new Error("Unauthorized or event not found");
    }

    const { venueId, ...eventData } = event as any;
    const updatePayload: any = { ...eventData, category: event.categoryId };

    // Re-resolve venue/promoter when the venue selection changed
    if (venueId !== undefined) {
      if (venueId) {
        const venue = await Venue.findOne({ _id: venueId, isActive: true });
        if (!venue) throw new Error("Selected venue not found or inactive");
        updatePayload.venue = venue._id;
        updatePayload.promoter = venue.ownedBy;
      } else {
        updatePayload.venue = null;
        updatePayload.promoter = null;
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      updatePayload,
      { new: true }
    );
    revalidatePath(path);

    return JSON.parse(JSON.stringify(updatedEvent));
  } catch (error) {
    handleErrorThrow(error);
  }
}

// DELETE
export async function deleteEvent({ eventId, path }: DeleteEventParams) {
  try {
    await connectToDatabase();

    const deletedEvent = await Event.findByIdAndDelete(eventId);
    if (deletedEvent) revalidatePath(path);
  } catch (error) {
    handleErrorThrow(error);
  }
}

// GET ALL EVENTS
export async function getAllEvents({
  query,
  limit = 6,
  page,
  category,
}: GetAllEventsParams) {
  try {
    await connectToDatabase();

    const titleCondition = query
      ? { title: { $regex: query, $options: "i" } }
      : {};
    const categoryCondition = category
      ? await getCategoryByName(category)
      : null;
    const conditions = {
      $and: [
        titleCondition,
        categoryCondition ? { category: categoryCondition._id } : {},
        // Discovery only shows live events (no drafts, no cancelled)
        { status: { $nin: ["draft", "cancelled"] } },
      ],
    };

    const skipAmount = (Number(page) - 1) * limit;
    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(limit);

    const events = await populateEvent(eventsQuery);
    const eventsCount = await Event.countDocuments(conditions);

    return {
      data: JSON.parse(JSON.stringify(events)),
      totalPages: Math.ceil(eventsCount / limit),
    };
  } catch (error) {
    handleError(error);
    return { data: [], totalPages: 0 };
  }
}

// GET EVENTS BY USER (events the user is the KJ of)
export async function getEventsByUser({
  userId,
  limit = 6,
  page,
}: GetEventsByUserParams) {
  try {
    await connectToDatabase();

    // Find the user by clerkId to get the MongoDB ObjectId
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return {
        data: [],
        totalPages: 0,
      };
    }

    const conditions = { kj: user._id };
    const skipAmount = (page - 1) * limit;

    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(limit);

    const events = await populateEvent(eventsQuery);
    const eventsCount = await Event.countDocuments(conditions);

    return {
      data: JSON.parse(JSON.stringify(events)),
      totalPages: Math.ceil(eventsCount / limit),
    };
  } catch (error) {
    handleError(error);
    return { data: [], totalPages: 0 };
  }
}

// GET RELATED EVENTS: EVENTS WITH SAME CATEGORY
export async function getRelatedEventsByCategory({
  categoryId,
  eventId,
  limit = 3,
  page = 1,
}: GetRelatedEventsByCategoryParams) {
  try {
    await connectToDatabase();

    const skipAmount = (Number(page) - 1) * limit;
    const conditions = {
      $and: [{ category: categoryId }, { _id: { $ne: eventId } }],
    };

    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(limit);

    const events = await populateEvent(eventsQuery);
    const eventsCount = await Event.countDocuments(conditions);

    return {
      data: JSON.parse(JSON.stringify(events)),
      totalPages: Math.ceil(eventsCount / limit),
    };
  } catch (error) {
    handleError(error);
    return { data: [], totalPages: 0 };
  }
}

// GET EVENTS BY KJ (KJ Dashboard) — accepts a Clerk id and resolves it
export async function getEventsByKJ(kjClerkId: string) {
  try {
    await connectToDatabase();

    const kj = await User.findOne({ clerkId: kjClerkId });
    if (!kj) return [];

    const events = await populateEvent(Event.find({ kj: kj._id }))
      .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(events));
  } catch (error) {
    handleError(error);
  }
}

// GET EVENTS WITH REGISTRATION DETAILS (KJ Dashboard) — accepts a Clerk id
export async function getEventsWithRegistrations(kjClerkId: string) {
  try {
    await connectToDatabase();

    const kj = await User.findOne({ clerkId: kjClerkId });
    if (!kj) return [];

    const events = await Event.find({ kj: kj._id })
      .populate({
        path: 'category',
        model: Category,
        select: '_id name'
      })
      .populate({
        path: 'venue',
        model: Venue,
        select: '_id name address'
      })
      .populate({
        path: 'kj',
        model: User,
        select: '_id firstName lastName'
      })
      .sort({ startDateTime: 1 });

    // Get registration stats for each event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const stats = await EventRegistration.aggregate([
          { $match: { eventId: event._id } },
          {
            $group: {
              _id: null,
              totalInterested: {
                $sum: { $cond: [{ $eq: ['$registrationType', 'interested'] }, 1, 0] }
              },
              totalRegistered: {
                $sum: { $cond: [{ $eq: ['$registrationType', 'registered'] }, 1, 0] }
              },
              totalPending: {
                $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
              },
              totalApproved: {
                $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
              },
            }
          }
        ]);

        return {
          ...JSON.parse(JSON.stringify(event)),
          stats: stats[0] || {
            totalInterested: 0,
            totalRegistered: 0,
            totalPending: 0,
            totalApproved: 0
          }
        };
      })
    );

    return eventsWithStats;
  } catch (error) {
    handleError(error);
  }
}

// UPDATE EVENT STATUS
export async function updateEventStatus(eventId: string, status: 'draft' | 'published' | 'cancelled' | 'completed') {
  try {
    await connectToDatabase();

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { status },
      { new: true }
    );

    revalidatePath('/');
    return JSON.parse(JSON.stringify(updatedEvent));
  } catch (error) {
    handleErrorThrow(error);
  }
}
