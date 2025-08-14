"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../database";
import EventRegistration from "../database/models/eventRegistration.model";
import User from "../database/models/user.model";
import Event from "../database/models/event.model";
import { CreateEventRegistrationParams, UpdateEventRegistrationParams, GetEventRegistrationsParams } from "@/types";
import { handleError } from "../utils";

// Create a new event registration (interest or registration)
export async function createEventRegistration({
  eventId,
  userId,
  registrationType,
  songRequests = [],
  groupSize = 1,
}: CreateEventRegistrationParams) {
  try {
    await connectToDatabase();

    // Find the user by clerkId to get the MongoDB ObjectId
    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found");

    // Check if user is already registered/interested
    const existingRegistration = await EventRegistration.findOne({
      eventId,
      userId: user._id,
    });

    if (existingRegistration) {
      // Update existing registration if changing from interested to registered
      if (registrationType === 'registered' && existingRegistration.registrationType === 'interested') {
        existingRegistration.registrationType = 'registered';
        existingRegistration.songRequests = songRequests;
        existingRegistration.groupSize = groupSize;
        existingRegistration.status = 'pending';
        await existingRegistration.save();

        revalidatePath(`/events/${eventId}`);
        return JSON.parse(JSON.stringify(existingRegistration));
      }

      throw new Error("You have already registered your interest for this event");
    }

    const newRegistration = await EventRegistration.create({
      eventId,
      userId: user._id,
      registrationType,
      songRequests,
      groupSize,
      status: registrationType === 'interested' ? 'interested' : 'pending',
    });

    revalidatePath(`/events/${eventId}`);
    return JSON.parse(JSON.stringify(newRegistration));
  } catch (error) {
    handleError(error);
  }
}

// Get all registrations for an event
export async function getEventRegistrations({
  eventId,
  registrationType,
  status,
}: GetEventRegistrationsParams) {
  try {
    await connectToDatabase();

    const query: any = { eventId };
    if (registrationType) query.registrationType = registrationType;
    if (status) query.status = status;

    const registrations = await EventRegistration.find(query)
      .populate({
        path: 'userId',
        model: User,
        select: 'firstName lastName emailId photoAvatar',
      })
      .populate({
        path: 'approvedBy',
        model: User,
        select: 'firstName lastName',
      })
      .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(registrations));
  } catch (error) {
    handleError(error);
  }
}

// Update event registration
export async function updateEventRegistration({
  registrationId,
  userId,
  songRequests,
  groupSize,
  status,
}: UpdateEventRegistrationParams) {
  try {
    await connectToDatabase();

    // Find the user by clerkId to get the MongoDB ObjectId
    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found");

    const updateData: any = {};
    if (songRequests) updateData.songRequests = songRequests;
    if (groupSize) updateData.groupSize = groupSize;
    if (status) updateData.status = status;

    const updatedRegistration = await EventRegistration.findOneAndUpdate(
      { _id: registrationId, userId: user._id },
      updateData,
      { new: true }
    );

    if (!updatedRegistration) throw new Error("Registration not found");

    revalidatePath(`/events/${updatedRegistration.eventId}`);
    return JSON.parse(JSON.stringify(updatedRegistration));
  } catch (error) {
    handleError(error);
  }
}

// Delete event registration
export async function deleteEventRegistration(registrationId: string) {
  try {
    await connectToDatabase();

    const deletedRegistration = await EventRegistration.findByIdAndDelete(registrationId);
    
    if (!deletedRegistration) throw new Error("Registration not found");
    
    revalidatePath(`/events/${deletedRegistration.eventId}`);
    return JSON.parse(JSON.stringify(deletedRegistration));
  } catch (error) {
    handleError(error);
  }
}

// Get all registrations for an event with filtering
export async function getEventRegistrationsWithDetails({
  eventId,
  registrationType,
  status,
}: {
  eventId: string;
  registrationType?: 'interested' | 'registered';
  status?: string;
}) {
  try {
    await connectToDatabase();

    const query: any = { eventId };
    if (registrationType) query.registrationType = registrationType;
    if (status) query.status = status;

    const registrations = await EventRegistration.find(query)
      .populate({
        path: 'userId',
        model: User,
        select: 'firstName lastName emailId photoAvatar vocalRange preferredGenres',
      })
      .populate({
        path: 'approvedBy',
        model: User,
        select: 'firstName lastName',
      })
      .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(registrations));
  } catch (error) {
    handleError(error);
  }
}

// Get registration statistics for an event
export async function getEventRegistrationStats(eventId: string) {
  try {
    await connectToDatabase();

    const stats = await EventRegistration.aggregate([
      { $match: { eventId: eventId } },
      {
        $group: {
          _id: null,
          totalInterested: {
            $sum: { $cond: [{ $eq: ['$registrationType', 'interested'] }, 1, 0] }
          },
          totalRegistered: {
            $sum: { $cond: [{ $eq: ['$registrationType', 'registered'] }, 1, 0] }
          },
          totalApproved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          totalPending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          totalAttended: {
            $sum: { $cond: [{ $eq: ['$status', 'attended'] }, 1, 0] }
          },
        }
      }
    ]);

    return stats[0] || {
      totalInterested: 0,
      totalRegistered: 0,
      totalApproved: 0,
      totalPending: 0,
      totalAttended: 0,
    };
  } catch (error) {
    handleError(error);
  }
}

// Approve a registration (KJ action)
export async function approveRegistration({
  registrationId,
  approvedBy,
}: {
  registrationId: string;
  approvedBy: string;
}) {
  try {
    await connectToDatabase();

    // Find the user by clerkId to get the MongoDB ObjectId
    const user = await User.findOne({ clerkId: approvedBy });
    if (!user) throw new Error("User not found");

    const updatedRegistration = await EventRegistration.findOneAndUpdate(
      { _id: registrationId },
      {
        status: 'approved',
        approvedBy: user._id,
        approvedAt: new Date(),
      },
      { new: true }
    )
      .populate({
        path: 'userId',
        model: User,
        select: 'firstName lastName emailId',
      });

    if (!updatedRegistration) throw new Error("Registration not found");

    revalidatePath(`/events/${updatedRegistration.eventId}`);
    return JSON.parse(JSON.stringify(updatedRegistration));
  } catch (error) {
    handleError(error);
  }
}

// Reject a registration (KJ action)
export async function rejectRegistration({
  registrationId,
  approvedBy,
  notes,
}: {
  registrationId: string;
  approvedBy: string;
  notes?: string;
}) {
  try {
    await connectToDatabase();

    // Find the user by clerkId to get the MongoDB ObjectId
    const user = await User.findOne({ clerkId: approvedBy });
    if (!user) throw new Error("User not found");

    const updatedRegistration = await EventRegistration.findOneAndUpdate(
      { _id: registrationId },
      {
        status: 'rejected',
        approvedBy: user._id,
        notes: notes,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedRegistration) throw new Error("Registration not found");

    revalidatePath(`/events/${updatedRegistration.eventId}`);
    return JSON.parse(JSON.stringify(updatedRegistration));
  } catch (error) {
    handleError(error);
  }
}

// Mark attendance for a registration
export async function markAttendance(registrationId: string) {
  try {
    await connectToDatabase();

    const updatedRegistration = await EventRegistration.findOneAndUpdate(
      { _id: registrationId },
      {
        status: 'attended',
        attendedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedRegistration) throw new Error("Registration not found");
    
    revalidatePath(`/events/${updatedRegistration.eventId}`);
    return JSON.parse(JSON.stringify(updatedRegistration));
  } catch (error) {
    handleError(error);
  }
}

// Get user's registrations with event details
export async function getUserRegistrationsWithEvents(userId: string) {
  try {
    await connectToDatabase();

    // Find the user by clerkId to get the MongoDB ObjectId
    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found");

    const registrations = await EventRegistration.find({ userId: user._id })
      .populate({
        path: 'eventId',
        model: Event,
        populate: {
          path: 'host',
          model: User,
          select: 'firstName lastName',
        }
      })
      .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(registrations));
  } catch (error) {
    handleError(error);
  }
}

// Check if user can register for event (considering capacity and registration deadline)
export async function canUserRegisterForEvent(eventId: string, userId: string) {
  try {
    await connectToDatabase();

    const event = await Event.findById(eventId);
    if (!event) throw new Error("Event not found");

    // Check if registration deadline has passed
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return { canRegister: false, reason: "Registration deadline has passed" };
    }

    // Check if event is full
    const approvedRegistrations = await EventRegistration.countDocuments({
      eventId,
      status: 'approved',
    });

    if (approvedRegistrations >= event.capacity) {
      return { canRegister: false, reason: "Event is full" };
    }

    // Find the user by clerkId to get the MongoDB ObjectId
    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found");

    // Check if user already registered
    const existingRegistration = await EventRegistration.findOne({
      eventId,
      userId: user._id,
    });

    if (existingRegistration && existingRegistration.registrationType === 'registered') {
      return { canRegister: false, reason: "You are already registered for this event" };
    }

    return { canRegister: true };
  } catch (error) {
    handleError(error);
  }
}