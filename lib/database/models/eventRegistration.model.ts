import { models, model, Schema } from "mongoose";

// Schema for tracking KS registrations and interest in events
export const EventRegistrationSchema = new Schema({
  eventId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Registration type and status
  registrationType: { 
    type: String, 
    enum: ['interested', 'registered'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['interested', 'pending', 'approved', 'rejected', 'attended'], 
    default: 'pending' 
  },
  
  // Who approved/rejected this registration
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Additional information
  notes: { type: String }, // KJ notes about the registration
  registeredAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  attendedAt: { type: Date }, // When KS actually attended
  
  // KS preferences for this event
  songRequests: [{ type: String }], // Songs KS wants to sing
  groupSize: { type: Number, default: 1 }, // Number of people attending with KS
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Compound index to prevent duplicate registrations
EventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

// Indexes for queries
EventRegistrationSchema.index({ eventId: 1, status: 1 });
EventRegistrationSchema.index({ userId: 1, registrationType: 1 });
EventRegistrationSchema.index({ approvedBy: 1 });

const EventRegistration = models.EventRegistration || model("EventRegistration", EventRegistrationSchema);
export default EventRegistration;