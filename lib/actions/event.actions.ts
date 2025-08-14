"use server";

import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/lib/database";
import Event from "@/lib/database/models/event.model";
import EventRegistration from "@/lib/database/models/eventRegistration.model";
import User from "@/lib/database/models/user.model";
import Category from "@/lib/database/models/category.model";
import { handleError } from "@/lib/utils";

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
      path: "organizer",
      model: User,
      select: "_id firstName lastName",
    })
    .populate({ path: "category", model: Category, select: "_id name" });
};

// CREATE
export async function createEvent({ userId, event, path }: CreateEventParams) {
  try {
    await connectToDatabase();

    const organizer = await User.findOne({ clerkId: userId });
    if (!organizer) throw new Error("Organizer not found");

    const newEvent = await Event.create({
      ...event,
      category: event.categoryId,
      organizer: organizer._id,
      host: organizer._id,
    });
    revalidatePath(path);

    return JSON.parse(JSON.stringify(newEvent));
  } catch (error) {
    handleError(error);
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

// UPDATE
export async function updateEvent({ userId, event, path }: UpdateEventParams) {
  try {
    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found");

    const eventToUpdate = await Event.findById(event._id);
    if (!eventToUpdate || eventToUpdate.organizer.toHexString() !== user._id.toHexString()) {
      throw new Error("Unauthorized or event not found");
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      { ...event, category: event.categoryId },
      { new: true }
    );
    revalidatePath(path);

    return JSON.parse(JSON.stringify(updatedEvent));
  } catch (error) {
    handleError(error);
  }
}

// DELETE
export async function deleteEvent({ eventId, path }: DeleteEventParams) {
  try {
    await connectToDatabase();

    const deletedEvent = await Event.findByIdAndDelete(eventId);
    if (deletedEvent) revalidatePath(path);
  } catch (error) {
    handleError(error);
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
  }
}

// GET EVENTS BY ORGANIZER
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

    const conditions = { organizer: user._id };
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
  }
}

// GET EVENTS BY HOST (KJ Dashboard)
export async function getEventsByHost(hostId: string) {
  try {
    await connectToDatabase();

    const events = await populateEvent(Event.find({ host: hostId }))
      .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(events));
  } catch (error) {
    handleError(error);
  }
}

// GET EVENTS WITH REGISTRATION DETAILS (KJ Dashboard)
export async function getEventsWithRegistrations(hostId: string) {
  try {
    await connectToDatabase();

    const events = await Event.find({ host: hostId })
      .populate({
        path: 'category',
        model: Category,
        select: '_id name'
      })
      .populate({
        path: 'host',
        model: User,
        select: '_id firstName lastName'
      })
      .sort({ startDateTime: 1 });

    // Get registration stats for each event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const stats = await EventRegistration.aggregate([
          { $match: { eventId: event._id.toString() } },
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
    handleError(error);
  }
}
