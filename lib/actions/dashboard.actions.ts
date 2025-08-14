"use server";

import { connectToDatabase } from "../database";
import Event from "../database/models/event.model";
import EventRegistration from "../database/models/eventRegistration.model";
import User from "../database/models/user.model";
import { handleError } from "../utils";

// KJ Dashboard Actions

// Get KJ dashboard overview data
export async function getKJDashboardData(kjId: string) {
  try {
    await connectToDatabase();

    const [
      totalEvents,
      pendingRegistrations,
      upcomingEvents,
      recentRegistrations
    ] = await Promise.all([
      // Total events created by KJ
      Event.countDocuments({ host: kjId }),
      
      // Pending registrations across all KJ events
      EventRegistration.countDocuments({
        eventId: { $in: await Event.find({ host: kjId }).distinct('_id') },
        status: 'pending'
      }),
      
      // Upcoming events
      Event.countDocuments({
        host: kjId,
        startDateTime: { $gte: new Date() },
        status: 'published'
      }),
      
      // Recent registrations (last 7 days)
      EventRegistration.find({
        eventId: { $in: await Event.find({ host: kjId }).distinct('_id') },
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
      .populate({
        path: 'userId',
        model: User,
        select: 'firstName lastName photoAvatar'
      })
      .populate({
        path: 'eventId',
        model: Event,
        select: 'title startDateTime'
      })
      .sort({ createdAt: -1 })
      .limit(10)
    ]);

    return {
      totalEvents,
      pendingRegistrations,
      upcomingEvents,
      recentRegistrations: JSON.parse(JSON.stringify(recentRegistrations))
    };
  } catch (error) {
    handleError(error);
  }
}

// Get detailed registration queue for KJ
export async function getKJRegistrationQueue(kjId: string) {
  try {
    await connectToDatabase();

    const events = await Event.find({ host: kjId })
      .select('_id title startDateTime')
      .sort({ startDateTime: 1 });

    const registrations = await EventRegistration.find({
      eventId: { $in: events.map(e => e._id) },
      status: 'pending'
    })
    .populate({
      path: 'userId',
      model: User,
      select: 'firstName lastName emailId photoAvatar vocalRange preferredGenres'
    })
    .populate({
      path: 'eventId',
      model: Event,
      select: 'title startDateTime capacity'
    })
    .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(registrations));
  } catch (error) {
    handleError(error);
  }
}

// KS Dashboard Actions

// Get KS dashboard data
export async function getKSDashboardData(ksId: string) {
  try {
    await connectToDatabase();

    const [
      registeredEvents,
      interestedEvents,
      attendedEvents,
      upcomingRegistrations
    ] = await Promise.all([
      // Events where KS is registered
      EventRegistration.countDocuments({
        userId: ksId,
        registrationType: 'registered',
        status: { $in: ['approved', 'pending'] }
      }),
      
      // Events where KS marked as interested
      EventRegistration.countDocuments({
        userId: ksId,
        registrationType: 'interested'
      }),
      
      // Events attended by KS
      EventRegistration.countDocuments({
        userId: ksId,
        status: 'attended'
      }),
      
      // Upcoming registered events
      EventRegistration.find({
        userId: ksId,
        registrationType: 'registered',
        status: 'approved'
      })
      .populate({
        path: 'eventId',
        model: Event,
        populate: [
          { path: 'category', model: 'Category', select: 'name' },
          { path: 'host', model: 'User', select: 'firstName lastName' }
        ]
      })
      .sort({ 'eventId.startDateTime': 1 })
      .limit(5)
    ]);

    return {
      registeredEvents,
      interestedEvents,
      attendedEvents,
      upcomingRegistrations: JSON.parse(JSON.stringify(upcomingRegistrations))
    };
  } catch (error) {
    handleError(error);
  }
}

// Get KS event history
export async function getKSEventHistory(ksId: string) {
  try {
    await connectToDatabase();

    const registrations = await EventRegistration.find({
      userId: ksId
    })
    .populate({
      path: 'eventId',
      model: Event,
      populate: [
        { path: 'category', model: 'Category', select: 'name' },
        { path: 'host', model: 'User', select: 'firstName lastName' }
      ]
    })
    .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(registrations));
  } catch (error) {
    handleError(error);
  }
}

// Get interested events for KS
export async function getKSInterestedEvents(ksId: string) {
  try {
    await connectToDatabase();

    const registrations = await EventRegistration.find({
      userId: ksId,
      registrationType: 'interested'
    })
    .populate({
      path: 'eventId',
      model: Event,
      populate: [
        { path: 'category', model: 'Category', select: 'name' },
        { path: 'host', model: 'User', select: 'firstName lastName' }
      ]
    })
    .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(registrations));
  } catch (error) {
    handleError(error);
  }
}