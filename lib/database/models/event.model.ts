import { model, models, Schema } from "mongoose";

// Model design for events.
//
// Phase 1 canonical role vocabulary:
//   kj       -> the Karaoke Jockey: event host/director who runs the night
//               and approves singer (KS) registrations. Requires Promoter approval.
//   promoter -> the Promoter: venue owner/location host (optional on an event;
//               set automatically when the event references a Venue).
//   venue    -> the physical location (owned by a Promoter), when known.
export interface IEvent {
  _id: string;
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  createdAt: Date;
  startDateTime: Date;
  endDateTime: Date;
  tickets: number;
  price: number;
  isFree: boolean;
  eventUrl: string;
  category: { _id: string; name: string };
  promoter?: { _id: string; firstName: string; lastName: string; isPromoter: boolean } | null;
  kj: { _id: string; firstName: string; lastName: string; isHost: boolean; kjVerificationStatus?: string };
  venue?: { _id: string; name: string; address: string } | null;

  // Enhanced event management fields
  capacity: number;
  registrationDeadline: Date;
  autoApprove: boolean;
  equipment: string[];
  songList: string[];
  registrationSettings: {
    allowGroupRegistration: boolean;
    maxGroupSize: number;
    requireSongRequests: boolean;
    allowSongRequests: boolean;
  };
  status: 'draft' | 'published' | 'cancelled' | 'completed';
}

// Enhanced Schema design for events
const EventSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now, required: true },
  startDateTime: { type: Date, default: Date.now, required: true },
  endDateTime: { type: Date, default: Date.now, required: true },
  tickets: { type: Number },
  price: { type: Number },
  isFree: { type: Boolean, default: false },
  eventUrl: { type: String },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  // Promoter = venue owner/location host (optional; derived from venue when set)
  promoter: { type: Schema.Types.ObjectId, ref: "User", default: null },
  // KJ = Karaoke Jockey, the event host/director (required)
  kj: { type: Schema.Types.ObjectId, ref: "User", required: true },
  // Physical venue (owned by a Promoter), when the event has one
  venue: { type: Schema.Types.ObjectId, ref: "Venue", default: null },

  // Enhanced event management fields
  capacity: { type: Number, required: true, min: 1 },
  registrationDeadline: { type: Date },
  autoApprove: { type: Boolean, default: false },
  equipment: [{ type: String }], // KJ's available equipment
  songList: [{ type: String }], // Available songs for the event

  registrationSettings: {
    allowGroupRegistration: { type: Boolean, default: true },
    maxGroupSize: { type: Number, default: 5, min: 1, max: 20 },
    requireSongRequests: { type: Boolean, default: false },
    allowSongRequests: { type: Boolean, default: true },
  },

  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
});

// Indexes for better query performance
EventSchema.index({ kj: 1, status: 1 });
EventSchema.index({ promoter: 1, status: 1 });
EventSchema.index({ venue: 1, startDateTime: 1 });
EventSchema.index({ startDateTime: 1, status: 1 });
EventSchema.index({ category: 1, startDateTime: 1 });

const Event = models.Event || model("Event", EventSchema);
export default Event;
