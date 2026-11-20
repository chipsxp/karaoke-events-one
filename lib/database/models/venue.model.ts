import { models, model, Schema } from "mongoose";

// Venue: the physical location/business owned or run by a Promoter.
// Events reference a Venue so KSs can see exactly where an event happens
// (and later, Phase 3, a mini-map with geo coordinates).
export interface IVenue {
  _id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  description?: string;
  capacity?: number;
  photos: string[];
  ownedBy: string | { _id: string; firstName: string; lastName: string };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VenueSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  description: { type: String },
  capacity: { type: Number, min: 1 },
  photos: [{ type: String }],
  ownedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

VenueSchema.index({ ownedBy: 1, isActive: 1 });
VenueSchema.index({ name: 1 });

const Venue = models.Venue || model("Venue", VenueSchema);
export default Venue;
