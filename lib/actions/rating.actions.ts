'use server';

import { connectToDatabase } from '@/lib/database';
import { Rating } from '@/lib/database/models/rating.model';
import { createNotification } from './notification.actions';
import { handleError } from '@/lib/utils';

export interface CreateRatingParams {
  eventId: string;
  raterId: string;
  rateeId: string;
  rating: number;
  review?: string;
  type: 'kj_rating' | 'ks_rating';
}

export async function createRating(params: CreateRatingParams) {
  try {
    await connectToDatabase();

    // Check if user already rated
    const existingRating = await Rating.findOne({
      eventId: params.eventId,
      raterId: params.raterId,
      rateeId: params.rateeId
    });

    if (existingRating) {
      throw new Error('You have already rated this user for this event');
    }

    const rating = await Rating.create(params);

    // Create notification for the rated user
    const title = params.type === 'kj_rating' ? 'New KJ Rating' : 'New Singer Rating';
    const message = params.type === 'kj_rating' 
      ? `You received a ${params.rating}/5 star rating for your event`
      : `You received a ${params.rating}/5 star rating from the KJ`;

    await createNotification({
      userId: params.rateeId,
      type: 'rating',
      title,
      message,
      data: { eventId: params.eventId, rating: params.rating }
    });

    return JSON.parse(JSON.stringify(rating));
  } catch (error) {
    handleError(error);
  }
}

export async function getUserRating(userId: string) {
  try {
    await connectToDatabase();

    const ratings = await Rating.find({ rateeId: userId });
    if (ratings.length === 0) return { average: 0, count: 0, ratings: [] };

    const average = ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length;
    
    return {
      average: Math.round(average * 10) / 10,
      count: ratings.length,
      ratings: JSON.parse(JSON.stringify(ratings))
    };
  } catch (error) {
    handleError(error);
    return { average: 0, count: 0, ratings: [] };
  }
}

export async function getEventRatings(eventId: string) {
  try {
    await connectToDatabase();

    const ratings = await Rating.find({ eventId })
      .populate('raterId', 'firstName lastName')
      .populate('rateeId', 'firstName lastName');

    return JSON.parse(JSON.stringify(ratings));
  } catch (error) {
    handleError(error);
    return [];
  }
}

export async function getUserRatingsForEvent(eventId: string, userId: string) {
  try {
    await connectToDatabase();

    const ratings = await Rating.find({
      eventId,
      $or: [{ raterId: userId }, { rateeId: userId }]
    });

    return JSON.parse(JSON.stringify(ratings));
  } catch (error) {
    handleError(error);
    return [];
  }
}