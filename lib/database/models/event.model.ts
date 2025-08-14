import { model, models, Schema } from "mongoose";

// Model design for events base on Schema through interface
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
  organizer: { _id: string; firstName: string; lastName: string; isPromoter: boolean };
  host: { _id: string; firstName: string; lastName: string; isHost: boolean };
  
  // New fields for enhanced event management
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
  organizer: { type: Schema.Types.ObjectId, ref: "User" },
  host: { type: Schema.Types.ObjectId, ref: "User", required: true },
  
  // New fields for enhanced event management
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
EventSchema.index({ host: 1, status: 1 });
EventSchema.index({ startDateTime: 1, status: 1 });
EventSchema.index({ category: 1, startDateTime: 1 });

const Event = models.Event || model("Event", EventSchema);
export default Event;