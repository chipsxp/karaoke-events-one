"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import Venue from "@/lib/database/models/venue.model";
import User from "@/lib/database/models/user.model";
import { handleError, handleErrorThrow } from "@/lib/utils";
import { CreateVenueParams } from "@/types";

// CREATE a venue (Promoter only — the Promoter owns/runs the location)
export async function createVenue({ promoterId, venue, path }: CreateVenueParams) {
  try {
    await connectToDatabase();

    const promoter = await User.findOne({ clerkId: promoterId });
    if (!promoter) throw new Error("Promoter not found");
    if (promoter.role !== "Promoter") {
      throw new Error("Only Promoters can create venues");
    }

    const newVenue = await Venue.create({
      ...venue,
      ownedBy: promoter._id,
    });

    if (path) revalidatePath(path);
    return JSON.parse(JSON.stringify(newVenue));
  } catch (error) {
    handleErrorThrow(error);
  }
}

// GET venues owned by a Promoter (by Clerk id)
export async function getVenuesByPromoter(promoterId: string) {
  try {
    await connectToDatabase();

    const promoter = await User.findOne({ clerkId: promoterId });
    if (!promoter) return [];

    const venues = await Venue.find({ ownedBy: promoter._id }).sort({
      createdAt: -1,
    });

    return JSON.parse(JSON.stringify(venues));
  } catch (error) {
    handleError(error);
    return [];
  }
}

// GET all active venues (used by the KJ event form to pick a location)
export async function getAllActiveVenues() {
  try {
    await connectToDatabase();

    const venues = await Venue.find({ isActive: true })
      .populate({
        path: "ownedBy",
        model: User,
        select: "_id firstName lastName",
      })
      .sort({ name: 1 });

    return JSON.parse(JSON.stringify(venues));
  } catch (error) {
    handleError(error);
    return [];
  }
}

// GET one venue by id
export async function getVenueById(venueId: string) {
  try {
    await connectToDatabase();

    const venue = await Venue.findById(venueId).populate({
      path: "ownedBy",
      model: User,
      select: "_id firstName lastName",
    });

    if (!venue) throw new Error("Venue not found");
    return JSON.parse(JSON.stringify(venue));
  } catch (error) {
    handleError(error);
  }
}

// SOFT-DELETE a venue (Promoter only, must own it)
export async function deactivateVenue(venueId: string, promoterId: string) {
  try {
    await connectToDatabase();

    const promoter = await User.findOne({ clerkId: promoterId });
    if (!promoter || promoter.role !== "Promoter") {
      throw new Error("Only Promoters can manage venues");
    }

    const venue = await Venue.findOneAndUpdate(
      { _id: venueId, ownedBy: promoter._id },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!venue) throw new Error("Venue not found");

    revalidatePath("/dashboard");
    return JSON.parse(JSON.stringify(venue));
  } catch (error) {
    handleErrorThrow(error);
  }
}
