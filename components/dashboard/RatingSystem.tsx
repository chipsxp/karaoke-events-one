'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  createRating,
  getUserRating,
  getUserRatingsForEvent,
} from '@/lib/actions/rating.actions';

interface Rating {
  _id: string;
  raterId: string;
  rateeId: string;
  rating: number;
  review?: string;
  type: 'kj_rating' | 'ks_rating';
  createdAt: string;
}

interface RatingSystemProps {
  eventId: string;
  currentUserId: string;
  targetUserId: string;
  targetUserName: string;
  type: 'kj_rating' | 'ks_rating';
  onRatingComplete?: () => void;
}

export function RatingSystem({
  eventId,
  currentUserId,
  targetUserId,
  targetUserName,
  type,
  onRatingComplete,
}: RatingSystemProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [existingRating, setExistingRating] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    checkExistingRating();
  }, [eventId, currentUserId, targetUserId]);

  const checkExistingRating = async () => {
    try {
      const ratings = await getUserRatingsForEvent(eventId, currentUserId);
      const existing = ratings.find(
        (r: Rating) => r.rateeId === targetUserId && r.raterId === currentUserId
      );
      if (existing) {
        setExistingRating(existing);
        setRating(existing.rating);
        setReview(existing.review || '');
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error checking existing rating:', error);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) return;

    setLoading(true);
    try {
      await createRating({
        eventId,
        raterId: currentUserId,
        rateeId: targetUserId,
        rating,
        review,
        type,
      });
      setSubmitted(true);
      onRatingComplete?.();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ interactive = true }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-6 w-6 cursor-pointer transition-colors ${
            (interactive ? hoveredRating || rating : rating) >= star
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
          onClick={() => interactive && setRating(star)}
          onMouseEnter={() => interactive && setHoveredRating(star)}
          onMouseLeave={() => interactive && setHoveredRating(0)}
        />
      ))}
    </div>
  );

  if (submitted && existingRating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">You rated {targetUserName}:</p>
              <StarRating interactive={false} />
            </div>
            {review && (
              <div>
                <p className="text-sm font-medium mb-2">Your review:</p>
                <p className="text-sm text-muted-foreground">{review}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Rate {targetUserName}
          <Badge variant="outline" className="ml-2">
            {type === 'kj_rating' ? 'KJ Rating' : 'Singer Rating'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select your rating
            </label>
            <StarRating />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Add a review (optional)
            </label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience..."
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {review.length}/500 characters
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || loading}
            className="w-full"
          >
            {loading ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function RatingDisplay({ userId }: { userId: string }) {
  const [ratingData, setRatingData] = useState<{
    average: number;
    count: number;
    ratings: Rating[];
  }>({ average: 0, count: 0, ratings: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserRating();
  }, [userId]);

  const loadUserRating = async () => {
    try {
      const data = await getUserRating(userId);
      setRatingData(data);
    } catch (error) {
      console.error('Error loading user rating:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (ratingData.count === 0) {
    return (
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 text-gray-300" />
        <span className="text-sm text-muted-foreground">No ratings yet</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= ratingData.average
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-medium">
        {ratingData.average} ({ratingData.count} ratings)
      </span>
    </div>
  );
}